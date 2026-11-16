# ZLS COMPACT UX 2.0 — ROUTE & VIEW MATRIX
**Project:** Zainussunna Ledger System (ZLS)  
**Branch:** `zls-rebuild`  
**Scope:** Complete Route, Drawer, and Modal Responsive Matrix  
**Status:** 100% Implemented & Verified  
**Date:** October 2026  

---

## 1. Matrix Overview

The Zainussunna Ledger System (ZLS) comprises **40 routes, operational drawers, and dialog surfaces**. Each view is engineered for maximum compactness, responsive adaptability, strict role-based access control (RBAC), and verified zero horizontal overflow across mobile (320px–430px), tablet (768px), and desktop viewports.

---

## 2. Global Shell & Navigation (Routes 1–5)

| # | Route / Element | Component | Role Access | Responsive Layout Strategy | Primary Actions | Verification |
| :-: | :--- | :--- | :--- | :--- | :--- | :-: |
| **1** | `/` (Root Redirect) | `App.tsx` | All | Redirects to `/dashboard` or `/login` based on auth state | Auto redirect | PASS |
| **2** | `/login` | `Login.tsx` | Public | Center card on desktop (360px max-width); 100% full-width on mobile | Email/password sign-in | PASS |
| **3** | Shell Layout | `AppLayout.tsx` | Authenticated | Desktop: 230px docked sidebar; Mobile: hidden sidebar + 52px bottom dock | Nav switch, theme toggle | PASS |
| **4** | Global Topbar | `Header.tsx` | Authenticated | Height: 48px. Breadcrumb, search trigger, compact profile menu | Search, user profile menu | PASS |
| **5** | Quick Launcher | `CommandPalette.tsx` | Authenticated | `Cmd+K` keyboard modal; instant student & drawer fuzzy search | Fuzzy jump, quick drawer | PASS |

---

## 3. Core Ledger & Student Management (Routes 6–10)

| # | Route / Element | Component | Role Access | Responsive Strategy | Filters & Search | Exports | Drawers / Actions | Verification |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :-: |
| **6** | `/dashboard` | `Dashboard.tsx` | All Roles | Desktop: 4 KPI tiles (68px) + action grid + 2-col activity; Mobile: stacked 1-col | Time range (Today, Week, Month) | None | Deposit, Withdrawal, Transfer | PASS |
| **7** | `/students` | `AllStudents.tsx` | All Roles | Desktop: 4 StatCards + 38px table; Mobile: compact cards with avatar | Name, Enrolment, Health, Status | CSV, Excel, PDF | `AddStudentModal`, Deposit, Withdrawal | PASS |
| **8** | `/students/:id` | `StudentProfile.tsx`| All Roles | Desktop: balance header + tight tabs + ledger table; Mobile: sticky balance | Chronological ledger, Type filter | CSV, Statement PDF | Deposit, Withdrawal, Loan | PASS |
| **9** | `/transactions` | `TransactionExplorer.tsx` | Admin, Super Admin | Desktop: `FilterBar` + 38px rows; Mobile: card list with type icons | Full text, Type, Direction, Status | CSV, Excel, PDF, Print | Reversal Modal, View Details | PASS |
| **10**| `/transactions/:id`| `TransactionDetails.tsx`| Admin, Super Admin | Compact metadata card, operation legs list, reversal history | Direct UUID lookup | Print Receipt | Reversal Action (Documented) | PASS |

---

## 4. Operational Workflows & Bulk Posting (Routes 11–16)

| # | Route / Element | Component | Role Access | Responsive Strategy | Filters & Search | Exports | Drawers / Actions | Verification |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :-: |
| **11**| `/operations` | `OperationsCenter.tsx` | Admin, Super Admin | Desktop: 3 summary tiles + 6 quick action tiles; Mobile: 2-col action grid | Recent operation filter | Operations Log | Deposit, Withdrawal, Bulk, Transfer | PASS |
| **12**| `/operations/bulk`| `BulkV3.tsx` | Admin, Super Admin | Multi-leg matrix table, keyboard tab navigation, atomic execution | Roster filter, batch selector | Draft CSV | Atomic Bulk Post, Import Roster | PASS |
| **13**| `/transfers` | `InternalTransfers.tsx`| Admin, Super Admin | Desktop: 2-column active loans + repayment summary; Mobile: 1-col tabs | Student name, loan status | CSV, Excel | `InternalTransferDrawer`, `RepaymentDrawer` | PASS |
| **14**| `/borrowers` | `BorrowerDashboard.tsx` | Admin, Super Admin | Desktop: exposure KPIs + contractor cards; Mobile: condensed cards | Contractor search, overdue status | Contractor Ledger | `RecoveryDrawer`, New Loan | PASS |
| **15**| `/borrowers/:id` | `BorrowerProfile.tsx` | Admin, Super Admin | Contractor balance header, loan disbursement list, recoveries table | Disbursement history filter | Statement PDF | `RecoveryDrawer`, Disburse Loan | PASS |
| **16**| `/batches` | `BatchManagement.tsx` | Admin, Super Admin | Cohort list, student roster count, inline edit modal | Batch search, academic year | Roster CSV | Create Batch, Assign Students | PASS |

---

## 5. Presets, Templates & Automation (Routes 17–20)

| # | Route / Element | Component | Role Access | Responsive Strategy | Filters & Search | Exports | Drawers / Actions | Verification |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :-: |
| **17**| `/presets` | `EntryPresets.tsx` | Admin, Super Admin | Grid of preset cards (Mess Fee, Tuition, Canteen, Books) | Category, frequency | Preset Config | New Preset, Apply Preset to Bulk | PASS |
| **18**| `/calendar` | `AcademicCalendar.tsx` | All Roles | Compact calendar grid, event tags, academic milestone indicators | Month, Term filter | Schedule PDF | Create Event, Mark Holiday | PASS |
| **19**| `/notifications`| `Notifications.tsx` | All Roles | Dense notification list, unread indicators, mark-all-as-read | Type (Security, Transaction, System) | None | Direct Link to Transaction | PASS |
| **20**| `/profile` | `UserProfile.tsx` | All Roles | User identity card, assigned role badge, password change form | None | Activity Log | Change Password, Update Profile | PASS |

---

## 6. Financial Reports & Institutional Audit (Routes 21–26)

| # | Route / Element | Component | Role Access | Responsive Strategy | Filters & Search | Exports | Drawers / Actions | Verification |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :-: |
| **21**| `/reports` | `ReportsOverview.tsx` | All Roles | Report catalog cards: Student Statements, Cashbook, Monthly, Aging | Role-filtered catalog | None | Launch Report Drawer | PASS |
| **22**| `/reports/students`| `StudentReports.tsx` | All Roles | Student statement generator, date-picker, transaction breakdown | Date from/to, student picker | PDF Statement, Excel | Print Statement | PASS |
| **23**| `/reports/cashbook`| `CashbookReport.tsx` | Admin, Super Admin | Central cashbook table, arithmetic reconciliation, net movement | Date range, payment mode | Official CSV, Excel | Export Audit Cashbook | PASS |
| **24**| `/reports/monthly` | `MonthlySummary.tsx` | Admin, Super Admin | Monthly gross credits, gross debits, net movement, period analysis | Fiscal year, month picker | Financial Summary | Drill-down to Transactions | PASS |
| **25**| `/reports/borrowers`| `BorrowerReport.tsx` | Admin, Super Admin | Contractor aging brackets (0–30, 31–60, 61–90, 90+ days), recoveries | Contractor status filter | Aging Excel, CSV | Recovery Drawer | PASS |
| **26**| `/audit` | `AuditCenter.tsx` | Super Admin | Authoritative security audit trail, immutable timeline, actor IDs | Event category, actor, date range | Audit Trail CSV | Inspect Security Payload | PASS |

---

## 7. System Administration & Security (Routes 27–30)

| # | Route / Element | Component | Role Access | Responsive Strategy | Filters & Search | Exports | Drawers / Actions | Verification |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :-: |
| **27**| `/settings/admin` | `Administration.tsx` | Super Admin | Institutional system settings, balance thresholds, health check | Configuration section tabs | System Report | Update Global Thresholds | PASS |
| **28**| `/settings/users` | `UserManagement.tsx` | Super Admin | User table, role assignments, active/deactivated toggles | Search user, role dropdown | User List CSV | Provision User, Change Role | PASS |
| **29**| `/settings/periods`| `AccountingPeriods.tsx`| Super Admin | Fiscal period table, lock status badges, lock/unlock actions | Fiscal year filter | Period Status | Lock Period, Unlock Period | PASS |
| **30**| `/settings/health` | `SystemHealth.tsx` | Super Admin | Database connection pool, migration versions, disk storage | System component status | Health Log | Run Diagnostic Ping | PASS |

---

## 8. Operations Drawers & Overlays (Routes 31–40)

| # | Drawer / Overlay | Component | Triggered From | Layout & Ergonomic Features | Verification |
| :-: | :--- | :--- | :--- | :--- | :-: |
| **31**| Deposit Drawer | `DepositDrawer.tsx` | FAB, Dashboard, Students | `AmountInput` UPI keypad, denomination pills (+₹100, +₹500, +₹1,000), single-click credit | PASS |
| **32**| Withdrawal Drawer | `WithdrawalDrawer.tsx` | FAB, Dashboard, Students | `AmountInput` UPI keypad, negative balance confirmation alert, single-click debit | PASS |
| **33**| Internal Transfer Drawer | `InternalTransferDrawer.tsx`| Operations, Students | Lender & borrower student pickers, `AmountInput`, atomic peer loan posting | PASS |
| **34**| Repayment Drawer | `InternalRepaymentDrawer.tsx`| Transfers, Students | Outstanding balance display, partial/full settlement pills, settled status flag | PASS |
| **35**| Recovery Drawer | `RecoveryDrawer.tsx` | Borrowers, Dashboard | External contractor picker, `AmountInput`, recovery receipt date, non-cashbook ledger row | PASS |
| **36**| Add Student Modal | `AddStudentModal.tsx` | Students Directory | Compact 2-column form, enrolment auto-format, initial opening balance option | PASS |
| **37**| Reversal Modal | `TransactionExplorer.tsx` | Transaction Explorer | Documented justification input (>= 10 characters required), compensating credit posting | PASS |
| **38**| Advanced Filter Sheet | `AdvancedFilterSheet.tsx` | `FilterBar` | Slide-in drawer on desktop, 85vh bottom-sheet on mobile; date range, amount range | PASS |
| **39**| Export Dropdown | `ExportMenu.tsx` | Toolbars, PageHeaders | Direct instant download for CSV (formula-injection protected), Excel, and PDF | PASS |
| **40**| Print / Export Drawer | `PrintExportDrawer.tsx` | Reports, Explorer | Institutional document preview, page orientation options, print stylesheet | PASS |

---

## 9. Verification Summary

- **Total Inventory Verified**: 40 / 40 routes and overlays.
- **Mobile Responsive Containment**: Verified on 320px (iPhone SE), 390px (iPhone 14/15), 768px (iPad), and 1440px desktop.
- **Horizontal Scroll Check**: 0 horizontal overflow detected on any route.
- **Touch Target Integrity**: Minimum 36px–44px touch targets on mobile viewports.
