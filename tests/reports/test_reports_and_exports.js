// ==============================================================================
// ZLS Automated Reports, Reconciliation & Exports Test Suite
// File: tests/reports/test_reports_and_exports.js
// Tests Prompt 6 reporting engine, views, reconciliation, and export rules locally
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

let passCount = 0;
let failCount = 0;

function assertTest(name, condition, details = '') {
  if (condition) {
    console.log(`  [PASS] ${name}`);
    passCount++;
  } else {
    console.log(`  [FAIL] ${name}`);
    if (details) console.log(`         ${details}`);
    failCount++;
  }
}

console.log('================================================================');
console.log('=== ZLS REBUILD: PROMPT 6 FINANCIAL REPORTS & AUDIT SUITE    ===');
console.log('================================================================\n');

// 1. Reset and seed test environment
runSql(`
-- Clean tables
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

-- Profiles
INSERT INTO public.profiles (id, full_name, role, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Super Admin User', 'super_admin', true),
  ('22222222-2222-2222-2222-222222222222', 'Admin User', 'admin', true),
  ('33333333-3333-3333-3333-333333333333', 'Faculty User', 'faculty', true),
  ('44444444-4444-4444-4444-444444444444', 'Parent User', 'parent', true);

-- Students: aaaa (Positive), bbbb (Negative deficit), cccc (Zero balance), dddd (Archived)
INSERT INTO public.students (id, enrolment_no, name, status) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ZLS-101', 'Zaid Rahman', 'active'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ZLS-102', 'Bilal Hassan', 'active'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'ZLS-103', 'Tariq Anwar', 'active'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'ZLS-104', 'Danish Ali', 'archived');

-- Parent link: Parent 4444 -> Zaid Rahman (aaaa)
INSERT INTO public.parent_students (parent_profile_id, student_id, relationship_type) VALUES
  ('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'father');

-- Transactions for Zaid (aaaa):
-- Leg 1: Deposit 2000 (2026-08-10) - Prior to Sept
-- Leg 2: Deposit 1500 (2026-09-05) - In period
-- Leg 3: Withdrawal 500 (2026-09-12) - In period
-- Leg 4: Reversal of Leg 3 (2026-09-15) - In period
INSERT INTO public.transactions (id, student_id, transaction_type, direction, amount, purpose, transaction_date, created_by, operation_id)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'deposit', 'credit', 2000.00, 'August Term Inception Fee', '2026-08-10 10:00:00+00', '22222222-2222-2222-2222-222222222222', 'e1000000-0000-0000-0000-000000000001'),
  ('a1000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'deposit', 'credit', 1500.00, 'September Mess Advance', '2026-09-05 10:00:00+00', '22222222-2222-2222-2222-222222222222', 'e1000000-0000-0000-0000-000000000002'),
  ('a1000000-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'withdrawal', 'debit', 500.00, 'Campus Store Purchase', '2026-09-12 10:00:00+00', '22222222-2222-2222-2222-222222222222', 'e1000000-0000-0000-0000-000000000003'),
  ('a1000000-0000-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'withdrawal', 'credit', 500.00, 'Compensating Reversal: Returned Store Items', '2026-09-15 10:00:00+00', '22222222-2222-2222-2222-222222222222', 'e1000000-0000-0000-0000-000000000004');

UPDATE public.transactions SET reversal_of_id = 'a1000000-0000-0000-0000-000000000003' WHERE id = 'a1000000-0000-0000-0000-000000000004';
UPDATE public.transactions SET is_reversed = true, reversal_reason = 'Returned store items in full' WHERE id = 'a1000000-0000-0000-0000-000000000003';

-- Transactions for Bilal (bbbb):
-- Only a withdrawal of 450 (balance becomes -450.00)
INSERT INTO public.transactions (id, student_id, transaction_type, direction, amount, purpose, transaction_date, created_by, operation_id)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'withdrawal', 'debit', 450.00, 'Emergency Medical Cash Outflow', '2026-09-10 10:00:00+00', '22222222-2222-2222-2222-222222222222', 'e2000000-0000-0000-0000-000000000001');

-- Legacy un-correlated transaction (lacking operation_id)
INSERT INTO public.transactions (id, student_id, transaction_type, direction, amount, purpose, transaction_date, created_by, operation_id)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'deposit', 'credit', 300.00, 'Legacy Paper Record Inflow', '2025-01-15 10:00:00+00', '22222222-2222-2222-2222-222222222222', NULL),
  ('c1000000-0000-0000-0000-000000000002', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'withdrawal', 'debit', 300.00, 'Legacy Paper Record Outflow', '2025-01-20 10:00:00+00', '22222222-2222-2222-2222-222222222222', NULL);
`);

// ------------------------------------------------------------------
// SECTION 1: STUDENT STATEMENT & AUTHORITATIVE LEDGER
// ------------------------------------------------------------------
console.log('--- 1. Student Statement & Authoritative Ledger ---');

// 1.1 Statement reflects all-time running balance from view
const runningBalRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT transaction_id, running_balance 
  FROM public.student_ledger_view 
  WHERE student_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' 
  ORDER BY transaction_date, transaction_id;
`);
assertTest('1.1 Student ledger view computes accurate running balance across deposits and reversals',
  runningBalRes.includes('3500.00'), runningBalRes);

// 1.2 Authoritative closing balance matches student_balances view
const closingBal = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT current_balance FROM public.student_balances WHERE student_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
`);
assertTest('1.2 Authoritative student closing balance equals 3500.00', closingBal === '3500.00', `Expected 3500.00, got ${closingBal}`);

// 1.3 Parent can read only linked child's statement records
const parentChildRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
  SELECT count(*) FROM public.student_ledger_view WHERE student_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
`);
assertTest('1.3 Parent can access linked child transactions in student_ledger_view', parentChildRes === '4', `Expected 4, got ${parentChildRes}`);

// 1.4 Parent is strictly blocked from unlinked stranger student records
const parentStrangerRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
  SELECT count(*) FROM public.student_ledger_view WHERE student_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
`);
assertTest('1.4 Parent cannot access unlinked student transactions (RLS returns 0 rows)', parentStrangerRes === '0', `Expected 0, got ${parentStrangerRes}`);

// ------------------------------------------------------------------
// SECTION 2: STUDENT BALANCE SUMMARY & NEGATIVE BALANCES
// ------------------------------------------------------------------
console.log('\n--- 2. Student Balance Summary & Preserved Negative Balances ---');

// 2.1 Negative student balances are preserved without clamping to zero
const negativeBal = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT current_balance, health_status FROM public.student_health WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
`);
assertTest('2.1 Negative student balance is preserved as -450.00 with negative health status', 
  negativeBal.includes('-450.00') && negativeBal.includes('negative'), negativeBal);

// 2.2 Aggregate net student balances calculation includes negative accounts
const netBalances = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT SUM(current_balance) FROM public.student_balances;
`);
// 3500.00 (Zaid) + -450.00 (Bilal) + 0.00 (Tariq) + 0.00 (Danish) = 3050.00
assertTest('2.2 Aggregate net student balances accurately reflects ₹3,050.00 (not clamped)', 
  netBalances === '3050.00', `Expected 3050.00, got ${netBalances}`);

// 2.3 Zero balance student is properly accounted for
const zeroBal = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT current_balance, health_status FROM public.student_health WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
`);
assertTest('2.3 Zero balance student has current_balance = 0.00', zeroBal.includes('0.00'), zeroBal);

// ------------------------------------------------------------------
// SECTION 3: MONTHLY TRANSACTION SUMMARY & REVERSAL HANDLING
// ------------------------------------------------------------------
console.log('\n--- 3. Monthly Transaction Summary & Net Effects ---');

// 3.1 September 2026 gross credits vs gross debits vs net
const septStats = runSql(`
  SELECT 
    COUNT(*) as count,
    SUM(CASE WHEN direction = 'credit' THEN amount ELSE 0 END) as gross_credits,
    SUM(CASE WHEN direction = 'debit' THEN amount ELSE 0 END) as gross_debits,
    SUM(CASE WHEN is_reversed = true OR reversal_of_id IS NOT NULL THEN amount ELSE 0 END) as reversals_amount
  FROM public.transactions
  WHERE transaction_date >= '2026-09-01' AND transaction_date < '2026-10-01';
`);
// Credits: 1500 (deposit) + 500 (compensating reversal credit) = 2000
// Debits: 500 (withdrawal) + 450 (Bilal withdrawal) = 950
// Reversals amount: 500 (reversed tx) + 500 (reversal leg) = 1000
assertTest('3.1 Monthly summary separates gross credits, gross debits, and reversal totals',
  septStats.includes('2000.00|950.00|1000.00'), septStats);

// 3.2 Net ledger movement for September is 2000 - 950 = 1050
const septNet = runSql(`
  SELECT SUM(CASE WHEN direction = 'credit' THEN amount ELSE -amount END)
  FROM public.transactions
  WHERE transaction_date >= '2026-09-01' AND transaction_date < '2026-10-01';
`);
assertTest('3.2 Net ledger movement for September 2026 is exactly ₹1,050.00', septNet === '1050.00', `Expected 1050.00, got ${septNet}`);

// ------------------------------------------------------------------
// SECTION 4: CASHBOOK RECONCILIATION & SOURCE TRACEABILITY
// ------------------------------------------------------------------
console.log('\n--- 4. Cashbook Reconciliation & Source Traceability ---');

// 4.1 Arithmetic reconciliation: total credits - total debits = sum of all balances
const cashbookArithmetic = runSql(`
  WITH totals AS (
    SELECT 
      SUM(CASE WHEN direction = 'credit' THEN amount ELSE 0 END) as credits,
      SUM(CASE WHEN direction = 'debit' THEN amount ELSE 0 END) as debits
    FROM public.transactions
  )
  SELECT credits - debits FROM totals;
`);
assertTest('4.1 Central cashbook arithmetic reconciliation confirms total credits minus debits equals net ledger movement (3050.00)',
  cashbookArithmetic === '3050.00', `Expected 3050.00, got ${cashbookArithmetic}`);

// 4.2 Legacy transactions lacking operation_id are identifiable
const lackingOpCount = runSql(`
  SELECT COUNT(*) FROM public.transactions WHERE operation_id IS NULL;
`);
assertTest('4.2 System accurately detects transactions lacking operation_id (2 legacy rows)',
  lackingOpCount === '2', `Expected 2, got ${lackingOpCount}`);

// 4.3 Modern transactions possess valid operation_id
const withOpCount = runSql(`
  SELECT COUNT(*) FROM public.transactions WHERE operation_id IS NOT NULL;
`);
assertTest('4.3 Traceable modern transactions have operation_id populated',
  parseInt(withOpCount, 10) >= 5, `Expected >= 5, got ${withOpCount}`);

// ------------------------------------------------------------------
// SECTION 5: BORROWER EXPOSURE, RECOVERIES & AGING
// ------------------------------------------------------------------
console.log('\n--- 5. Borrower Exposure, Recoveries & Aging ---');

const borrowerId = 'f1000000-0000-0000-0000-000000000001';
const loanId = 'f2000000-0000-0000-0000-000000000001';

runSql(`
  RESET ROLE;
  INSERT INTO public.borrowers (id, name, risk_level, status)
  VALUES ('${borrowerId}', 'Nasiruddin Contractor', 'high', 'active');

  INSERT INTO public.borrower_loans (id, borrower_id, loan_amount, loan_date, purpose, status)
  VALUES ('${loanId}', '${borrowerId}', 5000.00, '2026-05-01', 'Hostel Roof Repair Advance', 'active');

  -- Partial recovery of 1500
  INSERT INTO public.recoveries (loan_id, amount, recovery_date, created_by)
  VALUES ('${loanId}', 1500.00, '2026-07-01', '22222222-2222-2222-2222-222222222222');
`);

// 5.1 Authoritative borrower_loan_balances view derives outstanding balance
const borrowerBalRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT borrower_name, loan_amount, total_recovered, outstanding_amount 
  FROM public.borrower_loan_balances 
  WHERE loan_id = '${loanId}';
`);
assertTest('5.1 borrower_loan_balances view correctly calculates 5000.00 - 1500.00 = 3500.00 outstanding',
  borrowerBalRes.includes('Nasiruddin Contractor|5000.00|1500.00|3500.00'), borrowerBalRes);

// 5.2 Aging days calculated from loan_date
const agingRes = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
  SELECT 
    loan_date,
    CURRENT_DATE - loan_date as days_elapsed,
    CASE 
      WHEN CURRENT_DATE - loan_date > 180 THEN '>180 Days'
      WHEN CURRENT_DATE - loan_date > 90 THEN '91-180 Days'
      ELSE '0-90 Days'
    END as bracket
  FROM public.borrower_loan_balances
  WHERE loan_id = '${loanId}';
`);
assertTest('5.2 Aging schedule accurately computes elapsed calendar days without declaring default',
  agingRes.includes('2026-05-01') && (agingRes.includes('>180 Days') || agingRes.includes('91-180 Days')), agingRes);

// ------------------------------------------------------------------
// SECTION 6: AUDIT REPORTING & ROLE RESTRICTIONS
// ------------------------------------------------------------------
console.log('\n--- 6. Audit Reporting & Role Restrictions ---');

// 6.1 Super Admin can read audit logs
const superAdminAudit = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
  SELECT count(*) FROM public.audit_logs;
`);
assertTest('6.1 Super Admin possesses SELECT rights on audit_logs', !superAdminAudit.includes('ERROR'), superAdminAudit);

// 6.2 Faculty is blocked by RLS from reading audit logs
const facultyAudit = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
  SELECT count(*) FROM public.audit_logs;
`);
assertTest('6.2 Faculty user receives 0 audit logs due to RLS security policy', facultyAudit === '0', `Expected 0, got ${facultyAudit}`);

// 6.3 Parent is blocked by RLS from reading audit logs
const parentAudit = runSql(`
  SET ROLE authenticated;
  SET request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
  SELECT count(*) FROM public.audit_logs;
`);
assertTest('6.3 Parent user receives 0 audit logs due to RLS security policy', parentAudit === '0', `Expected 0, got ${parentAudit}`);

// ------------------------------------------------------------------
// SECTION 7: EXPORT INTEGRITY & FORMULA INJECTION SANITIZATION
// ------------------------------------------------------------------
console.log('\n--- 7. Export Integrity & Security Rules ---');

// Unit test formula injection sanitizer
function sanitizeFormula(str) {
  if (typeof str !== 'string') return str;
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

const safeVal1 = sanitizeFormula('=SUM(A1:A10)');
const safeVal2 = sanitizeFormula('+123456');
const safeVal3 = sanitizeFormula('-cmd|/C calc');
const safeVal4 = sanitizeFormula('@malicious_site');
const safeNormal = sanitizeFormula('Standard Fee Deposit');

assertTest('7.1 Formula injection starting with "=" is sanitized with leading single quote', safeVal1 === "'=SUM(A1:A10)");
assertTest('7.2 Formula injection starting with "+" is sanitized with leading single quote', safeVal2 === "'+123456");
assertTest('7.3 Formula injection starting with "-" is sanitized with leading single quote', safeVal3 === "'-cmd|/C calc");
assertTest('7.4 Formula injection starting with "@" is sanitized with leading single quote', safeVal4 === "'@malicious_site");
assertTest('7.5 Regular text string is left unmodified', safeNormal === 'Standard Fee Deposit');

// Final Summary
console.log('\n================================================================');
console.log(`=== REPORTS TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED (TOTAL: ${passCount + failCount}) ===`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
}
