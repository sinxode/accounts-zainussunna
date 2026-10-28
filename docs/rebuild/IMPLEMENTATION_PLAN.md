# ZLS Rebuild Implementation Plan (7 Phases)

**Document Version:** 1.0.0  
**Status:** Approved Foundation  
**System:** Zainussunna Ledger System (ZLS)  

---

## Phase 1: Foundation and Decisions (Current Phase)

### Scope
- Perform read-only audit of local codebase and live backup files.
- Establish Git branch `zls-rebuild`.
- Inventory data structures, dependencies, routes, and schema drift.
- Establish rebuild documentation suite in `docs/rebuild/`.
- Formulate test strategy and secure username authentication design.

### Dependencies
- None.

### Acceptance Criteria
- [x] Dedicated branch `zls-rebuild` checked out.
- [x] Verified full database backup exists on disk (`zls-roles.sql`, `zls-schema.sql`, `zls-data.sql`).
- [x] Documentation files created with zero placeholder text.
- [x] Zero modifications made to production database or existing application logic.

### Stop Condition
- **Halt after documentation review.** Do not proceed to database changes without explicit approval.

---

## Phase 2: Database, Authentication, and Authorization

### Scope
- Consolidate legacy migrations and hotfix scripts into clean baseline migrations.
- Define `user_role` enum: `super_admin`, `admin`, `faculty`, `parent`.
- Create `parent_students` table for guardian-child data isolation.
- Write strict PostgreSQL Row Level Security (RLS) policies preventing privilege self-escalation.
- Add missing performance indexes on all foreign keys.
- Implement server-side username authentication helper (`username@internal.zls.local`).

### Dependencies
- Phase 1 documentation approval.
- Staging Supabase / local PostgreSQL test instance.

### Acceptance Criteria
- Baseline migrations apply cleanly from scratch without errors.
- RLS tests verify that parents can only read linked children, faculty are read-only, and staff cannot elevate their own roles.
- `atomic_internal_transfer` and `clean_student_name` are tested in staging.

### Stop Condition
- All automated RLS and database schema unit tests pass.

---

## Phase 3: Financial Engine

### Scope
- Implement atomic PostgreSQL stored procedures:
  - `rpc_post_transaction`
  - `rpc_post_internal_transfer`
  - `rpc_reverse_transaction`
  - `rpc_disburse_borrower_loan`
  - `rpc_record_loan_recovery`
- Enforce append-only ledger rules; revoke direct table `INSERT`/`UPDATE`/`DELETE` from authenticated client roles.
- Integrate duplicate submission prevention via idempotency tokens.
- Implement automated audit log triggers on all financial events.

### Dependencies
- Phase 2 database baseline.

### Acceptance Criteria
- Multi-row transfers roll back completely if either leg fails.
- Reversing a transaction produces an immutable compensating entry and preserves historical records.
- Locked accounting periods reject new transactions.
- Rapid duplicate requests with identical idempotency keys return the existing record without duplicate insertions.

### Stop Condition
- Financial simulation test suite passes 100% of concurrency and atomicity checks.

---

## Phase 4: Core Application UI

### Scope
- Refactor application routing in `App.tsx` with role-aware route guards.
- Implement clean, responsive layout with collapsible sidebar and breadcrumbs.
- Connect secure username-and-password login screen.
- Rebuild Student Directory and Student Profile views with health badges and ledger history.
- Consolidate drawer and modal state into a single unified Zustand store (`useUIStore`).
- Remove orphaned files (`ReversalCenter.tsx`, `TransactionsDashboard.tsx`) and extraneous `/portfolio` code.

### Dependencies
- Phase 2 authentication and Phase 3 read views.

### Acceptance Criteria
- Login redirects users to role-appropriate views.
- Student profile renders complete transaction ledger and calculates current balance correctly.
- Global Command search navigates to valid `/transactions/:id` drawer/page without 404 errors.
- Zero visual regressions on mobile screens (`< 768px`).

### Stop Condition
- Core navigation and student management flows verified in browser.

---

## Phase 5: Operations & Lending Workflows

### Scope
- Modernize the **Transaction Composer V2** (`BulkOperationDrawer`) with atomic RPC integration.
- Upgrade Single Deposit and Single Withdrawal drawers with keyboard shortcuts (`Enter`, `Cmd+Enter`) and loading state guards.
- Rebuild Internal Transfers workflow with genuine loan/repayment lifecycle.
- Connect Outside Borrower loans and repayments to the central student fund cashbook.
- Rebuild Student Import Center with client-side XLSX/CSV parsing and preview validation.

### Dependencies
- Phase 3 financial RPCs and Phase 4 UI foundation.

### Acceptance Criteria
- Bulk operations with 50+ students post within 1 second.
- Internal student transfer repayments create explicit settlement entries.
- Borrower loan disbursements visibly debit the student cash pool.
- CSV import accurately parses, validates, and batch-imports student rosters.

### Stop Condition
- End-to-end operation flows pass validation tests.

---

## Phase 6: Reports and Exports

### Scope
- Standardize Student Account Statement generation (PDF and Excel).
- Implement Monthly Cashbook Summary report with accurate revenue/expense categorizations.
- Build Cashbook Trial Balance and Borrower Aging reports.
- Build System Audit Trail viewer for Super Admin.
- Ensure all exported document figures match underlying database query results exactly.

### Dependencies
- Phase 3 ledger data and Phase 5 operations.

### Acceptance Criteria
- PDF statements render official academy branding and currency symbols cleanly.
- Exported Excel files contain calculated totals that reconcile with database views.
- Unauthorized users cannot trigger report downloads for unpermitted students.

### Stop Condition
- Statement accuracy verified against historical financial records.

---

## Phase 7: Migration, Testing, and Release

### Scope
- Execute staging migration of all 79 students and 303 historical transactions.
- Run complete reconciliation suite asserting exact balance and transaction match.
- Execute full automated test suite (unit, integration, RLS, E2E).
- Finalize production cutover runbook.
- Deploy rebuilt frontend to Vercel and apply production database migrations.

### Dependencies
- Phases 1 through 6 completed and approved.
- Written sign-off on all unresolved accounting decisions.

### Acceptance Criteria
- 100% of historical records present in rebuilt production database.
- Zero balance discrepancies on all 79 student accounts.
- Zero regressions reported during parallel run verification.

### Stop Condition
- Final production sign-off.
