// ==============================================================================
// ZLS Operational Workflows, Lending, Periods & Audit Test Suite
// File: tests/operations/test_operational_workflows.js
// Tests operational workflows locally against zls_security_test.
// ==============================================================================

const { execSync } = require('child_process');

const DB = 'zls_security_test';

function runSql(sql) {
  try {
    const cmd = `psql -h localhost -U apple -d ${DB} -v ON_ERROR_STOP=1 -t -A -c "${sql.replace(/"/g, '\\"')}"`;
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch (err) {
    return `ERROR: ${err.stderr || err.message}`;
  }
}

console.log('================================================================');
console.log('=== ZLS REBUILD: PROMPT 5 OPERATIONAL WORKFLOWS TEST SUITE   ===');
console.log('================================================================\n');

let passedCount = 0;
let totalCount = 0;

function assertTest(name, condition, details = '') {
  totalCount++;
  if (condition) {
    console.log(`  [PASS] ${name}`);
    passedCount++;
  } else {
    console.error(`  [FAIL] ${name}`);
    if (details) console.error(`         ${details}`);
  }
}

// 1. Reset and Seed Clean Environment
runSql(`
DELETE FROM public.audit_logs;
DELETE FROM public.internal_loan_repayments;
DELETE FROM public.internal_loans;
DELETE FROM public.recoveries;
DELETE FROM public.borrower_loans;
DELETE FROM public.borrowers;
DELETE FROM public.batch_members;
DELETE FROM public.saved_batches;
DELETE FROM public.transaction_presets;
DELETE FROM public.transactions;
DELETE FROM public.students;
DELETE FROM public.profiles;
DELETE FROM public.accounting_periods;
DELETE FROM public.settings;

-- Test Profiles
INSERT INTO public.profiles (id, full_name, role, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Super Admin User', 'super_admin', true),
  ('22222222-2222-2222-2222-222222222222', 'Admin User', 'admin', true),
  ('33333333-3333-3333-3333-333333333333', 'Faculty User', 'faculty', true),
  ('44444444-4444-4444-4444-444444444444', 'Parent User', 'parent', true),
  ('55555555-5555-5555-5555-555555555555', 'Junior Staff', 'faculty', true);

-- Test Students
INSERT INTO public.students (id, enrolment_no, name, status) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ZLS-001', 'Student Alpha', 'active'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ZLS-002', 'Student Beta', 'active'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'ZLS-003', 'Student Gamma', 'active'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'ZLS-004', 'Student Inactive', 'archived');
`);

// ------------------------------------------------------------------
// SECTION 1: BULK TRANSACTION COMPOSER
// ------------------------------------------------------------------
console.log('--- 1. Bulk Composer Workflows ---');

// 1.1 Multi-student with multi-transaction per student
const bulkPayload = JSON.stringify([
  { student_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', transaction_type: 'deposit', direction: 'credit', amount: 500, purpose: 'Monthly Fee Leg 1' },
  { student_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', transaction_type: 'deposit', direction: 'credit', amount: 150, purpose: 'Book Store Leg 2' },
  { student_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', transaction_type: 'withdrawal', direction: 'debit', amount: 200, purpose: 'Pocket Cash' }
]);

const bulkOpId = 'b0000001-0000-0000-0000-000000000001';
const bulkKey = 'b1111111-0000-0000-0000-000000000001';

const bulkRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT public.rpc_post_bulk_transactions(
    '${bulkPayload}'::jsonb,
    '${bulkOpId}'::uuid,
    '${bulkKey}'::uuid
  );
`);

assertTest('1.1 Bulk composer atomically posts multiple legs across students and multiple legs per student', 
  bulkRes.includes('"success": true') && !bulkRes.includes('ERROR'), bulkRes);

const alphaTxCount = runSql(`
  SELECT count(*) FROM public.transactions WHERE student_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
`);
assertTest('1.2 Multiple transactions for same student exist with shared operation ID', 
  alphaTxCount === '2', `Expected 2, got ${alphaTxCount}`);

// 1.3 Idempotent bulk replay
const bulkReplayRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT public.rpc_post_bulk_transactions(
    '${bulkPayload}'::jsonb,
    '${bulkOpId}'::uuid,
    '${bulkKey}'::uuid
  );
`);
assertTest('1.3 Replaying bulk operation with same idempotency key returns idempotent replay without duplicate rows',
  bulkReplayRes.includes('"idempotent_replay": true'), bulkReplayRes);

const totalTxCount = runSql(`SELECT count(*) FROM public.transactions;`);
assertTest('1.4 Total transaction count unchanged after replay', totalTxCount === '3', `Expected 3, got ${totalTxCount}`);

// 1.5 Bulk atomic rollback on invalid item
const invalidBulkPayload = JSON.stringify([
  { student_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', transaction_type: 'deposit', direction: 'credit', amount: 100, purpose: 'Valid Entry' },
  { student_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd', transaction_type: 'deposit', direction: 'credit', amount: 200, purpose: 'Archived Student Entry' }
]);

const failBulkRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT public.rpc_post_bulk_transactions(
    '${invalidBulkPayload}'::jsonb,
    gen_random_uuid(),
    gen_random_uuid()
  );
`);
assertTest('1.5 Bulk operation fails atomically when any row is invalid (archived student)',
  failBulkRes.includes('INVALID_OPERATION') || failBulkRes.includes('archived'), failBulkRes);

const gammaTxCount = runSql(`SELECT count(*) FROM public.transactions WHERE student_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';`);
assertTest('1.6 Valid items in failed bulk payload were completely rolled back', gammaTxCount === '0', `Expected 0, got ${gammaTxCount}`);

// ------------------------------------------------------------------
// SECTION 2: SAVED BATCHES & PRESETS (DRAFT ISOLATION)
// ------------------------------------------------------------------
console.log('\n--- 2. Saved Batches & Presets (Draft Isolation) ---');

// 2.1 Create saved batch and members
const batchId = 'ba000000-0000-0000-0000-000000000001';
runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  INSERT INTO public.saved_batches (id, name, description, created_by)
  VALUES ('${batchId}', 'Hostel A Roster', 'Hostel A Students Batch', '22222222-2222-2222-2222-222222222222');

  INSERT INTO public.batch_members (batch_id, student_id) VALUES
    ('${batchId}', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    ('${batchId}', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
    ('${batchId}', 'cccccccc-cccc-cccc-cccc-cccccccccccc');
`);

const initialBatchMembers = runSql(`SELECT count(*) FROM public.batch_members WHERE batch_id = '${batchId}';`);
assertTest('2.1 Saved batch and members created successfully', initialBatchMembers === '3', `Expected 3, got ${initialBatchMembers}`);

// 2.2 Client removes a participant from their composer draft: source batch remains unchanged!
// In our architecture, the composer draft lives client-side; posting a partial batch does not touch batch_members.
const partialDraftPayload = JSON.stringify([
  { student_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', transaction_type: 'deposit', direction: 'credit', amount: 50, purpose: 'Draft without Beta and Gamma' }
]);
runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT public.rpc_post_bulk_transactions('${partialDraftPayload}'::jsonb, gen_random_uuid(), gen_random_uuid());
`);

const preservedBatchMembers = runSql(`SELECT count(*) FROM public.batch_members WHERE batch_id = '${batchId}';`);
assertTest('2.2 Removing participants from a composer draft leaves the underlying saved batch members intact',
  preservedBatchMembers === '3', `Expected 3, got ${preservedBatchMembers}`);

// 2.3 Presets create and query
const presetId = 'e1000000-0000-0000-0000-000000000001';
runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  INSERT INTO public.transaction_presets (id, name, transaction_type, amount, purpose)
  VALUES ('${presetId}', 'Monthly Mess Dues', 'withdrawal', 1200.00, 'Standard Monthly Mess Bill');
`);

const presetRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
  SELECT name, amount FROM public.transaction_presets WHERE id = '${presetId}';
`);
assertTest('2.3 Transaction preset readable by authenticated users', presetRes.includes('Monthly Mess Dues|1200.00'), presetRes);

// ------------------------------------------------------------------
// SECTION 3: INTERNAL STUDENT LENDING & REPAYMENTS
// ------------------------------------------------------------------
console.log('\n--- 3. Internal Student Lending & Repayments ---');

const transferOpId = 'e2000000-0000-0000-0000-000000000001';
const internalLoanRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT public.rpc_post_internal_transfer(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    300.00,
    'Campus Textbook Loan',
    '${transferOpId}'::uuid,
    gen_random_uuid()
  );
`);
assertTest('3.1 Internal loan created atomically with lender debit, borrower credit, and internal_loans row', 
  internalLoanRes.includes('"success": true') && !internalLoanRes.includes('ERROR'), internalLoanRes);

// Retrieve actual loan ID created
const internalLoanId = runSql(`
  SELECT id FROM public.internal_loans WHERE operation_id = '${transferOpId}';
`);

// 3.2 Partial repayment
const repayRes1 = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT public.rpc_repay_internal_loan(
    '${internalLoanId}'::uuid,
    100.00,
    'First installment paid',
    gen_random_uuid()
  );
`);
assertTest('3.2 Partial repayment reduces outstanding loan balance to 200 without mutating original transactions',
  repayRes1.includes('"outstanding_amount": 200.00') && repayRes1.includes('"status": "active"'), repayRes1);

// 3.3 Overpayment rejection
const overpayRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT public.rpc_repay_internal_loan(
    '${internalLoanId}'::uuid,
    250.00,
    'Excessive repayment attempt',
    gen_random_uuid()
  );
`);
assertTest('3.3 Overpayment rejected by database invariants', overpayRes.includes('OVERPAYMENT_REJECTED'), overpayRes);

// 3.4 Final repayment sets internal loan status to settled with zero outstanding
const repayRes2 = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT public.rpc_repay_internal_loan(
    '${internalLoanId}'::uuid,
    200.00,
    'Final settlement paid',
    gen_random_uuid()
  );
`);
assertTest('3.4 Final repayment sets internal loan status to settled with zero outstanding',
  repayRes2.includes('"outstanding_amount": 0.00') && repayRes2.includes('"status": "settled"'), repayRes2);

// ------------------------------------------------------------------
// SECTION 4: EXTERNAL BORROWERS, LOANS & RECOVERIES
// ------------------------------------------------------------------
console.log('\n--- 4. External Borrowers & Recoveries ---');

const borrowerId = 'e3000000-0000-0000-0000-000000000001';
const extLoanId = 'e4000000-0000-0000-0000-000000000001';

runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  INSERT INTO public.borrowers (id, name, risk_level, status)
  VALUES ('${borrowerId}', 'Zubair Vendor', 'medium', 'active');

  INSERT INTO public.borrower_loans (id, borrower_id, loan_amount, loan_date, purpose, status)
  VALUES ('${extLoanId}', '${borrowerId}', 1000.00, CURRENT_DATE, 'Campus Renovation Advance', 'active');
`);

// 4.1 Valid recovery
const recoveryRes1 = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT public.rpc_record_borrower_recovery(
    '${extLoanId}'::uuid,
    400.00,
    CURRENT_DATE,
    'Cash recovery received at office'
  );
`);
assertTest('4.1 External borrower recovery recorded successfully',
  recoveryRes1.includes('"outstanding_amount": 600.00') && recoveryRes1.includes('"success": true'), recoveryRes1);

// 4.2 Overpayment rejection on external recovery
const recoveryOverpay = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT public.rpc_record_borrower_recovery(
    '${extLoanId}'::uuid,
    700.00,
    CURRENT_DATE,
    'Excessive recovery amount'
  );
`);
assertTest('4.2 External borrower recovery overpayment rejected by engine',
  recoveryOverpay.includes('OVERPAYMENT_REJECTED'), recoveryOverpay);

// 4.3 Final recovery settles loan
const recoveryRes2 = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT public.rpc_record_borrower_recovery(
    '${extLoanId}'::uuid,
    600.00,
    CURRENT_DATE,
    'Full settlement recovery'
  );
`);
assertTest('4.3 Full external recovery marks loan settled with zero outstanding',
  recoveryRes2.includes('"is_settled": true') && recoveryRes2.includes('"outstanding_amount": 0.00'), recoveryRes2);

// ------------------------------------------------------------------
// SECTION 5: ACCOUNTING PERIODS & DATABASE ENFORCEMENT
// ------------------------------------------------------------------
console.log('\n--- 5. Accounting Periods & Database Enforcement ---');

// 5.1 Admin locks period 2026-08
const lockRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT public.rpc_set_accounting_period_lock(2026, 8, true);
`);
assertTest('5.1 Financial admin can lock accounting period via trusted RPC',
  lockRes.includes('"success": true') && lockRes.includes('"is_locked": true'), lockRes);

// 5.2 Direct posting into locked period is rejected at DB boundary
const lockedPostingRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT public.check_period_unlocked('2026-08-15 10:00:00+00'::timestamptz);
`);
assertTest('5.2 check_period_unlocked raises PERIOD_LOCKED for transaction date in locked period',
  lockedPostingRes.includes('PERIOD_LOCKED'), lockedPostingRes);

// 5.3 Faculty cannot lock or unlock accounting periods
const facultyLockAttempt = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
  SELECT public.rpc_set_accounting_period_lock(2026, 9, true);
`);
assertTest('5.3 Faculty user is rejected when attempting to lock or unlock accounting period',
  facultyLockAttempt.includes('FORBIDDEN'), facultyLockAttempt);

// 5.4 Reopening period
const unlockRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT public.rpc_set_accounting_period_lock(2026, 8, false);
`);
assertTest('5.4 Authorized admin can reopen accounting period',
  unlockRes.includes('"is_locked": false'), unlockRes);

// ------------------------------------------------------------------
// SECTION 6: AUDIT LOGGING INTEGRITY
// ------------------------------------------------------------------
console.log('\n--- 6. Audit Logging Integrity ---');

// 6.1 Audit rows exist for all mutations
const auditActions = runSql(`
  SELECT DISTINCT action FROM public.audit_logs ORDER BY action;
`);
assertTest('6.1 Audit logs atomically record financial and operational events',
  auditActions.includes('LOCK_ACCOUNTING_PERIOD') && 
  auditActions.includes('CREATE_INTERNAL_LOAN') &&
  auditActions.includes('REPAY_INTERNAL_LOAN') &&
  auditActions.includes('RECORD_BORROWER_RECOVERY'), auditActions);

// 6.2 Client cannot spoof or directly insert audit records
const spoofAttempt = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  INSERT INTO public.audit_logs (action, entity, entity_id)
  VALUES ('FAKE_ACTION', 'students', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
`);
assertTest('6.2 Direct client insert on audit_logs is rejected by RLS',
  spoofAttempt.includes('violates row-level security') || spoofAttempt.includes('permission denied'), spoofAttempt);

// ------------------------------------------------------------------
// SECTION 7: USER ADMINISTRATION & SECURITY
// ------------------------------------------------------------------
console.log('\n--- 7. User Administration & Security ---');

// 7.1 Super Admin can assign approved roles
const roleAssignRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
  SELECT public.admin_set_user_role('55555555-5555-5555-5555-555555555555'::uuid, 'admin'::public.user_role);
`);
assertTest('7.1 Super Admin can assign user roles', roleAssignRes.includes('"success": true'), roleAssignRes);

// 7.2 Admin cannot assign user roles
const adminRoleAssignRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT public.admin_set_user_role('55555555-5555-5555-5555-555555555555'::uuid, 'super_admin'::public.user_role);
`);
assertTest('7.2 Admin cannot assign user roles (FORBIDDEN)', adminRoleAssignRes.includes('FORBIDDEN'), adminRoleAssignRes);

// 7.3 Super Admin can deactivate a user
const deactRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
  SELECT public.admin_set_user_active('55555555-5555-5555-5555-555555555555'::uuid, false);
`);
assertTest('7.3 Super Admin can deactivate an active user', deactRes.includes('"is_active": false'), deactRes);

// 7.4 Super Admin cannot deactivate themselves (lockout protection)
const selfDeactRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
  SELECT public.admin_set_user_active('11111111-1111-1111-1111-111111111111'::uuid, false);
`);
assertTest('7.4 Super Admin self-deactivation is blocked (lockout protection)',
  selfDeactRes.includes('INVALID_OPERATION'), selfDeactRes);

// 7.5 Deactivation is audited
const deactAudit = runSql(`
  SELECT count(*) FROM public.audit_logs WHERE action = 'DEACTIVATE_USER' AND entity_id = '55555555-5555-5555-5555-555555555555';
`);
assertTest('7.5 User deactivation event was recorded in audit logs', deactAudit === '1', `Expected 1, got ${deactAudit}`);

// ------------------------------------------------------------------
// SECTION 8: SYSTEM SETTINGS
// ------------------------------------------------------------------
console.log('\n--- 8. Settings Management ---');

const settingRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT public.rpc_update_setting('low_balance_threshold', '750'::jsonb);
`);
assertTest('8.1 Financial admin can update system setting via trusted RPC', settingRes.includes('"success": true'), settingRes);

const settingVal = runSql(`SELECT value FROM public.settings WHERE key = 'low_balance_threshold';`);
assertTest('8.2 Updated setting persisted in database', settingVal.includes('750'), settingVal);

console.log('\n================================================================');
console.log(`=== OPERATIONS TEST RESULTS: ${passedCount} PASSED, ${totalCount - passedCount} FAILED (TOTAL: ${totalCount}) ===`);
console.log('================================================================\n');

if (passedCount !== totalCount) {
  process.exit(1);
}
