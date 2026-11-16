# ZLS DARK FINANCE EXPERIENCE 4.0 — MASTER ARCHITECTURE & IMPLEMENTATION PLAN
**Project:** Zainussunna Ledger System (ZLS)  
**Branch:** `zls-rebuild`  
**Phase:** Dark Finance Experience 4.0 — Premium Product Redesign, Interface Architecture & Interaction Overhaul  
**Status:** Approved & In-Progress  
**Date:** October 2026  

---

## 1. Executive Vision & Problem Statement

The Zainussunna Ledger System (ZLS) Rebuild previously established a dark theme and compact tokens. However, dark fintech design requires more than dark backgrounds and rounded corners. It requires:
1. **Architectural Cohesion**: An application shell that seamlessly handles desktop, tablet, and mobile without cramped elements or awkward wrapping.
2. **Intentional Information Hierarchy**: Pages composed with clear purpose—distinguishing critical financial balances from supporting audit metadata.
3. **Card Discipline**: Eradication of nested cards-within-cards, excessive borders, and inconsistent paddings.
4. **Financial Legibility**: Strict tabular numerals (`tnum`), unequivocal direction indicators (never relying on color alone), and scan-friendly ledgers.
5. **Predictable Interaction System**: Standardized button hierarchies (primary, secondary, ghost, destructive), consistent forms with inline validation, and robust modal/drawer ergonomics.

This plan details the prioritized architectural execution of **Dark Finance Experience 4.0**.

---

## 2. Comprehensive Inventory of Reached Surfaces

### 2.1 Core Routes (40 Rebuild Routes)
1. `/` (`Dashboard`) — Executive financial overview, KPI cards, quick money actions, live ledger feed.
2. `/login` (`LoginV2`) — Split-screen branded portal with institution seal, credentials input, password toggle.
3. `/forgot-password` (`ForgotPasswordV2`) — Self-service password recovery email request.
4. `/reset-password` (`ResetPasswordV2`) — Token-based password reset form.
5. `/access-denied` (`AccessDeniedV2`) — 403 authorization guard screen.
6. `*` (`NotFoundV2`) — 404 missing route fallback.
7. `/portfolio` (`Portfolio`) — Public institutional profile & research showcase.
8. `/students` (`AllStudents`) — Student directory, balances, account health badges, quick actions.
9. `/students/:id` (`StudentProfile`) — Chronological ledger, running balances, contact info, statements.
10. `/transactions` (`TransactionExplorer`) — Central transaction ledger, reversal triggers, audit details.
11. `/transactions/:id` (`TransactionDetails`) — Deep transaction audit view with operator ID, idempotency key.
12. `/operations` (`OperationsCenter`) — Operational quick action hub for cash movement and tasks.
13. `/internal-transfers` (`InternalTransfers`) — Peer student loans and repayment tracking.
14. `/borrowers` (`BorrowerDashboard`) — External contractor exposure, outstanding debt, aging brackets.
15. `/borrowers/:id` (`BorrowerProfile`) — Contractor loan schedule, recovery logs, record recovery action.
16. `/presets` (`EntryPresets`) — Saved recurring transaction templates.
17. `/batches` (`BatchManagement`) — Student cohort management for group charges and distributions.
18. `/reports` (`ReportsHub`) — Institutional reporting navigation center.
19. `/reports/student-statement` (`StudentReports`) — Parent and student verifiable statement generator.
20. `/reports/students` (`StudentBalanceSummaryReport`) — Comprehensive student ledger summary.
21. `/reports/monthly` (`MonthlyReports`) — Monthly transaction volume, net flow, reversal breakdown.
22. `/reports/summary` (`FinancialSummary`) — High-level executive cash flow and institutional balance summary.
23. `/reports/cashbook` (`CashbookReconciliationReport`) — Central cashbook verification and arithmetic checks.
24. `/reports/borrowers` (`BorrowerReports`) — Institutional loan portfolio summary and recovery percentage.
25. `/reports/borrower-aging` (`BorrowerAgingReport`) — Objective elapsed calendar aging schedule.
26. `/reports/audit` (`AuditActivityReport`) — Complete system audit logs, actor tracking, IP addresses.
27. `/reports/transaction-types` (`TransactionTypesReport`) — Granular category analysis across all transaction types.
28. `/reports/reconciliation-exceptions` (`ReconciliationExceptionsReport`) — Discrepancy detector for unlinked transactions.
29. `/reports/analytics` (`Analytics`) — Long-term financial velocity, student health trends.
30. `/settings` (`GlobalSettings`) — Institutional currency, academic year, campus configuration.
31. `/administration` (`AdministrationDashboard`) — Administrative master hub.
32. `/administration/users` (`UserManagement`) — User role assignment, user deactivation.
33. `/administration/accounting-periods` (`AccountingPeriods`) — Accounting period lock/unlock manager.
34. `/administration/audit` (`AuditCenter`) — Real-time administrative audit event stream.
35. `/administration/notifications` (`NotificationManagement`) — Global broadcast and alert management center.
36. `/administration/system-health` (`SystemHealth`) — Latency monitor, database connection pool, API health.
37. `/administration/data-health` (`DataHealth`) — Data consistency checker, orphan record detector.
38. `/setup/import` (`ImportCenter`) — Historical CSV migration, field mapping, dry-run reconciliation.
39. `/setup/onboarding` (`Onboarding`) — Initial system setup and school profile initialization wizard.
40. `/profile` (`UserProfile`) — Personal user profile, credentials update, session history.

### 2.2 Operational Drawers & Overlays
- `DepositDrawer` (Cash deposit with UPI keypad, denomination pills, idempotency key).
- `WithdrawalDrawer` (Cash disbursement with balance check, denomination pills).
- `InternalTransferDrawer` (Peer loan between students with self-transfer prevention).
- `InternalRepaymentDrawer` (Peer loan repayment with overpayment check).
- `RecoveryDrawer` (Contractor loan recovery with balance check).
- `CommandPalette` (`Cmd+K` global spotlight search).
- `AdvancedFilterSheet` (Mobile bottom sheet / desktop side filter drawer).
- `ExportMenu` (Formula-injection safe Excel, CSV, PDF popover).
- `ConfirmationModal` (Destructive actions with mandatory reason requirement).

---

## 3. Aesthetic & Functional Problem Audit

| Area | Current State Issue | Dark Finance Experience 4.0 Solution |
|---|---|---|
| **Sidebar Navigation** | Sidebar width is fixed at 240px; no collapsible state; navigation items lack high-contrast subtle active indicators; on tablets it can feel intrusive. | Implement collapsible compact sidebar (68px collapsed / 240px expanded) with tooltip support, accessible keyboard navigation, and refined active pill styling. |
| **Top Bar Header** | Lacks responsive breadcrumb structure; search bar and action buttons can collide on tablet widths; profile menu lacks role badge. | Restructure `Header`: page title/breadcrumb context, compact quick search button (`Cmd+K`), notification badge, and streamlined user profile pill with role chip. |
| **Mobile Shell** | Fixed bottom action bar can occlude bottom table rows, drawer action buttons, or submit buttons when scrolling. | Ensure standard content bottom padding (`pb-24` on mobile), sticky drawer footers with elevated z-index, and comfortable 48px touch targets. |
| **Card Discipline** | Some pages wrap section elements inside redundant cards within cards, creating visual clutter and multiple borders. | Strip nested card containers. Use subtle horizontal dividers (`--border-subtle: #1E2836`) and tonal shifts (`--bg-raised: #1C2633`) for secondary data. |
| **Financial Formatting** | Amounts in certain views lack tabular numeral styling; direction sometimes relies purely on text color without directional icons/signs. | Enforce strict tabular figures (`tnum`) across all numbers. Always prepend explicit sign (`+₹` for credits, `-₹` for debits) and directional icons (`ArrowDownLeft`, `ArrowUpRight`). |
| **Data Tables** | Wide tables on mobile can trigger awkward horizontal scrolling without indicating that more data exists; desktop headers need subtle sticky elevation. | Provide sticky table header on scroll, smooth row hover highlight, horizontal scroll edge hints, and purpose-built compact mobile card views on small screens. |
| **Forms & Drawers** | Forms in drawers sometimes have inconsistent label spacing, and submit buttons can be pushed off-screen if content is long. | Standardize drawer layout: fixed header with close button, scrollable body with flex padding, and fixed sticky footer with primary action always visible. |

---

## 4. Prioritized Implementation Backlog

### Phase 1: Shell & Navigation Architecture (EXP4-01 to EXP4-03)
- **EXP4-01: Collapsible Sidebar System**: Implement expanded (240px) and collapsed (68px) modes for `Sidebar` with icon tooltips, keyboard shortcuts (`[` or toggle button), and clean active states.
- **EXP4-02: Streamlined Header & Breadcrumbs**: Upgrade `Header` with dynamic breadcrumb navigation, compact `Cmd+K` trigger, unread notification counter, and role-badged profile flyout.
- **EXP4-03: Mobile Shell & Safe Padding**: Ensure `BottomActionBar` provides seamless navigation without covering form actions or table pagination; add mobile viewport safe-area handling.

### Phase 2: Design Tokens & Component Geometry (EXP4-04 to EXP4-06)
- **EXP4-04: Typography & Numeric Tokens**: Standardize `--font-mono` with `tabular-nums` for all financial figures; refine text contrast levels (`#F3F6FA`, `#A4B0C0`, `#7E8A9A`).
- **EXP4-05: Button & Control Hierarchy**: Polish `Button` variants (Primary, Secondary, Tertiary/Ghost, Destructive) with consistent 10px radius, hover states, and focus rings.
- **EXP4-06: Form Ergonomics & AmountInput**: Refine `AmountInput` with responsive denomination pills, clear numeric keypad, and inline validation messages.

### Phase 3: Page Composition & Financial Ledgers (EXP4-07 to EXP4-10)
- **EXP4-07: Standardized PageHeader**: Replace disparate page titles with a unified `PageHeader` component supporting breadcrumbs, status badges, and action button groups.
- **EXP4-08: Re-engineered DataTable**: Deliver sticky headers, row hover states (`#222F3E`), right-aligned tabular amounts, and mobile card view fallback.
- **EXP4-09: Dashboard & Operational Overview**: Optimize KPI stat cards with trend arrows, quick deposit/withdrawal action dock, and urgent account alerts.
- **EXP4-10: Student Ledger & Chronological Statement**: Refine `StudentProfile` 2-column layout with account overview card, chronological ledger, running balance column, and statement export triggers.

### Phase 4: Operational Drawers & Workflows (EXP4-11 to EXP4-13)
- **EXP4-11: Standardized Drawer Ergonomics**: Ensure `DepositDrawer`, `WithdrawalDrawer`, `InternalTransferDrawer`, and `RecoveryDrawer` have fixed headers, scrollable bodies, sticky footers, and double-click idempotency protection.
- **EXP4-12: Transaction Explorer & Filter Bar**: Upgrade `TransactionExplorer` with compact inline filter bar, active filter chips, advanced filter sheet, and 25-row pagination.
- **EXP4-13: Reports & Reconciliations**: Polish Cashbook Reconciliation, Borrower Aging, and Audit Center layouts.

### Phase 5: Verification & Evidence (EXP4-14 to EXP4-16)
- **EXP4-14: Automated Test Verification**: Execute all 7 test suites, confirming 157 / 157 passing assertions.
- **EXP4-15: Visual Screenshot Capture**: Capture Desktop (1440px) and Mobile (390px) screenshots of key views using headless Google Chrome.
- **EXP4-16: Final Documentation & Release Audit**: Produce Route Matrix, Component Guide, QA Report, and comprehensive final report.

---

## 5. Non-Negotiable Financial & Security Constraints

1. **Zero Database Modifications**: No migrations, no schema edits, no production database writes.
2. **Preservation of Financial Rules**: Atomic RPCs, double-entry ledger balance formulas, accounting period locking, idempotency key generation, and 10-character reversal reason requirements remain 100% untouched.
3. **Role-Based Access Enforcement**: Super Admin exclusive permissions, financial admin money movement, faculty read-only limits, and parent child-isolation boundaries remain active.
