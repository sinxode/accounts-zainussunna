# ZLS DARK INTERFACE 3.0 — MASTER REDESIGN & EXECUTION PLAN
**Project:** Zainussunna Ledger System (ZLS)  
**Branch:** `zls-rebuild`  
**Phase:** Autonomous Full-Application Visual Redesign, Planning, and Execution  
**Status:** Approved & In-Progress  
**Date:** October 2026  

---

## 1. Executive Summary & Mission

The **Zainussunna Ledger System (ZLS)** manages student ledger accounts, internal transfers, contractor loans, batch postings, and audit trails.

While the previous iteration reduced excessive spacing, the interface still relied on a light-background aesthetic with scattered white panels, inconsistent corner radii, and washed-out contrast.

### The Objective: Dark Interface 3.0
Transform the entire application into a **premium, cohesive, dark-first financial application**:
- **Palette**: Deep charcoal canvas (`#0B0F14`), layered navigation (`#10161F`), primary card surfaces (`#151C26`), raised interactive surfaces (`#1C2633`), subtle slate borders (`#2B3747`), high-contrast crisp typography (`#F3F6FA`), and restrained accents (`#8AB4F8`, `#45D6A0`, `#FF7185`).
- **Cohesive Elevation**: Clean 6-tier surface hierarchy without nesting cards inside cards inside panels.
- **Modern Corner Radii**: Curated rounded geometry (7–10px badges, 10–12px controls, 12–16px standard cards, 16–20px summary panels, 18–24px drawers and mobile bottom sheets).
- **Tabular Numerics**: Strict right-aligned monospace numbers with ₹ anchors and high-legibility green/coral status treatments.
- **Zero Loss of Functionality**: 100% preservation of all 40 routes, role permissions, RLS policies, financial RPCs, idempotency guards, and test suites.

---

## 2. Section A: Current UI Inventory

### 2.1 Complete Route & Surface Inventory
The application contains **40 distinct routes, views, drawers, and overlay surfaces**:

1. `/` (Root Redirect)
2. `/login` (Authentication)
3. Shell Layout (`AppLayout`)
4. Global Topbar (`Header`)
5. Command Palette (`CommandPalette`)
6. `/dashboard` (Executive KPI strip & activity)
7. `/students` (Student directory & balance overview)
8. `/students/:id` (Student profile & ledger statement)
9. `/transactions` (Transaction explorer & reversal triggers)
10. `/transactions/:id` (Transaction details & audit links)
11. `/operations` (Operational quick action hub)
12. `/operations/bulk` (Bulk ledger entry matrix composer)
13. `/transfers` (Internal peer loans & repayment tracking)
14. `/borrowers` (External contractor loans & aging)
15. `/borrowers/:id` (Contractor profile & recoveries)
16. `/batches` (Student cohort management)
17. `/presets` (Recurring transaction presets)
18. `/calendar` (Academic calendar & milestones)
19. `/notifications` (System & financial alert inbox)
20. `/profile` (User settings & credentials)
21. `/reports` (Financial report catalog)
22. `/reports/students` (Official student account statements)
23. `/reports/cashbook` (Central cashbook audit reconciliation)
24. `/reports/monthly` (Monthly inflow/outflow summary)
25. `/reports/borrowers` (Contractor aging bracket report)
26. `/audit` (Authoritative security audit center)
27. `/settings/admin` (System configuration & balance thresholds)
28. `/settings/users` (Super Admin user role provisioning)
29. `/settings/periods` (Accounting period lock management)
30. `/settings/health` (System diagnostic health check)
31. `DepositDrawer` (UPI keypad & fast credit posting)
32. `WithdrawalDrawer` (Debit posting & overdraft warning)
33. `InternalTransferDrawer` (Peer loan creation)
34. `InternalRepaymentDrawer` (Peer loan settlement)
35. `RecoveryDrawer` (Contractor loan recovery)
36. `AddStudentModal` (New student registration)
37. `ReversalModal` (Audit-justified transaction reversal)
38. `AdvancedFilterSheet` (Date range & amount filters)
39. `ExportMenu` (Direct CSV, Excel, PDF download)
40. `PrintExportDrawer` (Print styling preview & export)

### 2.2 Shared Components
- **Layout**: `AppLayout`, `Header`, `Sidebar`, `BottomActionBar`, `PageContainer`, `PageHeader`.
- **Financial Controls**: `AmountInput`, `StatCard`, `DataTable`, `Badge`, `Button`.
- **Filters & Tools**: `FilterBar`, `ActiveFilterChips`, `AdvancedFilterSheet`, `ExportMenu`, `SearchInput`.
- **Drawers & Modals**: `DrawerLayout`, `Drawer`, `Modal`, `ConfirmationModal`, `BulkV3`.
- **Feedback & State**: `Skeleton`, `EmptyState`, `NotificationCenter`.

### 2.3 Existing Breakpoints & Navigation
- Mobile: `< 640px` (Full-width cards, 52px bottom dock, mobile bottom sheets).
- Tablet: `641px – 1023px` (Adaptive 2-column grids, collapsible sidebar).
- Desktop: `>= 1024px` (230px docked sidebar, multi-column financial dashboards).

### 2.4 Baseline Status
- **Test Suite**: 7 suites, 157 / 157 tests passing (100%).
- **Production Build**: Vite builds in ~5.4s with 0 errors.

---

## 3. Section B: Visual Problem Audit

The audit of the current codebase identified the following visual deficiencies:

1. **Light-Themed Backgrounds**: `globals.scss`, `_colors.scss`, and individual module files still use `#f5f7fa`, `#ffffff`, `#f8fafc`, and `bg-white`, resulting in a harsh, dated appearance.
2. **Inconsistent Component Radii**: Badges use `4px` or `9999px`, buttons use `6px–8px`, cards use `8px–10px`, while some legacy containers use `16px–24px`. There is no cohesive radius scale.
3. **Card-in-Card Nesting**: Several views (`TransactionExplorer`, `AllStudents`, `Dashboard`) wrap filter controls in an outer card and then place data tables in an adjacent card with mismatched borders.
4. **Weak Secondary Contrast**: Text muted colors (`#94a3b8`, `#64748b`) against dark backgrounds become unreadable or have poor contrast ratios below WCAG AA.
5. **Hardcoded Inline Light Classes**: Tailwind classes like `bg-white`, `border-slate-200`, and `text-slate-900` are scattered across 40+ component files.
6. **Harsh Borders & Outlines**: High-contrast white/light borders (`#e2e8f0`) create visual noise on dark canvases instead of subtle separator lines (`#2B3747`).
7. **Drawers and Modals**: Drawers currently use white backgrounds with dark text, creating an abrupt context switch when opened from dark or muted views.

---

## 4. Section C: Target Design Specification

### 4.1 Dark Color Architecture
| Token Name | Hex Value | Primary Usage |
| :--- | :--- | :--- |
| `--bg-app` | `#0B0F14` | Deep charcoal main canvas background |
| `--bg-nav` | `#10161F` | Sidebar, top header bar, and mobile bottom dock |
| `--bg-surface` | `#151C26` | Primary content panels, cards, and drawer bodies |
| `--bg-raised` | `#1C2633` | Inputs, select boxes, dropdown menus, table headers |
| `--bg-hover` | `#222F3E` | Hover states, active table rows, pressed pills |
| `--border-subtle` | `#1E2836` | Table row dividers, inner card dividers |
| `--border-default`| `#2B3747` | Card borders, input outlines, drawer borders |
| `--border-strong` | `#3B4A5E` | Focused inputs, active tabs, prominent badges |
| `--text-primary` | `#F3F6FA` | Headings, primary amounts, active labels |
| `--text-secondary`| `#A4B0C0` | Secondary descriptions, column headers, metadata |
| `--text-muted` | `#7E8A9A` | Helper notes, timestamps, inactive icons |
| `--accent-primary`| `#8AB4F8` | Primary CTA buttons, focused outlines, active tabs |
| `--accent-strong` | `#A9C7FF` | Highlighted text, interactive hover states |
| `--status-success`| `#45D6A0` | Deposits, positive balances, healthy indicators |
| `--status-danger` | `#FF7185` | Withdrawals, negative balances, error badges |
| `--status-warning`| `#F4C66A` | Low balance warnings, pending approvals |

### 4.2 Surface Hierarchy
1. **Level 0 (App Canvas)**: `#0B0F14` — Base background.
2. **Level 1 (Structural Shell)**: `#10161F` with border `#2B3747` — Header, Sidebar, Bottom Dock.
3. **Level 2 (Content Panels)**: `#151C26` with 1px border `#2B3747` — Dashboard cards, directory tables, drawer canvas.
4. **Level 3 (Interactive Controls)**: `#1C2633` — Inputs, search fields, dropdown buttons, table headers.
5. **Level 4 (Hover / Active)**: `#222F3E` — Row highlight, active navigation item.
6. **Level 5 (Modals & Flyouts)**: `#151C26` with shadow `0 20px 40px rgba(0,0,0,0.5)` and border `#3B4A5E`.

### 4.3 Corner Radii Scale
- **Small Controls & Badges**: `8px` (`--radius-sm`)
- **Inputs & Buttons**: `10px` (`--radius-md`)
- **Standard Cards & Tables**: `14px` (`--radius-lg`)
- **Summary Panels & Hero Blocks**: `18px` (`--radius-xl`)
- **Drawers & Bottom Sheets**: `20px` at exposed corners (`--radius-2xl`)
- **Full Pill**: `9999px` (`--radius-full`)

### 4.4 Typography Scale
- Page Titles: `20px – 22px`, font-weight `600`, color `#F3F6FA`.
- Section Headings: `14px – 15px`, font-weight `600`, color `#F3F6FA`.
- Table Cells / Body: `12px – 13px`, font-weight `400` / `500`, color `#A4B0C0` / `#F3F6FA`.
- Micro Metadata / Badges: `10px – 11px`, font-weight `600`, color `#7E8A9A`.
- Financial Amounts: `18px – 24px`, font-weight `700`, `font-variant-numeric: tabular-nums`.

---

## 5. Section D: Prioritized Implementation Backlog

| Task ID | Component / Area | Scope of Changes | Status |
| :--- | :--- | :--- | :---: |
| **DARK-01** | Token System Replacement | Rewrite `_colors.scss`, `_radius.scss`, `_shadows.scss`, `_variables.scss`, and `globals.scss` with dark-first tokens. | **READY** |
| **DARK-02** | Global Shell & Navigation | Redesign `Header.tsx`, `Sidebar.tsx`, `AppLayout.tsx`, `BottomActionBar.tsx`, `UserMenu.tsx` to `#10161F` with `#8AB4F8` active states. | **READY** |
| **DARK-03** | Core Form & Action Controls | Redesign `Button`, `Input`, `AmountInput`, `Badge`, `Checkbox`, `SearchInput`, `Select` with `#1C2633` surfaces and 10px radii. | **READY** |
| **DARK-04** | Table, Filter & Export Primitives | Darken `DataTable`, `FilterBar`, `AdvancedFilterSheet`, `ExportMenu`, `StatCard` with tabular numbers and subtle borders. | **READY** |
| **DARK-05** | Operations Drawers & Overlays | Unify `DepositDrawer`, `WithdrawalDrawer`, `InternalTransferDrawer`, `RepaymentDrawer`, `RecoveryDrawer`, `DrawerLayout`. | **READY** |
| **DARK-06** | Dashboard Redesign | Executive dark KPI tiles, dark action tiles, high-contrast recent activity table in `Dashboard.tsx`. | **READY** |
| **DARK-07** | Students Directory & Profile | Dark theme for `AllStudents.tsx` and `StudentProfile.tsx` (ledger timeline, balance header). | **READY** |
| **DARK-08** | Transaction Explorer & Details | Dark styling for `TransactionExplorer.tsx` and `TransactionDetails.tsx` with high-contrast active/reversed badges. | **READY** |
| **DARK-09** | Operations Center & Bulk Composer | Dark matrix editor for `BulkV3.tsx` and quick action grid in `OperationsCenter.tsx`. | **READY** |
| **DARK-10** | Internal & External Lending | Dark theme for `InternalTransfers.tsx`, `BorrowerDashboard.tsx`, `BorrowerProfile.tsx`. | **READY** |
| **DARK-11** | Batches & Presets | Dark theme for `BatchManagement.tsx` and `EntryPresets.tsx`. | **READY** |
| **DARK-12** | Reports & Reconciliation | Dark theme for `StudentReports.tsx`, `CashbookReport.tsx`, `MonthlySummary.tsx`, `BorrowerReport.tsx`. | **READY** |
| **DARK-13** | Administration & Audit Center | Dark theme for `AccountingPeriods.tsx`, `AuditCenter.tsx`, `UserManagement.tsx`, `Administration.tsx`. | **READY** |
| **DARK-14** | Dialogs, Alerts & Modals | Standardize `Modal`, `ConfirmationModal`, `CommandPalette`, `NotificationCenter`. | **READY** |
| **DARK-15** | Screenshot Capture & Visual Evidence | Capture real desktop & mobile screenshots of Dashboard, Explorer, Profile, and Drawer using headless Chrome. | **READY** |
| **DARK-16** | Verification & Final Governance | Run all 7 test suites (157 tests), build validation, and publish `DARK_INTERFACE_*` documentation. | **READY** |

---

## 6. Execution Rules & Boundaries

- All changes must be made directly on branch `zls-rebuild`.
- Zero database migrations or production writes.
- Absolute preservation of role security guards, idempotency keys, and audit logging.
- Continual verification through local build and test execution.
