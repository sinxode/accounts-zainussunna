# ZLS Quality Assurance & Test Strategy

**Document Version:** 1.0.0  
**Status:** Approved Foundation  
**System:** Zainussunna Ledger System (ZLS)  

---

## 1. Test Architecture Overview

Because ZLS manages institutional finances and student trust funds, testing must guarantee mathematical precision, transaction atomicity, and strict data isolation.

The existing codebase contains **0 automated tests**. The rebuild establishes a modern testing pyramid:

```
               / \
              /   \
             / E2E \          Playwright (Critical user journeys)
            /-------\
           /  Integ  \        Vitest + React Testing Library (Components & Hooks)
          /-----------\
         /  Database   \      pgTAP / Node SQL runner (RLS policies, RPC atomicity)
        /---------------\
       /      Unit       \    Vitest (Financial calculations, utilities, regex)
      +-------------------+
```

---

## 2. Testing Levels & Tooling

1. **Unit Testing (Vitest)**:
   - Scope: Pure functions, currency formatters (`formatCurrency`), regex name cleanups (`formatDisplayName`), date parsers, and financial statement math.
   - Target Execution Time: `< 2 seconds`.
2. **Database & Authorization Testing (pgTAP / Node Test Suite)**:
   - Scope: Row Level Security (RLS) enforcement across all four roles, atomic rollback on multi-leg RPCs, and trigger validation.
   - Run against a dedicated local or ephemeral Supabase test container.
3. **Integration Testing (React Testing Library + Vitest)**:
   - Scope: Drawer form interactions, keyboard shortcuts (`Enter`, `Cmd+Enter`), query invalidation, and optimistic state updates.
4. **End-to-End Testing (Playwright)**:
   - Scope: Full browser journeys: Login $\rightarrow$ Compose Batch Transactions $\rightarrow$ Inspect Student Ledger $\rightarrow$ Download PDF Statement.

---

## 3. Required Test Scenarios

### 3.1. Financial & Concurrency Scenarios

#### Scenario 1: Atomic Multi-Entry Rollback
- **Preconditions**: Student A has ₹1,000; Student B has ₹0.
- **Action**: Initiate an internal transfer of ₹500 from Student A to an invalid/non-existent student UUID.
- **Expected Outcome**: The entire transaction aborts. Student A's balance remains strictly ₹1,000. Zero rows are inserted into `transactions`.

#### Scenario 2: Concurrent Duplicate Submission Prevention
- **Preconditions**: User inputs ₹500 deposit for Student A.
- **Action**: Dispatch three concurrent requests with the identical idempotency key within 10 milliseconds.
- **Expected Outcome**: Only one transaction is inserted. Subsequent requests return the existing transaction. Student A's balance increases by exactly ₹500, not ₹1,500.

#### Scenario 3: Internal Loan Repayment & Settlement
- **Preconditions**: Student A lent ₹300 to Student B (outstanding loan = ₹300).
- **Action**: Student B repays ₹300 to Student A.
- **Expected Outcome**: A new settlement transaction is created. The original loan is NOT marked `is_reversed = true`. Student B's outstanding debt drops to ₹0, and both student ledgers maintain unbroken historical continuity.

#### Scenario 4: Transaction Reversal Integrity
- **Preconditions**: Transaction TX-100 deposited ₹1,000 for Student A.
- **Action**: Super Admin reverses TX-100 providing reason "Accidental duplicate receipt".
- **Expected Outcome**: TX-100 is marked reversed. A compensating debit entry of ₹1,000 is created referencing `reversal_of_id = TX-100`. Student balance decreases by ₹1,000. Historical statements list both entries with audit notes.

#### Scenario 5: Negative Balance Flagging
- **Preconditions**: Student A has ₹50 balance.
- **Action**: Admin processes a ₹200 store bill debit.
- **Expected Outcome**: Transaction succeeds. Student balance becomes -₹150. Health status is updated to `'negative'`.

#### Scenario 6: Locked Accounting Period Enforcement
- **Preconditions**: Accounting period for May 2026 is locked (`is_locked = true`).
- **Action**: Admin attempts to post a transaction with date `2026-05-15`.
- **Expected Outcome**: RPC throws an error: `CANNOT_POST_TO_LOCKED_PERIOD`. Zero transactions are written.

---

### 3.2. Security & Authorization Scenarios

#### Scenario 7: Parent-Child Data Isolation
- **Preconditions**: Parent user `P-1` is linked exclusively to Student `S-1`. Student `S-2` belongs to a different family.
- **Action**: `P-1` queries the `students` and `transactions` tables for records belonging to `S-2`.
- **Expected Outcome**: Database returns `0 rows`. Direct API calls to `/students/S-2` return 404 or access denied.

#### Scenario 8: Faculty Read-Only Constraint
- **Preconditions**: Faculty user authenticated.
- **Action**: Faculty user attempts to execute `rpc_post_transaction` or direct table mutations.
- **Expected Outcome**: Database throws permission denied. No data modified.

#### Scenario 9: Self-Role Escalation Block
- **Preconditions**: Staff user authenticated with user ID `U-1`.
- **Action**: `U-1` executes `UPDATE profiles SET role = 'super_admin' WHERE id = 'U-1'`.
- **Expected Outcome**: Database RLS blocks the update or updates 0 rows. Role remains `staff`.

---

### 3.3. Reporting & Migration Scenarios

#### Scenario 10: Report & Query Consistency
- **Preconditions**: Student has 10 historical transactions.
- **Action**: Generate on-screen statement and download PDF export.
- **Expected Outcome**: Opening balance, total deposits, total withdrawals, and closing balance on the PDF exactly match the on-screen display and database query totals.

#### Scenario 11: Historical Data Migration Verification
- **Preconditions**: Staging database loaded with production backup.
- **Action**: Execute migration scripts and calculate post-migration record counts and checksums.
- **Expected Outcome**: Exactly 79 students and 303 transactions present. Zero orphaned foreign keys. Aggregate financial sum matches legacy backup within ₹0.00 variance.
