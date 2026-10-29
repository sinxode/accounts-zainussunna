// ==============================================================================
// ZLS Automated Financial Engine & Ledger Integrity Test Suite
// File: tests/financial/test_financial_engine.js
// Tests all financial engine capabilities locally against zls_security_test.
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

function getStudentBalance(studentId) {
  const sql = `
    SET ROLE authenticated;
    SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
    SELECT current_balance FROM public.student_balances WHERE student_id = '${studentId}';
  `;
  const res = runSql(sql);
  return parseFloat(res) || 0;
}

console.log('================================================================');
console.log('=== ZLS REBUILD: PROMPT 3 FINANCIAL ENGINE INTEGRITY SUITE   ===');
console.log('================================================================\n');

// 1. Reset and seed test environment
runSql(`
-- Clean tables
DELETE FROM public.audit_logs;
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
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'ZLS-003', 'Student Inactive', 'archived');

-- Parent links
INSERT INTO public.parent_students (parent_profile_id, student_id, relationship_type) VALUES
  ('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'mother');

-- Test Borrower and External Loan
INSERT INTO public.borrowers (id, name, phone) VALUES
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'External Borrower X', '+919876543210');

INSERT INTO public.borrower_loans (id, borrower_id, loan_amount, loan_date, status) VALUES
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 5000.00, CURRENT_DATE, 'active');
`);

let passedCount = 0;
let failedCount = 0;

const testCases = [
  // ============================================================================
  // CATEGORY 1: TRANSACTION CREATION
  // ============================================================================
  {
    category: '1. Transaction Creation',
    name: '1.1 Valid deposit/credit increases student balance',
    run: () => {
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        SELECT public.rpc_post_transaction(
          'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          'deposit',
          'credit',
          1000.00,
          'Term Fee Deposit'
        );
      `;
      const res = runSql(sql);
      const bal = runSql(`
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        SELECT current_balance FROM public.student_balances WHERE student_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      `);
      return res.includes('"success": true') && parseFloat(bal) === 1000.00;
    }
  },
  {
    category: '1. Transaction Creation',
    name: '1.2 Valid withdrawal/debit decreases student balance',
    run: () => {
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        SELECT public.rpc_post_transaction(
          'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          'withdrawal',
          'debit',
          300.00,
          'Books Purchase'
        );
      `;
      const res = runSql(sql);
      const bal = runSql(`
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        SELECT current_balance FROM public.student_balances WHERE student_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      `);
      return res.includes('"success": true') && parseFloat(bal) === 700.00;
    }
  },
  {
    category: '1. Transaction Creation',
    name: '1.3 Posting to non-existent student fails with NOT_FOUND',
    run: () => {
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        SELECT public.rpc_post_transaction(
          '99999999-9999-9999-9999-999999999999',
          'deposit',
          'credit',
          500.00,
          'Ghost Student Deposit'
        );
      `;
      const res = runSql(sql);
      return res.includes('NOT_FOUND');
    }
  },
  {
    category: '1. Transaction Creation',
    name: '1.4 Posting to inactive student is rejected',
    run: () => {
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        SELECT public.rpc_post_transaction(
          'cccccccc-cccc-cccc-cccc-cccccccccccc',
          'deposit',
          'credit',
          500.00,
          'Deposit to archived student'
        );
      `;
      const res = runSql(sql);
      return res.includes('INVALID_OPERATION');
    }
  },
  {
    category: '1. Transaction Creation',
    name: '1.5 Zero or negative transaction amount is rejected',
    run: () => {
      const sqlZero = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        SELECT public.rpc_post_transaction(
          'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          'deposit',
          'credit',
          0.00,
          'Zero amount test'
        );
      `;
      const sqlNeg = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        SELECT public.rpc_post_transaction(
          'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          'deposit',
          'credit',
          -50.00,
          'Negative amount test'
        );
      `;
      const res1 = runSql(sqlZero);
      const res2 = runSql(sqlNeg);
      return res1.includes('INVALID_ARGUMENT') && res2.includes('INVALID_ARGUMENT');
    }
  },
  {
    category: '1. Transaction Creation',
    name: '1.6 Currency precision beyond 2 decimal places is rejected',
    run: () => {
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        SELECT public.rpc_post_transaction(
          'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          'deposit',
          'credit',
          12.345,
          'Sub-paise test'
        );
      `;
      const res = runSql(sql);
      return res.includes('INVALID_ARGUMENT');
    }
  },
  {
    category: '1. Transaction Creation',
    name: '1.7 Unauthorized roles (Faculty/Parent) cannot post transactions',
    run: () => {
      const sqlFaculty = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
        SELECT public.rpc_post_transaction('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'deposit', 'credit', 100.00, 'Test');
      `;
      const sqlParent = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
        SELECT public.rpc_post_transaction('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'deposit', 'credit', 100.00, 'Test');
      `;
      const res1 = runSql(sqlFaculty);
      const res2 = runSql(sqlParent);
      return res1.includes('FORBIDDEN') && res2.includes('FORBIDDEN');
    }
  },
  {
    category: '1. Transaction Creation',
    name: '1.8 Negative balance result remains valid and flags health as negative',
    run: () => {
      // Current balance is 700. Post withdrawal of 1000. Balance becomes -300.
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        SELECT public.rpc_post_transaction(
          'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          'withdrawal',
          'debit',
          1000.00,
          'Emergency Store Credit'
        );
      `;
      const res = runSql(sql);
      const health = runSql(`
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        SELECT current_balance, health_status FROM public.student_health WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      `);
      return res.includes('"success": true') && health.includes('-300.00|negative');
    }
  },

  // ============================================================================
  // CATEGORY 2: IDEMPOTENCY AND CONCURRENCY
  // ============================================================================
  {
    category: '2. Idempotency & Concurrency',
    name: '2.1 Same idempotency key retry returns existing transaction (replay)',
    run: () => {
      const key = 'a0000001-0000-0000-0000-000000000001';
      const sql1 = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        SELECT public.rpc_post_transaction(
          'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          'deposit',
          'credit',
          1500.00,
          'Tuition Deposit',
          '${key}'
        );
      `;
      const res1 = runSql(sql1);

      // Re-run identical request
      const sql2 = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        SELECT public.rpc_post_transaction(
          'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          'deposit',
          'credit',
          1500.00,
          'Tuition Deposit',
          '${key}'
        );
      `;
      const res2 = runSql(sql2);

      const count = runSql(`SELECT count(*) FROM public.transactions WHERE idempotency_key = '${key}';`);
      return res1.includes('"idempotent_replay": false') && res2.includes('"idempotent_replay": true') && parseInt(count) === 1;
    }
  },
  {
    category: '2. Idempotency & Concurrency',
    name: '2.2 Key reuse with conflicting parameters is rejected with conflict',
    run: () => {
      const key = 'a0000001-0000-0000-0000-000000000001';
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        SELECT public.rpc_post_transaction(
          'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          'deposit',
          'credit',
          9999.00,
          'Tampered Amount with Same Key',
          '${key}'
        );
      `;
      const res = runSql(sql);
      return res.includes('IDEMPOTENCY_CONFLICT');
    }
  },
  {
    category: '2. Idempotency & Concurrency',
    name: '2.3 Bulk operations are fully atomic (all succeed or all rollback)',
    run: () => {
      const opId = 'b0000001-0000-0000-0000-000000000001';
      // Item 1 valid, Item 2 points to ghost student
      const payload = JSON.stringify([
        { student_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', transaction_type: 'deposit', direction: 'credit', amount: 200, purpose: 'Batch Item 1' },
        { student_id: '99999999-9999-9999-9999-999999999999', transaction_type: 'deposit', direction: 'credit', amount: 200, purpose: 'Batch Item 2' }
      ]);
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        SELECT public.rpc_post_bulk_transactions(
          '${payload}',
          '${opId}'
        );
      `;
      const res = runSql(sql);
      const inserted = runSql(`SELECT count(*) FROM public.transactions WHERE operation_id = '${opId}';`);
      return res.includes('NOT_FOUND') && parseInt(inserted) === 0;
    }
  },

  // ============================================================================
  // CATEGORY 3: REVERSALS, ADJUSTMENTS AND AUDITABILITY
  // ============================================================================
  {
    category: '3. Reversals & Auditability',
    name: '3.1 Admin can reverse transaction with valid reason (>= 10 chars)',
    run: () => {
      // Find a transaction on student bbbb
      const txId = runSql(`
        SELECT id FROM public.transactions 
        WHERE student_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' AND is_reversed = false 
        LIMIT 1;
      `);
      const balBefore = getStudentBalance('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        SELECT public.rpc_reverse_transaction(
          '${txId}',
          'Accidental duplicate fee receipt reversal'
        );
      `;
      const res = runSql(sql);
      const balAfter = getStudentBalance('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

      return res.includes('"success": true') && balAfter === (balBefore - 1500.00);
    }
  },
  {
    category: '3. Reversals & Auditability',
    name: '3.2 Reversal with insufficient reason (< 10 chars) is rejected',
    run: () => {
      // Create a fresh transaction
      const txRes = runSql(`
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        SELECT public.rpc_post_transaction('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'deposit', 'credit', 250.00, 'Test short reason');
      `);
      const match = txRes.match(/"id": "([a-f0-9-]+)"/);
      const txId = match[1];

      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        SELECT public.rpc_reverse_transaction('${txId}', 'too short');
      `;
      const res = runSql(sql);
      return res.includes('INVALID_ARGUMENT');
    }
  },
  {
    category: '3. Reversals & Auditability',
    name: '3.3 Double reversal of already reversed transaction is blocked',
    run: () => {
      const txId = runSql(`
        SELECT id FROM public.transactions 
        WHERE student_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' AND is_reversed = true 
        LIMIT 1;
      `);
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        SELECT public.rpc_reverse_transaction('${txId}', 'Attempting second reversal on same row');
      `;
      const res = runSql(sql);
      return res.includes('ALREADY_REVERSED');
    }
  },
  {
    category: '3. Reversals & Auditability',
    name: '3.4 Reversing a compensating reversal entry is prohibited',
    run: () => {
      const compTxId = runSql(`
        SELECT id FROM public.transactions 
        WHERE reversal_of_id IS NOT NULL 
        LIMIT 1;
      `);
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        SELECT public.rpc_reverse_transaction('${compTxId}', 'Reversing the reversal compensating leg');
      `;
      const res = runSql(sql);
      return res.includes('INVALID_OPERATION');
    }
  },
  {
    category: '3. Reversals & Auditability',
    name: '3.5 Reversals record full audit trail with caller identity',
    run: () => {
      const audit = runSql(`
        SELECT action, entity, user_id 
        FROM public.audit_logs 
        WHERE action = 'TRANSACTION_REVERSAL' 
        LIMIT 1;
      `);
      return audit.includes('TRANSACTION_REVERSAL|transactions|22222222-2222-2222-2222-222222222222');
    }
  },

  // ============================================================================
  // CATEGORY 4: INTERNAL STUDENT LENDING
  // ============================================================================
  {
    category: '4. Internal Student Lending',
    name: '4.1 Internal loan debits lender, credits borrower, creates internal_loans record',
    run: () => {
      // First bring Student A into positive territory
      runSql(`
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        SELECT public.rpc_post_transaction('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'deposit', 'credit', 2000.00, 'Top-up');
      `);
      const aBefore = getStudentBalance('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
      const bBefore = getStudentBalance('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        SELECT public.rpc_post_internal_transfer(
          'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          500.00,
          'Mess allowance loan'
        );
      `;
      const res = runSql(sql);
      const aAfter = getStudentBalance('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
      const bAfter = getStudentBalance('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

      const loanRecord = runSql(`
        SELECT principal_amount, outstanding_amount, status 
        FROM public.internal_loans 
        WHERE lender_student_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' 
          AND borrower_student_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' 
          AND status = 'active';
      `);

      return res.includes('"success": true') &&
             aAfter === (aBefore - 500.00) &&
             bAfter === (bBefore + 500.00) &&
             loanRecord.includes('500.00|500.00|active');
    }
  },
  {
    category: '4. Internal Student Lending',
    name: '4.2 Transferring loan to oneself is rejected',
    run: () => {
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        SELECT public.rpc_post_internal_transfer(
          'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          100.00,
          'Self transfer attempt'
        );
      `;
      const res = runSql(sql);
      return res.includes('INVALID_ARGUMENT');
    }
  },
  {
    category: '4. Internal Student Lending',
    name: '4.3 Partial repayment decreases debt without mutating original transactions',
    run: () => {
      const loanId = runSql(`
        SELECT id FROM public.internal_loans 
        WHERE status = 'active' 
        LIMIT 1;
      `);
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        SELECT public.rpc_repay_internal_loan(
          '${loanId}',
          200.00,
          'Partial repayment 1'
        );
      `;
      const res = runSql(sql);
      const loanState = runSql(`SELECT outstanding_amount, status FROM public.internal_loans WHERE id = '${loanId}';`);
      // Verify NO transactions were mutated with is_reversed = true
      const mutatedCount = runSql(`SELECT count(*) FROM public.transactions WHERE is_reversed = true AND purpose LIKE '%Internal transfer%';`);

      return res.includes('"outstanding_amount": 300.00') &&
             loanState.includes('300.00|active') &&
             parseInt(mutatedCount) === 0;
    }
  },
  {
    category: '4. Internal Student Lending',
    name: '4.4 Overpayment on internal loan is rejected',
    run: () => {
      const loanId = runSql(`
        SELECT id FROM public.internal_loans 
        WHERE status = 'active' 
        LIMIT 1;
      `);
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        SELECT public.rpc_repay_internal_loan(
          '${loanId}',
          400.00,
          'Overpayment attempt'
        );
      `;
      const res = runSql(sql);
      return res.includes('OVERPAYMENT_REJECTED');
    }
  },
  {
    category: '4. Internal Student Lending',
    name: '4.5 Final repayment marks loan settled with zero outstanding',
    run: () => {
      const loanId = runSql(`
        SELECT id FROM public.internal_loans 
        WHERE status = 'active' 
        LIMIT 1;
      `);
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        SELECT public.rpc_repay_internal_loan(
          '${loanId}',
          300.00,
          'Final settlement'
        );
      `;
      const res = runSql(sql);
      const loanState = runSql(`SELECT outstanding_amount, status FROM public.internal_loans WHERE id = '${loanId}';`);
      return res.includes('"status": "settled"') && loanState.includes('0.00|settled');
    }
  },

  // ============================================================================
  // CATEGORY 5: EXTERNAL BORROWER LOANS AND RECOVERIES
  // ============================================================================
  {
    category: '5. External Borrower Loans',
    name: '5.1 Valid recovery decrements outstanding balance without fake cashbook rows',
    run: () => {
      const loanId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        SELECT public.rpc_record_borrower_recovery(
          '${loanId}',
          1500.00,
          CURRENT_DATE,
          'Bank transfer installment'
        );
      `;
      const res = runSql(sql);
      const balanceView = runSql(`SELECT outstanding_amount, total_recovered FROM public.borrower_loan_balances WHERE loan_id = '${loanId}';`);
      // Check that NO rows were inserted into public.transactions (unapproved cashbook isolation)
      const fakeTx = runSql(`SELECT count(*) FROM public.transactions WHERE purpose LIKE '%installment%';`);

      return res.includes('"outstanding_amount": 3500.00') &&
             balanceView.includes('3500.00|1500.00') &&
             parseInt(fakeTx) === 0;
    }
  },
  {
    category: '5. External Borrower Loans',
    name: '5.2 Overpayment on external borrower loan is rejected',
    run: () => {
      const loanId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        SELECT public.rpc_record_borrower_recovery(
          '${loanId}',
          5000.00,
          CURRENT_DATE,
          'Exceeds 3500 balance'
        );
      `;
      const res = runSql(sql);
      return res.includes('OVERPAYMENT_REJECTED');
    }
  },
  {
    category: '5. External Borrower Loans',
    name: '5.3 Full recovery sets external loan status to settled',
    run: () => {
      const loanId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        SELECT public.rpc_record_borrower_recovery(
          '${loanId}',
          3500.00,
          CURRENT_DATE,
          'Final loan payoff'
        );
      `;
      const res = runSql(sql);
      const loanStatus = runSql(`SELECT status FROM public.borrower_loans WHERE id = '${loanId}';`);
      return res.includes('"is_settled": true') && loanStatus === 'settled';
    }
  },

  // ============================================================================
  // CATEGORY 6: DATABASE & RLS LEDGER IMMUTABILITY
  // ============================================================================
  {
    category: '6. Database & RLS Ledger Immutability',
    name: '6.1 Direct client table INSERT on transactions is rejected',
    run: () => {
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        INSERT INTO public.transactions (student_id, transaction_type, direction, purpose, amount, created_by)
        VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'deposit', 'credit', 'Direct write bypass', 100.00, '22222222-2222-2222-2222-222222222222');
      `;
      const res = runSql(sql);
      return res.includes('permission denied');
    }
  },
  {
    category: '6. Database & RLS Ledger Immutability',
    name: '6.2 Direct client table UPDATE on transactions is rejected',
    run: () => {
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        UPDATE public.transactions SET amount = 99999.00 WHERE student_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      `;
      const res = runSql(sql);
      return res.includes('permission denied');
    }
  },
  {
    category: '6. Database & RLS Ledger Immutability',
    name: '6.3 Direct client table DELETE on transactions is rejected',
    run: () => {
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        DELETE FROM public.transactions WHERE student_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      `;
      const res = runSql(sql);
      return res.includes('permission denied');
    }
  },
  {
    category: '6. Database & RLS Ledger Immutability',
    name: '6.4 Direct client table INSERT on internal_loans is rejected',
    run: () => {
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        INSERT INTO public.internal_loans (operation_id, lender_student_id, borrower_student_id, principal_amount, outstanding_amount)
        VALUES (gen_random_uuid(), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 500, 500);
      `;
      const res = runSql(sql);
      return res.includes('permission denied');
    }
  },
  {
    category: '6. Database & RLS Ledger Immutability',
    name: '6.5 Direct client table INSERT on recoveries is rejected',
    run: () => {
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        INSERT INTO public.recoveries (loan_id, amount, created_by)
        VALUES ('ffffffff-ffff-ffff-ffff-ffffffffffff', 100, '22222222-2222-2222-2222-222222222222');
      `;
      const res = runSql(sql);
      return res.includes('permission denied');
    }
  },
  {
    category: '6. Database & RLS Ledger Immutability',
    name: '6.6 Audit trail cannot be spoofed by direct client insert',
    run: () => {
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
        INSERT INTO public.audit_logs (user_id, action, entity)
        VALUES ('11111111-1111-1111-1111-111111111111', 'FAKE_SUPER_ADMIN_ACTION', 'profiles');
      `;
      const res = runSql(sql);
      // RLS or permission must reject
      return res.includes('ERROR') || res.includes('permission denied');
    }
  }
];

let currentCat = '';
testCases.forEach((tc) => {
  if (tc.category !== currentCat) {
    currentCat = tc.category;
    console.log(`\n--- ${currentCat} ---`);
  }
  try {
    const passed = tc.run();
    if (passed) {
      console.log(`  [PASS] ${tc.name}`);
      passedCount++;
    } else {
      console.log(`  [FAIL] ${tc.name}`);
      failedCount++;
    }
  } catch (err) {
    console.log(`  [ERROR] ${tc.name}: ${err.message}`);
    failedCount++;
  }
});

console.log('\n================================================================');
console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED (TOTAL: ${testCases.length})`);
console.log('================================================================');

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
