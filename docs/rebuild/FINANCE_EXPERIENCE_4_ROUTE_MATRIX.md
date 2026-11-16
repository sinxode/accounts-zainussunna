# ZLS DARK FINANCE EXPERIENCE 4.0 — ROUTE & VIEW MATRIX
**Project:** Zainussunna Ledger System (ZLS)  
**Branch:** `zls-rebuild`  
**Phase:** Dark Finance Experience 4.0 — Premium Product Redesign, Interface Architecture & Interaction Overhaul  
**Status:** 100% Complete & Verified  
**Date:** October 2026  

---

## 1. Executive Summary

This matrix documents the 40 reachable application routes and 9 operational overlays under the **Dark Finance Experience 4.0** overhaul. 

### Key Architectural Standards Enforced:
1. **Collapsible Shell**: Sidebar with 240px expanded and 68px collapsed modes on desktop, auto-collapsing on tablet (768px–1024px), with persistent bottom dock (52px) on mobile (< 768px).
2. **Page Composition & Breadcrumbs**: Standardized `PageHeader` featuring breadcrumbs, entity title, contextual status pills, and right-aligned action button clusters.
3. **Card Discipline**: Removed redundant nested cards; replaced with tonal boundaries (`#1C2633`) and subtle dividers (`#1E2836`).
4. **Tabular Numerals**: Strict right-aligned monospace numbers with explicit direction signs (`+₹`, `-₹`), dual text and icon indicators.
5. **Responsive DataTables**: Sticky headers, row hover states (`#222F3E`), and dedicated compact mobile card rendering below 768px.

---

## 2. Complete 40-Route Inventory & Operational Audit

| # | Route / Surface | Component | Role Guard | Primary User Task | Visual Architecture & Layout Changes | Responsive Adaptations | Active Filters & Exports | Test Verification |
|---|---|---|---|---|---|---|---|---|
| **01** | `/` | `Dashboard` | All Authenticated | Executive financial overview & quick cash actions | 4-col KPI cards (`#151C26`), urgent negative balance alert strip (`#FF7185`), live activity feed | 4-col desktop, 2-col tablet, 1-col mobile vertical stack | Filter links to negative/low balance student directory | `test_ui_core.js`, `test_financial_engine.js` |
| **02** | `/login` | `LoginV2` | Public / Anonymous | Institutional authentication & session start | Split-screen portal, academy seal branding, dark input containers (`#1C2633`), focus rings | Split 50/50 desktop, centered single card mobile | Form validation, remember-me toggle | Headless Chrome screenshot verified |
| **03** | `/forgot-password` | `ForgotPasswordV2` | Public / Anonymous | Self-service password recovery email request | Centered card (`#151C26`), input (`#1C2633`), high-contrast `#8AB4F8` submit CTA | Fluid centered column (max-width 420px) | Email format validation | TypeScript verified (0 errors) |
| **04** | `/reset-password` | `ResetPasswordV2` | Public / Anonymous | Secure password reset token redemption | Centered card (`#151C26`), password strength meter, confirmation field | Fluid centered column (max-width 420px) | Match & strength validation | TypeScript verified (0 errors) |
| **05** | `/access-denied` | `AccessDeniedV2` | All Authenticated | Friendly 403 authorization guard | Dark canvas (`#0B0F14`), coral shield icon, return to dashboard CTA | Centered message box across all viewports | N/A | `test_ui_core.js` role access tests |
| **06** | `*` (404) | `NotFoundV2` | Public / All | Missing route handling | Dark canvas (`#0B0F14`), accent `#8AB4F8` numeral, dashboard return link | Centered message box across all viewports | N/A | `test_ui_core.js` 404 handler test |
| **07** | `/portfolio` | `Portfolio` | Public / Anonymous | Institutional profile & research showcase | Dark fintech landing page with clean sections | Responsive fluid grid, mobile hamburger drawer | N/A | Route preserved cleanly |
| **08** | `/students` | `AllStudents` | All Authenticated | Student directory, balances, health monitoring | Stat cards (`#151C26`), dark filter selects, responsive DataTable + card view | Desktop table with sticky header, mobile student cards | Search by name/enrolment, status filter, health filter, CSV export | `test_ui_core.js` 2.1, 2.2, 2.3 |
| **09** | `/students/:id` | `StudentProfile` | All Authenticated | Chronological ledger statement & running balances | 2-col desktop layout (account overview left, chronological ledger right) | 2-col desktop, 1-col stacked mobile with mobile balance card | Search transactions, date filter, statement print & PDF | `test_ui_core.js` 3.1, 3.2, `test_reports_and_exports.js` 1.1 |
| **10** | `/transactions` | `TransactionExplorer` | All Authenticated | Central transaction ledger & audit verification | Filter bar, raised table header (`#1C2633`), row hover highlight (`#222F3E`) | Desktop multi-column table, mobile stacked card view with inline chips | Type, direction, active/reversed filters, live search, 25/page pagination, Excel/CSV/PDF | `test_ui_core.js` 4.1, 4.2, 4.3 |
| **11** | `/transactions/:id` | `TransactionDetails` | All Authenticated | Transaction audit details, operator ID, reversal | Detail cards (`#151C26`), mono font for UUIDs, reversal modal trigger | Centered detail grid with breadcrumb link | Link to student profile, reversal action modal | `test_ui_core.js` 4.3 |
| **12** | `/operations` | `OperationsCenter` | Financial Admin | Daily operational cash movement hub & reminders | Card grid (`#151C26`), modern icon boxes, quick action buttons | 3-column desktop grid, 1-column mobile stack | Task search and status toggle | `test_operational_workflows.js` |
| **13** | `/internal-transfers` | `InternalTransfers` | Financial Admin | Peer student loan tracking & repayments | Summary cards, transfer table (`#151C26`), repayment drawer trigger | Responsive 2-column layout desktop, stacked mobile | Status filter (Active/Repaid), student search, CSV/Excel export | `test_financial_engine.js`, `test_operational_workflows.js` |
| **14** | `/borrowers` | `BorrowerDashboard` | Financial Admin | External contractor loan exposure & aging | Stat card strip (`#151C26`), contractor cards, aging badges | Multi-column grid desktop, 1-column mobile card list | Search by contractor name, risk filter, Excel/CSV export | `test_reports_and_exports.js` 5.1, 5.2 |
| **15** | `/borrowers/:id` | `BorrowerProfile` | Financial Admin | Individual contractor loan schedule & recoveries | Loan table (`#151C26`), recovery modal (`#1C2633`), status chips | Responsive 2-column layout desktop, stacked mobile | Recovery transaction history filter, PDF statement | `test_financial_engine.js`, `test_reports_and_exports.js` |
| **16** | `/presets` | `EntryPresets` | Financial Admin | Recurring transaction presets (Canteen, Fees) | Preset cards (`#151C26`), fast-apply CTA (`#8AB4F8`), preset creation | 3-column card grid desktop, 1-column mobile | Filter by category, keyword search | `test_operational_workflows.js` |
| **17** | `/batches` | `BatchManagement` | Financial Admin | Student cohort management for group charges | Batch cards (`#151C26`), cohort count pills, batch action triggers | Responsive card grid desktop, mobile swipeable list | Cohort filter, search by student name, CSV roster | `test_staging_uat_workflows.js` |
| **18** | `/reports` | `ReportsHub` | Staff / Faculty / Admin | Institutional reporting navigation center | Category grid (`#151C26`), descriptive badge counts | 3-column card grid desktop, 1-column mobile | Search report types | `test_reports_and_exports.js` |
| **19** | `/reports/student-statement` | `StudentReports` | Staff / Faculty / Admin / Parent | Verifiable student statement with running balance | Period selector (`#1C2633`), branded statement card (`#151C26`) | Full width statement view, print-optimized media queries | Student picker, date range picker, Print/PDF/Excel | `test_reports_and_exports.js` 1.1, 1.2, 1.3, 1.4 |
| **20** | `/reports/students` | `StudentBalanceSummaryReport` | Staff / Faculty / Admin | Student ledger summary with negative balance alerts | KPI cards, health status distribution chart, full roster table | Wide data table with horizontal scroll desktop, card list mobile | Health filter, search, zero balance toggle, Excel/CSV/PDF | `test_reports_and_exports.js` 2.1, 2.2, 2.3 |
| **21** | `/reports/monthly` | `MonthlyReports` | Staff / Faculty / Admin | Monthly transaction volume & net flow | Month selector dropdown (`#1C2633`), net flow chart, summary table | 2-column analytics desktop, stacked mobile | Month/Year selector, transaction type filter, Excel/CSV | `test_reports_and_exports.js` 3.1, 3.2 |
| **22** | `/reports/summary` | `FinancialSummary` | Staff / Faculty / Admin | Executive cash flow & institutional balance | Tonal summary panels (`#151C26`), financial health metrics | Responsive KPI matrix | Period selector, PDF/Excel export | `test_reports_and_exports.js` |
| **23** | `/reports/cashbook` | `CashbookReconciliationReport` | Staff / Faculty / Admin | Cashbook verification & arithmetic equality | Verification banner (Green `#45D6A0` / Warning `#F4C66A`), trace table | Full width audit layout | Period filter, exception filter, Excel/CSV | `test_reports_and_exports.js` 4.1, 4.2, 4.3 |
| **24** | `/reports/borrowers` | `BorrowerReports` | Staff / Faculty / Admin | Loan portfolio summary & recovery percentages | Progress bars, contractor risk breakdown cards | Multi-column grid desktop, stacked mobile | Contractor filter, date filter, Excel/PDF | `test_reports_and_exports.js` 5.1 |
| **25** | `/reports/borrower-aging` | `BorrowerAgingReport` | Staff / Faculty / Admin | Calendar aging schedule (Current, 30d, 60d, 90d+) | Aging bracket cards, contractor exposure rows, highlight overdue | Wide data table desktop, stacked cards mobile | Aging bucket filter, contractor search, Excel/CSV | `test_reports_and_exports.js` 5.2 |
| **26** | `/reports/audit` | `AuditActivityReport` | Super Admin / Admin | System audit logs, actor tracking, IP addresses | High-density audit table (`#151C26`), JSON viewer modal | Full width data table with code pill formatting | Action type filter, actor filter, date range, CSV export | `test_reports_and_exports.js` 6.1, 6.2, 6.3 |
| **27** | `/reports/transaction-types` | `TransactionTypesReport` | Staff / Faculty / Admin | Granular category analysis across transaction types | Category breakdown cards (`#151C26`), volume percentage bars | Responsive grid desktop, single column mobile | Date filter, type selector, Excel/CSV | `test_reports_and_exports.js` |
| **28** | `/reports/reconciliation-exceptions` | `ReconciliationExceptionsReport` | Staff / Faculty / Admin | Discrepancy detector for unlinked transactions | Alert banner (`#FF7185`), exception table with resolution suggestions | Full width table layout | Severity filter (Critical, Warning, Info), CSV export | `test_reports_and_exports.js` 4.2 |
| **29** | `/reports/analytics` | `Analytics` | Staff / Faculty / Admin | Financial velocity, student health trends | Chart containers (`#151C26`), custom SVG charts with theme tokens | 2-column analytics grid desktop, stacked mobile | Time horizon selector (7d, 30d, 90d, 1y) | `test_reports_and_exports.js` |
| **30** | `/settings` | `GlobalSettings` | Financial Admin | Currency, academic year, campus configuration | Setting cards (`#151C26`), switch toggles, save CTA | Centered 1-column form layout | Tabbed setting categories | TypeScript verified (0 errors) |
| **31** | `/administration` | `AdministrationDashboard` | Super Admin / Owner | System administrative master hub | Admin cards (`#151C26`), security status indicator, fast-access links | 3-column card grid desktop, 1-column mobile | System health quick filters | `test_ui_core.js` 1.1 |
| **32** | `/administration/users` | `UserManagement` | Super Admin / Owner | User role assignment & account deactivation | User data table (`#151C26`), role badge dropdown (`#1C2633`) | Wide table desktop, user cards mobile | Search by name/email, role filter, status filter, CSV export | `test_ui_core.js` 1.1, `test_security_foundation.js` |
| **33** | `/administration/accounting-periods` | `AccountingPeriods` | Super Admin / Owner | Period lock/unlock manager, prevents backdated edits | Period list (`#151C26`), lock status toggles (`#FF7185` / `#45D6A0`) | Responsive table desktop, period cards mobile | Year filter, status filter | `test_operational_workflows.js` |
| **34** | `/administration/audit` | `AuditCenter` | Super Admin / Owner | Real-time administrative audit event stream | Log cards (`#151C26`), actor avatars, timestamp pills | Full width log stream layout | Search actor, filter operation, CSV export | `test_reports_and_exports.js` 6.1 |
| **35** | `/administration/notifications` | `NotificationManagement` | Super Admin / Owner | Global broadcast and alert management center | Compose notification card (`#151C26`), template selector (`#1C2633`) | 2-column compose/history desktop, stacked mobile | Broadcast history filter | TypeScript verified (0 errors) |
| **36** | `/administration/system-health` | `SystemHealth` | Super Admin / Owner | Latency monitor, database connection pool, API health | Status indicators, ping cards (`#151C26`), uptime pills | Responsive metric card grid | Refresh interval selector | TypeScript verified (0 errors) |
| **37** | `/administration/data-health` | `DataHealth` | Super Admin / Owner | Data consistency checker & orphan record detector | Health checklist (`#151C26`), fix action buttons, verification indicators | Centered audit card list | Run integrity scan trigger, Diagnostic report | TypeScript verified (0 errors) |
| **38** | `/setup/import` | `ImportCenter` | Super Admin / Owner | Historical CSV migration, field mapping, dry-run | Upload dropzone (`#1C2633`), mapping preview table (`#151C26`) | Centered stepped wizard layout | Column mapping selectors, Migration report export | `test_staging_uat_workflows.js` |
| **39** | `/setup/onboarding` | `Onboarding` | Super Admin / Owner | System setup and school profile initialization | Step indicators, guided configuration cards (`#151C26`) | Centered stepped card | Wizard step navigation | TypeScript verified (0 errors) |
| **40** | `/profile` | `UserProfile` | All Authenticated | Personal user profile & credentials update | Profile card (`#151C26`), password change modal (`#1C2633`) | Centered 1-column card layout | Active sessions list | TypeScript verified (0 errors) |

---

## 3. Operational Overlays & Dialogs

| Overlay Name | Component | Visual Architecture | Key Safeguards & Ergonomics |
|---|---|---|---|
| **Deposit Drawer** | `DepositDrawer` | Desktop: 440px right slide drawer; Mobile: 20px rounded slide-up bottom sheet | Fast UPI touch keypad, denomination pills (+₹100, +₹500, +₹1000), balance preview, double-click idempotency key |
| **Withdrawal Drawer** | `WithdrawalDrawer` | Desktop: 440px right slide drawer; Mobile: 20px rounded slide-up bottom sheet | Account balance check, purpose selector, denomination pills, idempotency key generation |
| **Internal Transfer Drawer** | `InternalTransferDrawer` | Desktop: 480px right slide drawer; Mobile: 20px rounded slide-up bottom sheet | Lender & borrower student picker with balance preview, validation to prevent self-transfers |
| **Internal Repayment Drawer** | `InternalRepaymentDrawer` | Desktop: 440px right slide drawer; Mobile: 20px rounded slide-up bottom sheet | Loan balance validation, prevents overpayment exceeding remaining balance |
| **Borrower Recovery Drawer** | `RecoveryDrawer` | Desktop: 440px right slide drawer; Mobile: 20px rounded slide-up bottom sheet | Contractor loan selection, recovery date picker, overpayment guard |
| **Command Palette** | `CommandPalette` | Centered modal dialog, backdrop blur. Surface `#151C26`, Search `#1C2633`, Active `#222F3E` | Global shortcut (`Cmd+K` / `Ctrl+K`), instant search across students, transactions, and routes |
| **Advanced Filter Sheet** | `AdvancedFilterSheet` | Mobile bottom sheet (rounded top 20px) / desktop slide drawer. Surface `#151C26` | Multi-criteria filters: date range, amount bounds, health status, transaction direction |
| **Export Menu Popover** | `ExportMenu` | Floating popover menu. Surface `#151C26`, Border `#2B3747`, Item hover `#222F3E` | Excel (green icon `#45D6A0`), CSV (blue icon `#8AB4F8`), PDF (coral icon `#FF7185`), CSV formula injection sanitization |
| **Confirmation Modal** | `ConfirmationModal` | Centered modal (18px radius). Surface `#151C26`, Header `#10161F`, Backdrop dark blur | Destructive action confirmation (reversals, deactivations, locks) with mandatory reason text |
