# ZLS Rebuild — Final Defect & Finding Register

**Document Version:** 1.0.0  
**Phase:** Prompt 8 of 8  
**System:** Zainussunna Ledger System (ZLS)  
**Date:** 2026-10-29  
**Branch:** `zls-rebuild`

---

## Defect Severity Scale
- **Critical:** Exploitable authorization flaw, material risk of incorrect financial records, data loss, or unsafe production migration.
- **High:** Important workflow broken, major financial/reporting error, significant security weakness, or migration-integrity failure.
- **Medium:** Usability defect, incomplete behavior, or non-critical correctness issue.
- **Low:** Minor visual, documentation, or maintainability issue.

---

## 1. Register of Identified & Remediated Defects

### DEF-001: Parent Access Blocked on Student Statement Route
- **Severity:** High
- **Area:** Frontend Routing & Access Control (`App.tsx`, `ReportTabs.tsx`)
- **Description:** `StudentReports.tsx` implements explicit parent logic to auto-lock the statement to the parent's linked child. However, in `App.tsx`, all routes under `/reports/*` were wrapped in `<Route element={<AuthGuard allowedRoles={['super_admin', 'admin', 'faculty', 'owner', 'manager', 'staff']} />}>`, causing parents to receive a 403 Access Denied redirect when navigating to their child's account statement.
- **Impact:** Parents could not access the official downloadable account statement page.
- **Fix Applied:**
  1. Updated `frontend/src/App.tsx` to separate `/reports/student-statement` into an independent route allowing `parent` role while maintaining strict non-parent guards on all institutional reports.
  2. Updated `frontend/src/components/reports/ReportTabs.tsx` to filter tabs dynamically, displaying only `Student Statement` when logged in as `parent`.
- **Regression Test:** `node tests/ui/test_ui_core.js` and `npm run build`.
- **Status:** **RESOLVED & VERIFIED**
- **Release Blocking:** No

---

### DEF-002: PostgreSQL 14 View Owner RLS Denial on Borrower Loan Balances
- **Severity:** High
- **Area:** Database Migration (`supabase/migrations/20261030000000_reporting_and_reconciliation.sql`)
- **Description:** Setting `ALTER VIEW public.borrower_loan_balances OWNER TO authenticated;` on PostgreSQL 14 (which lacks PostgreSQL 15's `security_invoker = true` support) caused queries without an active JWT claim to evaluate RLS policies as `auth.uid() = NULL`, returning 0 rows for administrative queries.
- **Impact:** Tests and background reports failed to calculate borrower loan exposure when executing as standard database roles.
- **Fix Applied:** Modified migration to conditionally apply `security_invoker = true` only when `server_version_num >= 150000`, retaining standard view ownership and explicit `GRANT SELECT ON public.borrower_loan_balances TO authenticated`.
- **Regression Test:** `node tests/financial/test_financial_engine.js` (Test 5.1-5.3) and `node tests/reports/test_reports_and_exports.js` (Test 5.1-5.2).
- **Status:** **RESOLVED & VERIFIED**
- **Release Blocking:** No

---

### DEF-003: Formula Injection Vectors in Tabular Exports
- **Severity:** High
- **Area:** Export Engine (`frontend/src/lib/exportService.ts`)
- **Description:** Raw CSV and Excel exports could execute arbitrary formulas if user input (e.g. student names or purpose descriptions) began with formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`).
- **Impact:** Potential remote code execution or data exfiltration on machines opening exported CSV/Excel files.
- **Fix Applied:** Implemented `sanitizeFormulaInjection` in `exportService.ts` to automatically prefix dangerous characters with a single quote (`'`), and added `\uFEFF` UTF-8 BOM to prevent character corruption.
- **Regression Test:** `tests/reports/test_reports_and_exports.js` (Tests 7.1-7.5) and `tests/e2e/test_rebuild_scenarios.js` (Scenario J.1).
- **Status:** **RESOLVED & VERIFIED**
- **Release Blocking:** No

---

### DEF-004: Missing Supabase Schema Stubs in Local PostgreSQL
- **Severity:** Medium
- **Area:** Staging Restore & Migration Rehearsal (`zls_restore_test`)
- **Description:** `zls-schema.sql` dumped from Supabase references `auth.uid()` and `auth.role()` functions. In a standalone local PostgreSQL database, these functions are not present by default, causing DDL and RLS compilation errors.
- **Impact:** Restoring raw dumps into an isolated staging instance requires compatibility stubs.
- **Fix Applied:** Documented prerequisites in `MIGRATION_CONTRACT_AND_RECONCILIATION.md` and added automated creation of `auth.uid()` and `auth.role()` stubs during local rehearsal setup.
- **Regression Test:** `tests/e2e/test_rebuild_scenarios.js` (Scenario I.1-I.2).
- **Status:** **RESOLVED & VERIFIED**
- **Release Blocking:** No

---

### DEF-005: Bulk Transaction Payload Key Inconsistency
- **Severity:** Medium
- **Area:** Operational Workflow (`rpc_post_bulk_transactions`)
- **Description:** Client drawer components and test scripts inconsistently formatted the transaction type key in JSON payloads (using `type` instead of `transaction_type`), causing not-null constraint errors during bulk posting.
- **Impact:** Bulk transactions failed validation on the database side.
- **Fix Applied:** Standardized JSON property extraction to `(v_item->>'transaction_type')::public.transaction_type` and aligned all test payloads.
- **Regression Test:** `tests/e2e/test_rebuild_scenarios.js` (Scenario C.1-C.2).
- **Status:** **RESOLVED & VERIFIED**
- **Release Blocking:** No

---

## 2. Unresolved Accounting Observations (Gated by Release Conditions)

| Item ID | Area | Observation & Accounting Risk | Current System Handling | Release Condition |
| :--- | :--- | :--- | :--- | :--- |
| **OBS-001** | External Loans | 20 active loans totaling ₹196,562.00 exist without maturity dates, interest terms, or repayment records in the database. Offline repayments may have occurred. | Displayed with prominent pre-rebuild historical loan disclaimer. | Requires written administrative review of the 20 loans before release. |
| **OBS-002** | Student Balances | 24 student accounts show negative balances (-₹29,565.67) due to unrecorded pre-August 2026 opening deposits. | Preserved honestly without artificial clamping; labeled `Negative Balance`. | Requires administrative communication to affected students/guardians. |
| **OBS-003** | Cashbook Vault | Arithmetic ledger consistency (₹132,766.27 net) is verified, but physical cash on hand in the vault is unverified. | Cashbook report explicitly discloses `UNVERIFIED_PENDING_PHYSICAL_AUDIT`. | Requires physical cash vault count by academy bursar. |
