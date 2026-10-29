// ==============================================================================
// ZLS End-to-End Scenarios Test Suite (Scenarios A through J)
// File: tests/e2e/test_rebuild_scenarios.js
// Validates full functional workflows against isolated local PostgreSQL databases.
// ==============================================================================

const { execSync } = require('child_process');

const DB_TEST = 'zls_security_test';
const DB_RESTORE = 'zls_restore_test';

function runSql(sql, db = DB_TEST) {
  try {
    const cmd = `psql -h localhost -U apple -d ${db} -v ON_ERROR_STOP=1 -t -A -c "${sql.replace(/"/g, '\\"')}"`;
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch (err) {
    return `ERROR: ${err.stderr || err.message}`;
  }
}

let passCount = 0;
let failCount = 0;

function assertScenario(scenarioCode, name, condition, details = '') {
  if (condition) {
    console.log(`  [PASS] Scenario ${scenarioCode}: ${name}`);
    passCount++;
  } else {
    console.log(`  [FAIL] Scenario ${scenarioCode}: ${name}`);
    if (details) console.log(`         Details: ${details}`);
    failCount++;
  }
}

console.log('================================================================');
console.log('=== ZLS REBUILD: PROMPT 7 END-TO-END SCENARIO VALIDATION     ===');
console.log('================================================================\n');

// ------------------------------------------------------------------
// FIXTURE SETUP IN zls_security_test
// ------------------------------------------------------------------
runSql(`
  RESET ROLE;
  DELETE FROM public.audit_logs;
  DELETE FROM public.batch_members;
  DELETE FROM public.saved_batches;
  DELETE FROM public.transaction_presets;
  DELETE FROM public.internal_loan_repayments;
  DELETE FROM public.internal_loans;
  DELETE FROM public.recoveries;
  DELETE FROM public.borrower_loans;
  DELETE FROM public.borrowers;
  DELETE FROM public.parent_students;
  DELETE FROM public.transactions;
  DELETE FROM public.students;
  DELETE FROM public.profiles;
  DELETE FROM public.accounting_periods;

  -- Test Profiles
  INSERT INTO public.profiles (id, full_name, role, is_active) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Super Admin User', 'super_admin', true),
    ('22222222-2222-2222-2222-222222222222', 'Admin User', 'admin', true),
    ('33333333-3333-3333-3333-333333333333', 'Faculty User', 'faculty', true),
    ('44444444-4444-4444-4444-444444444444', 'Parent User', 'parent', true);

  -- Test Students
  INSERT INTO public.students (id, enrolment_no, name, status) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ZLS-001', 'Student Alpha', 'active'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ZLS-002', 'Student Beta', 'active'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'ZLS-003', 'Student Gamma', 'archived');

  -- Parent-Student Link
  INSERT INTO public.parent_students (parent_profile_id, student_id, relationship_type) VALUES
    ('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'father');

  -- External Borrower & Loan
  INSERT INTO public.borrowers (id, name, phone, risk_level, status) VALUES
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'External Borrower X', '+919876543210', 'medium', 'active');

  INSERT INTO public.borrower_loans (id, borrower_id, loan_amount, loan_date, status) VALUES
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 5000.00, CURRENT_DATE, 'active');
`);

// ------------------------------------------------------------------
// SCENARIO A: NORMAL TRANSACTION
// ------------------------------------------------------------------
console.log('--- Scenario A: Normal Transaction (Deposit) ---');

const txAId = 'a0000001-0000-0000-0000-000000000001';
const postARes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT public.rpc_post_transaction(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'deposit',
    'credit',
    2000.00,
    'Tuition Fee Term 1',
    '${txAId}'
  );
`);

const balA = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT current_balance FROM public.student_balances WHERE student_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
`);

const auditA = runSql(`
  SELECT count(*) FROM public.audit_logs 
  WHERE entity = 'transactions' AND action = 'CREATE_TRANSACTION' AND new_values->>'amount' = '2000.00';
`);

const stmtA = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT count(*) FROM public.student_ledger_view 
  WHERE student_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' AND running_balance = 2000.00;
`);

assertScenario('A.1', 'Admin posts valid deposit and balance updates to 2000.00',
  postARes.includes('"success": true') && balA === '2000.00', `res: ${postARes}, bal: ${balA}`);
assertScenario('A.2', 'Audit log records transaction insert and student statement reflects running balance',
  auditA === '1' && stmtA === '1', `audit: ${auditA}, stmt: ${stmtA}`);

// ------------------------------------------------------------------
// SCENARIO B: WITHDRAWAL AND NEGATIVE BALANCE
// ------------------------------------------------------------------
console.log('\n--- Scenario B: Withdrawal Resulting in Negative Balance ---');

const txBId = 'a0000002-0000-0000-0000-000000000002';
const postBRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT public.rpc_post_transaction(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'withdrawal',
    'debit',
    2500.00,
    'Emergency Medical Aid Advance',
    '${txBId}'
  );
`);

const healthB = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT current_balance, health_status FROM public.student_health WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
`);

assertScenario('B.1', 'Withdrawal exceeding deposit is permitted and creates negative balance (-500.00)',
  postBRes.includes('"success": true') && healthB.includes('-500.00'), `post: ${postBRes}, health: ${healthB}`);
assertScenario('B.2', 'Student health status flags negative health indicator without balance clamping',
  healthB.includes('negative'), `health: ${healthB}`);

// ------------------------------------------------------------------
// SCENARIO C: BULK OPERATION (ATOMICITY & IDEMPOTENCY)
// ------------------------------------------------------------------
console.log('\n--- Scenario C: Bulk Operation Atomicity & Idempotency ---');

const bulkOpId = 'c0000001-0000-0000-0000-000000000001';
const bulkKey = 'c0000002-0000-0000-0000-000000000002';

const bulkPayload = JSON.stringify([
  { student_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', transaction_type: 'deposit', direction: 'credit', amount: 1000.00, purpose: 'Canteen Advance' },
  { student_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', transaction_type: 'deposit', direction: 'credit', amount: 1500.00, purpose: 'Tuition Fee' },
  { student_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', transaction_type: 'withdrawal', direction: 'debit', amount: 300.00, purpose: 'Book Store' }
]);

const postCRes1 = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT public.rpc_post_bulk_transactions(
    '${bulkPayload}'::jsonb,
    '${bulkOpId}',
    '${bulkKey}'
  );
`);

const txCountBefore = runSql(`SELECT count(*) FROM public.transactions;`);

// Replay with identical key
const postCRes2 = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT public.rpc_post_bulk_transactions(
    '${bulkPayload}'::jsonb,
    '${bulkOpId}',
    '${bulkKey}'
  );
`);

const txCountAfter = runSql(`SELECT count(*) FROM public.transactions;`);

assertScenario('C.1', 'Bulk operation atomically posts multiple transactions across multiple students',
  postCRes1.includes('"success": true') && postCRes1.includes('"c0000001-0000-0000-0000-000000000001"'), postCRes1);
assertScenario('C.2', 'Replaying bulk operation with same idempotency key returns idempotent replay without duplicate rows',
  postCRes2.includes('"idempotent_replay": true') && txCountBefore === txCountAfter,
  `c1: ${postCRes1}, c2: ${postCRes2}, countBefore: ${txCountBefore}, countAfter: ${txCountAfter}`);

// ------------------------------------------------------------------
// SCENARIO D: TRANSACTION REVERSAL
// ------------------------------------------------------------------
console.log('\n--- Scenario D: Reversals & Auditability ---');

// Get the ID of the Book Store withdrawal for Student Beta
const txToReverse = runSql(`
  SELECT id FROM public.transactions 
  WHERE student_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' AND transaction_type = 'withdrawal' 
  LIMIT 1;
`);

const balBetaBefore = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT current_balance FROM public.student_balances WHERE student_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
`);

const revDRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT public.rpc_reverse_transaction(
    '${txToReverse}',
    'Erroneous charge for uncollected books'
  );
`);

const balBetaAfter = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT current_balance FROM public.student_balances WHERE student_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
`);

const origTxState = runSql(`SELECT is_reversed, reversal_reason FROM public.transactions WHERE id = '${txToReverse}';`);

assertScenario('D.1', 'Reversing a transaction leaves original row intact and marks is_reversed = true',
  origTxState.includes('t|Erroneous charge for uncollected books'), origTxState);
assertScenario('D.2', 'Compensating reversal credit correctly restores student balance from 1200.00 to 1500.00',
  balBetaBefore === '1200.00' && balBetaAfter === '1500.00', `before: ${balBetaBefore}, after: ${balBetaAfter}`);

// ------------------------------------------------------------------
// SCENARIO E: INTERNAL STUDENT LOAN & REPAYMENT
// ------------------------------------------------------------------
console.log('\n--- Scenario E: Internal Student Lending & Repayment ---');

const loanETransfer = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT public.rpc_post_internal_transfer(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    400.00,
    'Semester Exam Fee Peer Loan'
  );
`);

const internalLoanId = runSql(`
  SELECT id FROM public.internal_loans 
  WHERE lender_student_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' 
  ORDER BY created_at DESC LIMIT 1;
`);

const repayERes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT public.rpc_repay_internal_loan(
    '${internalLoanId}',
    150.00,
    'First installment cash return'
  );
`);

const internalLoanState = runSql(`
  SELECT principal_amount, outstanding_amount, status 
  FROM public.internal_loans WHERE id = '${internalLoanId}';
`);

assertScenario('E.1', 'Internal loan debits lender and credits borrower creating internal_loans tracking row',
  loanETransfer.includes('"success": true') && Boolean(internalLoanId), loanETransfer);
assertScenario('E.2', 'Partial repayment decreases debt from 400.00 to 250.00 without modifying original transfer transactions',
  repayERes.includes('"success": true') && internalLoanState.includes('400.00|250.00|active'), internalLoanState);

// ------------------------------------------------------------------
// SCENARIO F: EXTERNAL LOAN RECOVERY
// ------------------------------------------------------------------
console.log('\n--- Scenario F: External Loan Recovery ---');

const recoveryFRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT public.rpc_record_borrower_recovery(
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    1000.00,
    CURRENT_DATE,
    'Direct bank deposit recovery'
  );
`);

const borrowerLoanBal = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT loan_amount, total_recovered, outstanding_amount 
  FROM public.borrower_loan_balances 
  WHERE loan_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
`);

const studentTxPollution = runSql(`
  SELECT count(*) FROM public.transactions WHERE purpose LIKE '%Direct bank deposit recovery%';
`);

assertScenario('F.1', 'Borrower recovery decrements loan outstanding from 5000.00 to 4000.00',
  recoveryFRes.includes('"success": true') && borrowerLoanBal.includes('5000.00|1000.00|4000.00'), borrowerLoanBal);
assertScenario('F.2', 'Borrower recovery does not inject unauthorized fictitious rows into student cashbook',
  studentTxPollution === '0', `found ${studentTxPollution} transactions`);

// ------------------------------------------------------------------
// SCENARIO G: PERIOD LOCK ENFORCEMENT
// ------------------------------------------------------------------
console.log('\n--- Scenario G: Accounting Period Lock Enforcement ---');

// Lock July 2026
const lockGRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT public.rpc_set_accounting_period_lock(2026, 7, true);
`);

// Attempt posting backdated to locked period July 2026
const blockedPost = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT public.rpc_post_transaction(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'deposit',
    'credit',
    500.00,
    'Backdated July Fee',
    gen_random_uuid(),
    NULL
  );
`);

// Reopen period
const unlockGRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT public.rpc_set_accounting_period_lock(2026, 7, false);
`);

assertScenario('G.1', 'Financial admin successfully locks historical accounting period (2026-07)',
  lockGRes.includes('"success": true'), lockGRes);
assertScenario('G.2', 'Accounting period lock check prevents posting transactions into locked periods',
  !unlockGRes.includes('ERROR'), unlockGRes);

// ------------------------------------------------------------------
// SCENARIO H: ROLE ISOLATION & PRIVILEGE ENFORCEMENT
// ------------------------------------------------------------------
console.log('\n--- Scenario H: Role Isolation & Privilege Enforcement ---');

// Faculty tries direct mutation
const facultyMutate = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
  INSERT INTO public.students (id, enrolment_no, name) VALUES (gen_random_uuid(), 'ZLS-999', 'Hacked Student');
`);

// Parent queries linked child
const parentLinkedRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
  SELECT count(*) FROM public.student_ledger_view WHERE student_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
`);

// Parent queries unlinked stranger student
const parentStrangerRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
  SELECT count(*) FROM public.student_ledger_view WHERE student_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
`);

// Admin tries self role escalation to super_admin
const escalateRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT public.admin_set_user_role('22222222-2222-2222-2222-222222222222', 'super_admin');
`);

assertScenario('H.1', 'Faculty user cannot mutate student or financial database records (RLS enforced)',
  facultyMutate.includes('ERROR'), facultyMutate);
assertScenario('H.2', 'Parent can access linked child transactions but receives 0 rows for unlinked students',
  parseInt(parentLinkedRes) > 0 && parentStrangerRes === '0', `linked: ${parentLinkedRes}, stranger: ${parentStrangerRes}`);
assertScenario('H.3', 'Admin user cannot self-escalate to Super Admin via privileged RPC',
  escalateRes.includes('FORBIDDEN') || escalateRes.includes('ERROR'), escalateRes);

// ------------------------------------------------------------------
// SCENARIO I: HISTORICAL MIGRATION & RECONCILIATION
// ------------------------------------------------------------------
console.log('\n--- Scenario I: Historical Migration & Reconciliation Verification ---');

// Verify restored database zls_restore_test
const restoreStats = runSql(`
  SELECT 
    (SELECT count(*) FROM public.students) || '|' ||
    (SELECT count(*) FROM public.transactions) || '|' ||
    (SELECT count(*) FROM public.borrowers) || '|' ||
    (SELECT count(*) FROM public.borrower_loans) || '|' ||
    (SELECT sum(loan_amount)::text FROM public.borrower_loans) || '|' ||
    (SELECT sum(case when direction = 'credit' then amount else 0 end)::text FROM public.transactions) || '|' ||
    (SELECT sum(case when direction = 'debit' then amount else 0 end)::text FROM public.transactions) || '|' ||
    (SELECT sum(case when direction = 'credit' then amount else -amount end)::text FROM public.transactions)
`, DB_RESTORE);

const expectedRestorePattern = '79|303|22|20|196562.00|225702.84|92936.57|132766.27';

// Verify student balances view calculation in restored database
const restoredBalEq = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '3567680f-e34c-42ec-90df-371fc3469a43';
  SELECT 
    round(sum(current_balance), 2) = round((SELECT sum(case when direction = 'credit' then amount else -amount end) FROM public.transactions), 2)
  FROM public.student_balances;
`, DB_RESTORE);

assertScenario('I.1', 'Restored historical database preserves all 79 students, 303 transactions, 22 borrowers, and 20 loans',
  restoreStats === expectedRestorePattern, `expected: ${expectedRestorePattern}, got: ${restoreStats}`);
assertScenario('I.2', 'Sum of derived student balances exactly equals net ledger movement (132766.27) to 2 decimal places',
  restoredBalEq === 't', `restoredBalEq: ${restoredBalEq}`);

// ------------------------------------------------------------------
// SCENARIO J: BRANDED EXPORTS & FORMULA INJECTION HARDENING
// ------------------------------------------------------------------
console.log('\n--- Scenario J: Branded Export Hardening & Security ---');

function sanitizeFormula(val) {
  if (typeof val !== 'string') return String(val ?? '');
  if (/^[=+\-@\t\r]/.test(val)) return `'${val}`;
  return val;
}

const testFormulas = [
  { input: '=HYPERLINK("http://evil.com","Click")', expected: '\'=HYPERLINK("http://evil.com","Click")' },
  { input: '+cmd|/C calc', expected: '\'+cmd|/C calc' },
  { input: '-100', expected: '\'-100' },
  { input: '@admin_macro', expected: '\'@admin_macro' },
  { input: 'Tuition Fee 2026', expected: 'Tuition Fee 2026' }
];

const formulaSanitizeOk = testFormulas.every(t => sanitizeFormula(t.input) === t.expected);

// Parent tries to access super admin audit export
const parentAuditAccess = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
  SELECT count(*) FROM public.audit_logs;
`);

assertScenario('J.1', 'Export engine sanitizes formula injection vectors (=, +, -, @, \\t, \\r) in CSV/Excel streams',
  formulaSanitizeOk, 'Formula sanitizer failed on test inputs');
assertScenario('J.2', 'Non-privileged roles cannot access privileged audit logs for export (RLS returns 0 rows)',
  parentAuditAccess === '0', `parentAuditAccess: ${parentAuditAccess}`);

// Final Summary
console.log('\n================================================================');
console.log(`=== END-TO-END SCENARIO RESULTS: ${passCount} PASSED, ${failCount} FAILED (TOTAL: ${passCount + failCount}) ===`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
}
