# ZLS Rebuild — Controlled Staging UAT Report

**Execution Date:** October 29, 2026  
**Auditor / Engineer:** Antigravity AI Senior Systems Engineer  
**Git Branch:** `zls-rebuild`  
**Test Databases:** `zls_staging_uat` (Synthetic Workflows), `zls_restore_test` (Restored Historical Backup Rehearsal)  
**Production Status:** 100% Isolated — Zero Connections, Zero Writes, Zero Migrations  

---

## 1. Executive Summary

A comprehensive, controlled User Acceptance Testing (UAT) rehearsal was executed on the rebuilt Zainussunna Ledger System (ZLS). The assessment verified end-to-end functionality across core user journeys, multi-role authorization, financial posting atomicity, idempotency, external loan tracking, audit log immutability, report reconciliation, and database migration repeatability.

All testing occurred in strictly isolated local environments (`localhost:5432`) utilizing synthetic datasets. The production Supabase environment (`https://zlbwaqixmjrgxbqflnyp.supabase.co`) remained completely untouched.

**Overall UAT Result:** **26 / 26 Scenario Workflows Passed (100%)**  
**Overall Regression Suite:** **157 / 157 Tests Passed (100%)**  
**Frontend Production Build:** **0 Errors, 0 Warnings (Exit Code 0)**  
**Historical Ledger Arithmetic Variance:** **₹0.00 (Zero Variance)**  

---

## 2. Phase A — Environment Isolation Verification

Strict environment isolation safeguards were verified prior to executing any UAT operations:

| Item | Expected Configuration | Verified Staging Status | Isolation Result |
| :--- | :--- | :--- | :--- |
| **Git Working Tree** | `zls-rebuild` branch | Checked via `git status`, on `zls-rebuild` | Verified Isolated |
| **Production Supabase** | `https://zlbwaqixmjrgxbqflnyp.supabase.co` | Untouched; zero network calls or mutations | Verified Isolated |
| **Staging Target DB** | Synthetic local database | `postgresql://localhost:5432/zls_staging_uat` | Verified Isolated |
| **Restore Rehearsal DB** | Backup clone local database | `postgresql://localhost:5432/zls_restore_test` | Verified Isolated |
| **Secrets Handling** | No credentials in logs or reports | Redacted `***` in environment and documentation | Verified Compliant |

---

## 3. Phase B — Baseline Verification & Automated Regression

All automated test suites were executed sequentially against the local test database instances:

| Suite ID | Test Suite Description | Tests Run | Result | Exit Code |
| :--- | :--- | :--- | :--- | :--- |
| **TEST-01** | `tests/security/test_security_foundation.js` | 14 | 14 Passed, 0 Failed | 0 |
| **TEST-02** | `tests/financial/test_financial_engine.js` | 30 | 30 Passed, 0 Failed | 0 |
| **TEST-03** | `tests/ui/test_ui_core.js` | 15 | 15 Passed, 0 Failed | 0 |
| **TEST-04** | `tests/operations/test_operational_workflows.js` | 29 | 29 Passed, 0 Failed | 0 |
| **TEST-05** | `tests/reports/test_reports_and_exports.js` | 22 | 22 Passed, 0 Failed | 0 |
| **TEST-06** | `tests/e2e/test_rebuild_scenarios.js` | 21 | 21 Passed, 0 Failed | 0 |
| **TEST-07** | `tests/staging_uat/test_staging_uat_workflows.js` | 26 | 26 Passed, 0 Failed | 0 |
| **TOTAL** | **Comprehensive Regression Suite** | **157** | **157 Passed, 0 Failed** | **0** |

### Frontend Build Verification
- **Command:** `cd frontend && npm run build`
- **Output:** Built in 5.56s.
- **Result:** Successfully generated production bundles (`dist/index.html`, `dist/assets/*`). Zero compilation or bundling errors.

---

## 4. Phase C — Synthetic Workflows UAT Execution

Testing was conducted using synthetic personas and data fixtures in `zls_staging_uat`:

### 1. Authentication and Permissions
- **UAT-1.1 (PASS):** Super Admin (`super_admin`) can assign user roles (`admin_set_user_role`) and manage administrative privileges.
- **UAT-1.2 (PASS):** Operational Admin (`admin`) attempting role escalation or assigning Super Admin role is rejected with `FORBIDDEN`.
- **UAT-1.3 (PASS):** Academic Faculty (`faculty`) can view student directory information in read-only mode.
- **UAT-1.4 (PASS):** Academic Faculty attempting direct insert/mutation of student records or financial transactions is blocked by RLS policies.
- **UAT-1.5 (PASS):** Parent (`parent`) accesses linked child record (`SYN-001`) with complete row isolation; queries for unlinked stranger students (`SYN-002`) return 0 rows.

### 2. Deposits and Withdrawals
- **UAT-2.1 (PASS):** Admin posts valid ₹1,500.00 deposit; authoritative balance increments accurately to ₹1,500.00.
- **UAT-2.2 (PASS):** Financial engine rejects non-positive amounts (₹0.00, -₹100.00) with `INVALID_ARGUMENT`.
- **UAT-2.3 (PASS):** Duplicate deposit submission with identical idempotency key returns idempotent replay without creating duplicate transaction rows.
- **UAT-2.4 (PASS):** Valid withdrawal exceeding current student balance posts accurately resulting in negative balance (-₹500.00) and displays `negative` health indicator without clamping.

### 3. Bulk Transactions
- **UAT-3.1 (PASS):** Multi-student bulk composer atomically posts multiple legs across active students with a shared `operation_id`.
- **UAT-3.2 (PASS):** Bulk operation containing an invalid leg (e.g., archived student `SYN-003`) fails atomically; zero partial rows are committed.

### 4. Reversals & Auditability
- **UAT-4.1 (PASS):** Reversing a transaction preserves the original record immutably and marks `is_reversed = true` with metadata.
- **UAT-4.2 (PASS):** Reversal creates a linked compensating leg with opposite direction and identical amount (`reversal_of_id`).
- **UAT-4.3 (PASS):** Double reversal of an already-reversed transaction is rejected with `ALREADY_REVERSED`.
- **UAT-4.4 (PASS):** Reversal with insufficient reason length (< 10 characters) is rejected with `INVALID_ARGUMENT`.

### 5. Internal Student Loans
- **UAT-5.1 (PASS):** Peer student loan transfers funds atomically (debiting lender, crediting borrower) and creates tracking row in `internal_loans`.
- **UAT-5.2 (PASS):** Partial repayment decrements outstanding loan balance from ₹300.00 to ₹200.00 with `active` status.
- **UAT-5.3 (PASS):** Final repayment decrements outstanding balance to ₹0.00 and marks loan status as `settled`.

### 6. External Loans and Recoveries
- **UAT-6.1 (PASS):** External borrower loan recovery of ₹1,500.00 decrements outstanding principal balance from ₹5,000.00 to ₹3,500.00.
- **UAT-6.2 (PASS):** External loan recovery does not inject fictitious unapproved rows into the student ledger or academy cashbook.

### 7. Accounting Periods
- **UAT-7.1 (PASS):** Financial administrator successfully locks past accounting period (2026-06).
- **UAT-7.2 (PASS):** Transactions or mutations backdated into a locked accounting period are blocked by database trigger (`PERIOD_LOCKED`).

### 8. Reports and Exports
- **UAT-8.1 (PASS):** Student statement query returns accurate transaction timeline for linked guardian while isolating unlinked student records.
- **UAT-8.2 (PASS):** Academy cashbook arithmetic: Net ledger movement equals the exact sum of all student balances down to 2 decimal places.

### 9. Audit Logging Integrity
- **UAT-9.1 (PASS):** Structured audit events are recorded for transaction postings, reversals, and loan lifecycle events.
- **UAT-9.2 (PASS):** Direct client mutation or deletion (`DELETE FROM public.audit_logs`) executed under authenticated role is blocked by RLS policies (`DELETE 0` rows affected).

---

## 5. Phase D — Database Reconciliation Against Rehearsal Data

Reconciliation was re-verified against the restored historical backup rehearsal (`zls_restore_test`):

```
================================================================
=== HISTORICAL RECONCILIATION SUMMARY (zls_restore_test)     ===
================================================================
Total Students:                       79 (65 active, 14 archived)
Total Transactions:                   303
  - Credit Transactions (Deposits):   102 (₹225,702.84)
  - Debit Transactions (Withdrawals): 201 (₹92,936.57)
----------------------------------------------------------------
Calculated Net Cashbook Movement:     ₹132,766.27
Authoritative Sum of Student Balances: ₹132,766.27
Ledger Arithmetic Variance:           ₹0.00 (PERFECT RECONCILIATION)
----------------------------------------------------------------
Negative Balance Accounts:            24 accounts (-₹29,565.67)
External Borrower Loans:              20 loans (₹196,562.00)
External Recoveries Recorded:         0 rows (₹0.00)
Operation IDs:                        113 populated, 190 NULL (legacy)
================================================================
```

### Critical Accounting Disclosures & Guardrails
1. **Negative Balances (-₹29,565.67 across 24 students):**
   - Negative balances are presented purely as arithmetic debit balances.
   - The system **does not** assume or claim these balances are caused by "missing opening deposits" without physical paper vouchers.
   - The system **does not** generate automated debt demand notices to guardians prior to manual administrative reconciliation.
2. **Historical External Borrower Loans (₹196,562.00 across 20 loans):**
   - All 20 loans remain recorded with status `active` and ₹0.00 recoveries recorded in historical data.
   - The system **does not** assume these loans are settled, forgiven, or collectible without formal academy management review.

---

## 6. Phase E — Migration & Recovery Readiness

1. **Migration Repeatability from Scratch:**
   - All 12 SQL migrations apply sequentially and cleanly to a completely fresh database (`zls_staging_uat`).
   - Addressed initial scratch-build dependency: ensured `operation_id` column addition in `20261028000000_security_rbac_foundation.sql` before `student_ledger_view` definition.
2. **Rehearsal on Production Backup Clone:**
   - Full restore and migration sequence validated on `zls_restore_test`.
   - Verified that all 303 transactions and 79 student records retain 100% data integrity with zero data loss.
3. **Backup and Rollback Plan:**
   - Verified pre-migration backup commands (`pg_dump -Fc` and `pg_dump --clean`).
   - Disaster recovery rollback script verified to restore schema and data in under 2 minutes.
