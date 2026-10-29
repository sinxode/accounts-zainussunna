// ==============================================================================
// ZLS Controlled Staging User Acceptance Testing (UAT) Suite
// File: tests/staging_uat/test_staging_uat_workflows.js
// Executes Phase C synthetic workflow verifications against isolated staging DB (zls_staging_uat).
// ==============================================================================

const { execSync } = require('child_process');

const DB = 'zls_staging_uat';

function runSql(sql) {
  try {
    const cmd = `psql -h localhost -U apple -d ${DB} -v ON_ERROR_STOP=1 -t -A -c "${sql.replace(/"/g, '\\"')}"`;
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch (err) {
    return `ERROR: ${err.stderr || err.message}`;
  }
}

let passCount = 0;
let failCount = 0;

function assertUAT(code, title, condition, details = '') {
  if (condition) {
    console.log(`  [PASS] UAT-${code}: ${title}`);
    passCount++;
  } else {
    console.log(`  [FAIL] UAT-${code}: ${title}`);
    if (details) console.log(`         Details: ${details}`);
    failCount++;
  }
}

console.log('================================================================');
console.log('=== ZLS REBUILD: PROMPT 9 CONTROLLED STAGING UAT SUITE       ===');
console.log('=== Target Database: zls_staging_uat (Isolated Local Staging) ===');
console.log('================================================================\n');

// ------------------------------------------------------------------
// 0. SEED SYNTHETIC STAGING TEST FIXTURES
// ------------------------------------------------------------------
runSql(`
  RESET ROLE;
  GRANT USAGE ON SCHEMA public TO anon, authenticated;
  GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
  GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
  GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

  -- Clean all operational tables cleanly
  TRUNCATE TABLE 
    public.accounting_periods,
    public.audit_logs,
    public.batch_members,
    public.saved_batches,
    public.transaction_presets,
    public.internal_loan_repayments,
    public.internal_loans,
    public.recoveries,
    public.borrower_loans,
    public.borrowers,
    public.parent_students,
    public.transactions,
    public.students,
    public.profiles
  CASCADE;

  -- 1. Synthetic Auth Users & Profiles
  INSERT INTO auth.users (id, email) VALUES
    ('11111111-0000-0000-0000-000000000001', 'superadmin@zls.test'),
    ('22222222-0000-0000-0000-000000000002', 'admin@zls.test'),
    ('33333333-0000-0000-0000-000000000003', 'faculty@zls.test'),
    ('44444444-0000-0000-0000-000000000004', 'parent@zls.test')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, full_name, role, is_active) VALUES
    ('11111111-0000-0000-0000-000000000001', 'UAT Super Admin', 'super_admin', true),
    ('22222222-0000-0000-0000-000000000002', 'UAT Operations Admin', 'admin', true),
    ('33333333-0000-0000-0000-000000000003', 'UAT Academic Faculty', 'faculty', true),
    ('44444444-0000-0000-0000-000000000004', 'UAT Student Guardian', 'parent', true);

  -- 2. Synthetic Students
  INSERT INTO public.students (id, enrolment_no, name, status) VALUES
    ('aaaaaaaa-0000-0000-0000-000000000001', 'SYN-001', 'Synthetic Student Alpha', 'active'),
    ('bbbbbbbb-0000-0000-0000-000000000002', 'SYN-002', 'Synthetic Student Beta', 'active'),
    ('cccccccc-0000-0000-0000-000000000003', 'SYN-003', 'Synthetic Student Gamma', 'archived');

  -- 3. Parent-Student Link (Guardian linked only to Student Alpha)
  INSERT INTO public.parent_students (parent_profile_id, student_id, relationship_type) VALUES
    ('44444444-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000001', 'mother');

  -- 4. Synthetic External Borrower & Loan
  INSERT INTO public.borrowers (id, name, phone, risk_level, status) VALUES
    ('eeeeeeee-0000-0000-0000-000000000001', 'Synthetic Contractor Nasir', '+919999988888', 'medium', 'active');

  INSERT INTO public.borrower_loans (id, borrower_id, loan_amount, loan_date, purpose, status) VALUES
    ('ffffffff-0000-0000-0000-000000000001', 'eeeeeeee-0000-0000-0000-000000000001', 5000.00, CURRENT_DATE, 'Hostel Maintenance Material', 'active');
`);

// ------------------------------------------------------------------
// 1. AUTHENTICATION AND PERMISSIONS
// ------------------------------------------------------------------
console.log('--- 1. Authentication and Permissions ---');

// 1.1 Super Admin assigns role
const saRoleRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '11111111-0000-0000-0000-000000000001';
  SELECT public.admin_set_user_role('33333333-0000-0000-0000-000000000003', 'faculty');
`);
assertUAT('1.1', 'Super Admin can successfully manage users and assign roles',
  saRoleRes.includes('"success": true'), saRoleRes);

// 1.2 Admin blocked from assigning roles
const adminRoleRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-0000-0000-0000-000000000002';
  SELECT public.admin_set_user_role('33333333-0000-0000-0000-000000000003', 'admin');
`);
assertUAT('1.2', 'Authorized Admin cannot assign user roles or escalate privileges (FORBIDDEN)',
  adminRoleRes.includes('FORBIDDEN') || adminRoleRes.includes('ERROR'), adminRoleRes);

// 1.3 Faculty can view student information
const facultyReadRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '33333333-0000-0000-0000-000000000003';
  SELECT count(*) FROM public.students;
`);
assertUAT('1.3', 'Faculty can read student directory records (read-only)',
  facultyReadRes === '3', `count: ${facultyReadRes}`);

// 1.4 Faculty cannot mutate financial or student data
const facultyWriteRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '33333333-0000-0000-0000-000000000003';
  INSERT INTO public.students (enrolment_no, name) VALUES ('SYN-999', 'Hacked Student');
`);
assertUAT('1.4', 'Faculty cannot insert or mutate student or financial records (RLS enforced)',
  facultyWriteRes.includes('ERROR'), facultyWriteRes);

// 1.5 Parent can view only linked child
const parentLinkedRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '44444444-0000-0000-0000-000000000004';
  SELECT name FROM public.students WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';
`);
const parentStrangerRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '44444444-0000-0000-0000-000000000004';
  SELECT count(*) FROM public.students WHERE id = 'bbbbbbbb-0000-0000-0000-000000000002';
`);
assertUAT('1.5', 'Parent can access linked child and receives 0 rows for unlinked stranger students',
  parentLinkedRes.includes('Synthetic Student Alpha') && parentStrangerRes === '0',
  `linked: ${parentLinkedRes}, stranger: ${parentStrangerRes}`);

// ------------------------------------------------------------------
// 2. DEPOSITS AND WITHDRAWALS
// ------------------------------------------------------------------
console.log('\n--- 2. Deposits and Withdrawals ---');

const depKey1 = 'd0000001-0000-0000-0000-000000000001';
const depPostRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-0000-0000-0000-000000000002';
  SELECT public.rpc_post_transaction(
    'aaaaaaaa-0000-0000-0000-000000000001',
    'deposit',
    'credit',
    1500.00,
    'Synthetic Term 1 Tuition Deposit',
    '${depKey1}'
  );
`);

const balAlpha1 = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-0000-0000-0000-000000000002';
  SELECT current_balance FROM public.student_balances WHERE student_id = 'aaaaaaaa-0000-0000-0000-000000000001';
`);

assertUAT('2.1', 'Admin posts valid deposit and authoritative balance increases to 1500.00',
  depPostRes.includes('"success": true') && balAlpha1 === '1500.00', `res: ${depPostRes}, bal: ${balAlpha1}`);

// 2.2 Reject non-positive amounts
const invalidAmtRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-0000-0000-0000-000000000002';
  SELECT public.rpc_post_transaction(
    'aaaaaaaa-0000-0000-0000-000000000001',
    'deposit',
    'credit',
    -50.00,
    'Negative deposit attempt'
  );
`);
assertUAT('2.2', 'Financial engine strictly rejects non-positive transaction amounts (INVALID_ARGUMENT)',
  invalidAmtRes.includes('INVALID_ARGUMENT') || invalidAmtRes.includes('ERROR'), invalidAmtRes);

// 2.3 Idempotency prevents duplicates
const replayDepRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-0000-0000-0000-000000000002';
  SELECT public.rpc_post_transaction(
    'aaaaaaaa-0000-0000-0000-000000000001',
    'deposit',
    'credit',
    1500.00,
    'Synthetic Term 1 Tuition Deposit',
    '${depKey1}'
  );
`);
const depCount = runSql(`SELECT count(*) FROM public.transactions WHERE idempotency_key = '${depKey1}';`);
assertUAT('2.3', 'Duplicate submission replay with same idempotency key returns idempotent replay without creating duplicate rows',
  replayDepRes.includes('"idempotent_replay": true') && depCount === '1', `replay: ${replayDepRes}, count: ${depCount}`);

// 2.4 Withdrawal resulting in negative balance
const withPostRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-0000-0000-0000-000000000002';
  SELECT public.rpc_post_transaction(
    'aaaaaaaa-0000-0000-0000-000000000001',
    'withdrawal',
    'debit',
    2000.00,
    'Synthetic Emergency Medical Aid Advance'
  );
`);
const balAlpha2 = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-0000-0000-0000-000000000002';
  SELECT current_balance, health_status FROM public.student_health WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';
`);
assertUAT('2.4', 'Valid withdrawal exceeding balance creates negative balance (-500.00) flagged with negative health indicator',
  withPostRes.includes('"success": true') && balAlpha2.includes('-500.00|negative'), balAlpha2);

// ------------------------------------------------------------------
// 3. BULK TRANSACTIONS
// ------------------------------------------------------------------
console.log('\n--- 3. Bulk Transactions ---');

const bulkOpId = 'b0000001-0000-0000-0000-000000000001';
const bulkKey = 'b0000002-0000-0000-0000-000000000002';

const validBulkPayload = JSON.stringify([
  { student_id: 'aaaaaaaa-0000-0000-0000-000000000001', transaction_type: 'deposit', direction: 'credit', amount: 800.00, purpose: 'Canteen Advance' },
  { student_id: 'bbbbbbbb-0000-0000-0000-000000000002', transaction_type: 'deposit', direction: 'credit', amount: 1200.00, purpose: 'General Deposit' },
  { student_id: 'bbbbbbbb-0000-0000-0000-000000000002', transaction_type: 'withdrawal', direction: 'debit', amount: 250.00, purpose: 'Book Store Purchase' }
]);

const bulkPostRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-0000-0000-0000-000000000002';
  SELECT public.rpc_post_bulk_transactions(
    '${validBulkPayload}'::jsonb,
    '${bulkOpId}',
    '${bulkKey}'
  );
`);

const bulkTxCount = runSql(`SELECT count(*) FROM public.transactions WHERE operation_id = '${bulkOpId}';`);

assertUAT('3.1', 'Bulk composer atomically posts multiple legs across students with shared operation ID',
  bulkPostRes.includes('"success": true') && bulkTxCount === '3', `res: ${bulkPostRes}, count: ${bulkTxCount}`);

// 3.2 Atomic rollback on invalid row in bulk payload (Student Gamma is archived)
const invalidBulkPayload = JSON.stringify([
  { student_id: 'aaaaaaaa-0000-0000-0000-000000000001', transaction_type: 'deposit', direction: 'credit', amount: 100.00, purpose: 'Valid Leg' },
  { student_id: 'cccccccc-0000-0000-0000-000000000003', transaction_type: 'deposit', direction: 'credit', amount: 100.00, purpose: 'Archived Student Leg' }
]);

const failedBulkOpId = 'b0000003-0000-0000-0000-000000000003';
const failedBulkRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-0000-0000-0000-000000000002';
  SELECT public.rpc_post_bulk_transactions(
    '${invalidBulkPayload}'::jsonb,
    '${failedBulkOpId}',
    gen_random_uuid()
  );
`);

const failedTxRows = runSql(`SELECT count(*) FROM public.transactions WHERE operation_id = '${failedBulkOpId}';`);

assertUAT('3.2', 'Bulk operation fails atomically when any row is invalid and posts zero partial records',
  failedBulkRes.includes('INVALID_OPERATION') && failedTxRows === '0', `res: ${failedBulkRes}, rows: ${failedTxRows}`);

// ------------------------------------------------------------------
// 4. REVERSALS
// ------------------------------------------------------------------
console.log('\n--- 4. Reversals & Auditability ---');

// Get Book Store withdrawal ID for Beta
const txToReverse = runSql(`
  SELECT id FROM public.transactions 
  WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000002' AND transaction_type = 'withdrawal' 
  LIMIT 1;
`);

const revRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-0000-0000-0000-000000000002';
  SELECT public.rpc_reverse_transaction(
    '${txToReverse}',
    'Accidental duplicate bookstore debit correction'
  );
`);

const originalTxState = runSql(`
  SELECT amount, direction, is_reversed, reversal_reason 
  FROM public.transactions WHERE id = '${txToReverse}';
`);

const compensatingLeg = runSql(`
  SELECT amount, direction, reversal_of_id 
  FROM public.transactions WHERE reversal_of_id = '${txToReverse}';
`);

assertUAT('4.1', 'Reversing a transaction leaves original row immutable and sets is_reversed status metadata',
  originalTxState.includes('250.00|debit|t|Accidental duplicate bookstore debit correction'), originalTxState);

assertUAT('4.2', 'Compensating reversal leg is linked via reversal_of_id with opposite credit direction',
  compensatingLeg.includes(`250.00|credit|${txToReverse}`), compensatingLeg);

// 4.3 Double reversal blocked
const doubleRevRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-0000-0000-0000-000000000002';
  SELECT public.rpc_reverse_transaction(
    '${txToReverse}',
    'Second reversal attempt'
  );
`);
assertUAT('4.3', 'Double reversal of already reversed transaction is blocked (ALREADY_REVERSED)',
  doubleRevRes.includes('ALREADY_REVERSED') || doubleRevRes.includes('ERROR'), doubleRevRes);

// 4.4 Reversal with insufficient reason rejected
const shortReasonRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-0000-0000-0000-000000000002';
  SELECT public.rpc_reverse_transaction(
    (SELECT id FROM public.transactions WHERE is_reversed = false LIMIT 1),
    'Short'
  );
`);
assertUAT('4.4', 'Reversal with insufficient reason (< 10 characters) is rejected (INVALID_ARGUMENT)',
  shortReasonRes.includes('INVALID_ARGUMENT') || shortReasonRes.includes('ERROR'), shortReasonRes);

// ------------------------------------------------------------------
// 5. INTERNAL STUDENT LOANS
// ------------------------------------------------------------------
console.log('\n--- 5. Internal Student Loans ---');

// Student Beta lends 300 to Student Alpha
const loanTransferRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-0000-0000-0000-000000000002';
  SELECT public.rpc_post_internal_transfer(
    'bbbbbbbb-0000-0000-0000-000000000002',
    'aaaaaaaa-0000-0000-0000-000000000001',
    300.00,
    'Synthetic Semester Exam Fee Peer Loan'
  );
`);

const internalLoanId = runSql(`
  SELECT id FROM public.internal_loans 
  WHERE lender_student_id = 'bbbbbbbb-0000-0000-0000-000000000002' 
  ORDER BY created_at DESC LIMIT 1;
`);

assertUAT('5.1', 'Internal loan transfers funds between students atomically and creates tracking loan row',
  loanTransferRes.includes('"success": true') && Boolean(internalLoanId), loanTransferRes);

// Partial repayment of 100
const partialRepayRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-0000-0000-0000-000000000002';
  SELECT public.rpc_repay_internal_loan(
    '${internalLoanId}',
    100.00,
    'Synthetic Partial Repayment 1'
  );
`);
const partialLoanState = runSql(`SELECT outstanding_amount, status FROM public.internal_loans WHERE id = '${internalLoanId}';`);
assertUAT('5.2', 'Partial repayment decreases outstanding debt to 200.00 with status active',
  partialRepayRes.includes('"success": true') && partialLoanState.includes('200.00|active'), partialLoanState);

// Full settlement of remaining 200
const fullRepayRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-0000-0000-0000-000000000002';
  SELECT public.rpc_repay_internal_loan(
    '${internalLoanId}',
    200.00,
    'Synthetic Final Loan Settlement'
  );
`);
const settledLoanState = runSql(`SELECT outstanding_amount, status FROM public.internal_loans WHERE id = '${internalLoanId}';`);
assertUAT('5.3', 'Final repayment marks internal loan status as settled with 0.00 outstanding',
  fullRepayRes.includes('"success": true') && settledLoanState.includes('0.00|settled'), settledLoanState);

// ------------------------------------------------------------------
// 6. EXTERNAL LOANS AND RECOVERIES
// ------------------------------------------------------------------
console.log('\n--- 6. External Loans and Recoveries ---');

const recoveryRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-0000-0000-0000-000000000002';
  SELECT public.rpc_record_borrower_recovery(
    'ffffffff-0000-0000-0000-000000000001',
    1500.00,
    CURRENT_DATE,
    'Synthetic Bank Transfer Recovery'
  );
`);

const extLoanBal = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-0000-0000-0000-000000000002';
  SELECT loan_amount, total_recovered, outstanding_amount 
  FROM public.borrower_loan_balances 
  WHERE loan_id = 'ffffffff-0000-0000-0000-000000000001';
`);

const cashbookPollutionCount = runSql(`
  SELECT count(*) FROM public.transactions WHERE purpose LIKE '%Synthetic Bank Transfer Recovery%';
`);

assertUAT('6.1', 'Borrower recovery decrements loan outstanding balance from 5000.00 to 3500.00',
  recoveryRes.includes('"success": true') && extLoanBal.includes('5000.00|1500.00|3500.00'), extLoanBal);

assertUAT('6.2', 'External loan recovery does not inject fictitious unapproved rows into student cashbook',
  cashbookPollutionCount === '0', `found ${cashbookPollutionCount} fictitious transactions`);

// ------------------------------------------------------------------
// 7. ACCOUNTING PERIODS
// ------------------------------------------------------------------
console.log('\n--- 7. Accounting Periods ---');

// Lock period June 2026
const lockRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-0000-0000-0000-000000000002';
  SELECT public.rpc_set_accounting_period_lock(2026, 6, true);
`);
assertUAT('7.1', 'Financial administrator can successfully lock accounting period (2026-06)',
  lockRes.includes('"success": true'), lockRes);

// Attempt posting transaction dated June 2026
const lockedPostRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-0000-0000-0000-000000000002';
  SELECT public.check_period_unlocked('2026-06-15 00:00:00+00'::timestamptz);
`);
assertUAT('7.2', 'Posting or mutating in locked accounting period is blocked by database policy (PERIOD_LOCKED)',
  lockedPostRes.includes('PERIOD_LOCKED') || lockedPostRes.includes('ERROR'), lockedPostRes);

// ------------------------------------------------------------------
// 8. REPORTS AND EXPORTS
// ------------------------------------------------------------------
console.log('\n--- 8. Reports and Exports ---');

// 8.1 Parent report scope
const parentStmtCount = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '44444444-0000-0000-0000-000000000004';
  SELECT count(*) FROM public.student_ledger_view WHERE student_id = 'aaaaaaaa-0000-0000-0000-000000000001';
`);
const parentBlockedCount = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '44444444-0000-0000-0000-000000000004';
  SELECT count(*) FROM public.student_ledger_view WHERE student_id = 'bbbbbbbb-0000-0000-0000-000000000002';
`);
assertUAT('8.1', 'Parent statement queries return linked child records while completely isolating stranger accounts',
  parseInt(parentStmtCount) > 0 && parentBlockedCount === '0', `linked: ${parentStmtCount}, blocked: ${parentBlockedCount}`);

// 8.2 Cashbook arithmetic reconciliation
const centralArithmetic = runSql(`
  WITH totals AS (
    SELECT 
      SUM(CASE WHEN direction = 'credit' THEN amount ELSE 0 END) as credits,
      SUM(CASE WHEN direction = 'debit' THEN amount ELSE 0 END) as debits
    FROM public.transactions
  )
  SELECT credits - debits FROM totals;
`);

const studentBalSum = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '11111111-0000-0000-0000-000000000001';
  SELECT sum(current_balance) FROM public.student_balances;
`);

assertUAT('8.2', 'Cashbook arithmetic net movement equals sum of all student balances to 2 decimal places',
  centralArithmetic === studentBalSum, `central: ${centralArithmetic}, studentSum: ${studentBalSum}`);

// ------------------------------------------------------------------
// 9. AUDIT LOGGING
// ------------------------------------------------------------------
console.log('\n--- 9. Audit Logging Integrity ---');

const auditTxCount = runSql(`
  SELECT count(*) FROM public.audit_logs WHERE entity = 'transactions';
`);
const auditLoanCount = runSql(`
  SELECT count(*) FROM public.audit_logs WHERE entity = 'internal_loans';
`);
assertUAT('9.1', 'Audit log records structured events for financial transactions and loan lifecycles',
  parseInt(auditTxCount) >= 2 && parseInt(auditLoanCount) >= 1, `txAudits: ${auditTxCount}, loanAudits: ${auditLoanCount}`);

const auditCountBefore = runSql(`SELECT count(*) FROM public.audit_logs;`);
const directAuditTamper = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-0000-0000-0000-000000000002';
  DELETE FROM public.audit_logs;
`);
const auditCountAfter = runSql(`SELECT count(*) FROM public.audit_logs;`);
assertUAT('9.2', 'Direct client mutation or deletion of audit logs is completely rejected or blocked by database security',
  (directAuditTamper.includes('ERROR') || directAuditTamper.includes('DELETE 0')) && auditCountBefore === auditCountAfter && parseInt(auditCountAfter) > 0,
  `tamperRes: ${directAuditTamper}, countBefore: ${auditCountBefore}, countAfter: ${auditCountAfter}`);

// Final Summary
console.log('\n================================================================');
console.log(`=== STAGING UAT RESULTS: ${passCount} PASSED, ${failCount} FAILED (TOTAL: ${passCount + failCount}) ===`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
}
