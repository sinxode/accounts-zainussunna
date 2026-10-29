# ZLS Rebuild — Release Readiness Assessment & Deployment Checklist

**Document Version:** 1.0.0  
**Phase:** Prompt 7 of 8  
**System:** Zainussunna Ledger System (ZLS)  
**Date:** 2026-10-29  
**Branch:** `zls-rebuild`  
**Production Deployment Authorized:** NO (Pending Prompt 8 Final Signoff)

---

## 1. Environment & Build Configuration

| Component | Setting / Variable | Verification Status | Notes |
| :--- | :--- | :---: | :--- |
| **Vite / React Build** | `tsc -b && vite build` | **PASS (0 errors)** | Bundle created in 4.59s; static chunks generated in `frontend/dist/` |
| **TypeScript** | Strict mode | **PASS** | Rebuild services, hooks, and pages compile cleanly |
| **Frontend Env** | `VITE_SUPABASE_URL` | Configured | Must point to production Supabase project URL |
| **Frontend Env** | `VITE_SUPABASE_ANON_KEY`| Configured | Public client anon key for RLS-filtered requests |
| **Auth Redirects** | Site URL / Auth Callback | Required in Supabase | Verify `https://<production-domain>/` and `/auth/callback` in Supabase Auth settings |
| **CORS Origins** | Allowed Web Origins | Required in Supabase | Restrict to official academy domains |

---

## 2. Automated Test Suite Status

| Phase | Test Suite Script | Scope | Passed | Failed | Status |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Phase 2** | `tests/security/test_security_foundation.js` | RBAC, RLS policies, role escalation protection | 14 | 0 | **100% PASS** |
| **Phase 3** | `tests/financial/test_financial_engine.js` | RPC posting, double-entry math, reversals, loans | 30 | 0 | **100% PASS** |
| **Phase 4** | `tests/ui/test_ui_core.js` | Navigation guards, student ledger, drawer validation | 15 | 0 | **100% PASS** |
| **Phase 5** | `tests/operations/test_operational_workflows.js`| Bulk composer, lending, period lock, user admin | 29 | 0 | **100% PASS** |
| **Phase 6** | `tests/reports/test_reports_and_exports.js` | 10 reports, cashbook reconciliation, loan aging, exports | 22 | 0 | **100% PASS** |
| **Phase 7** | `tests/e2e/test_rebuild_scenarios.js` | End-to-end scenarios A through J | 21 | 0 | **100% PASS** |
| **TOTAL** | | Complete Rebuild Coverage | **131** | **0** | **100% PASS** |

---

## 3. Database Migration Order & Idempotency

When applying migrations to production during Prompt 8, execute strictly in sequential order:

1. `20261028000000_security_rbac_foundation.sql`:
   - Creates `parent_students` link table.
   - Creates `admin_set_user_role` and role guard functions.
   - Enforces RLS on `profiles`, `students`, `parent_students`, and `transactions`.
2. `20261028000001_financial_engine_core.sql`:
   - Adds `reversal_of_id`, `operation_id`, and `idempotency_key` columns.
   - Creates `internal_loans` and `internal_loan_repayments` tables.
   - Deploys atomic RPCs (`rpc_post_transaction`, `rpc_post_bulk_transactions`, `rpc_reverse_transaction`, `rpc_post_internal_transfer`, `rpc_repay_internal_loan`, `rpc_record_borrower_recovery`).
   - Revokes client table mutations on `transactions`.
3. `20261029000000_operational_workflows.sql`:
   - Configures period locks on `accounting_periods`.
   - Secures `audit_logs`, `saved_batches`, `transaction_presets`, `borrowers`, `settings`.
   - Deploys administrative RPCs (`admin_set_user_active`, `rpc_set_accounting_period_lock`, `rpc_update_setting`).
4. `20261030000000_reporting_and_reconciliation.sql`:
   - Upgrades `borrower_loan_balances` view with metadata and security grants.
   - Ensures `audit_logs` is queryable by financial administrators.

---

## 4. Pre-Release User Verification

1. **Initial Super Admin Account:**
   - Identity: `Sinanneyy` (User UUID: `3567680f-e34c-42ec-90df-371fc3469a43`).
   - Role: `owner` (Super Admin).
   - Verification: Confirm user can log in via Supabase Auth and navigate to `/administration/users`.
2. **Staff & Faculty Roles:**
   - Verify staff profiles are assigned correct operational roles (`admin` or `faculty`).
3. **Parent Link Verification:**
   - Verify parent accounts are linked exclusively to their own children via `parent_students`.

---

## 5. Non-Destructive Rollback Plan

If production anomalies arise:
1. **Frontend Fallback:** Revert Vercel deployment alias to the previous stable release commit.
2. **Database Continuity:** The four rebuild migrations are forward-additive. They add new columns, RPCs, and views without dropping existing production tables or removing historical transaction rows. The legacy frontend can continue reading and writing to the database if necessary.
3. **Full Database Rollback:** In the unlikely event of irreversible data corruption, restore from `~/Documents/ZLS-Database-Backup` (`zls-roles.sql`, `zls-schema.sql`, `zls-data.sql`).
