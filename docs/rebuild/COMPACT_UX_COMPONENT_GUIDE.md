# ZLS COMPACT UX 2.0 — COMPONENT LIBRARY & DESIGN SYSTEM GUIDE
**Project:** Zainussunna Ledger System (ZLS)  
**Branch:** `zls-rebuild`  
**Scope:** Reusable Compact UI Component Reference & Usage Specifications  
**Status:** 100% Implemented & Documented  
**Date:** October 2026  

---

## 1. Design System Philosophy

The **ZLS Compact UX 2.0 Component Library** provides a complete set of high-density, accessible, and responsive building blocks designed specifically for institutional ledger accounting.

### Core Principles
1. **Financial Density**: Components maximize data visibility per square inch. Standard table rows are 38px, stat tiles are 68px, and page headers are 36px–40px.
2. **Tabular Numerics**: Every numerical and monetary figure uses `font-variant-numeric: tabular-nums` to ensure exact decimal alignment across lists and tables.
3. **UPI Speed**: Form inputs for monetary amounts feature quick-denomination pills (`+₹100`, `+₹500`, `+₹1,000`, `+₹5,000`), native decimal keypads on touch devices, and live rupee formatting.
4. **Fluid Responsiveness**: Components dynamically adapt between desktop grids, tablet side-by-side layouts, and mobile bottom-sheets with zero horizontal layout breakage.

---

## 2. Layout & Structure Components

### 2.1 `PageContainer`
Standard outermost wrapper for all application views. Provides consistent gutters and responsive max-widths.

- **Import:** `import { PageContainer } from '../../components/ui/PageContainer';`
- **Props:**
  - `children: React.ReactNode`
  - `className?: string`
  - `maxWidth?: 'sm' | 'md' | 'lg' | 'full'` (Default: `'full'`)
- **Responsive Behavior:**
  - Desktop: `padding: 16px 24px`
  - Tablet: `padding: 12px 16px`
  - Mobile: `padding: 8px 12px`

### 2.2 `PageHeader`
Unified page title ribbon combining navigation breadcrumbs, page heading, subtitle, primary action button, and secondary utility slots.

- **Import:** `import { PageHeader } from '../../components/ui/PageHeader';`
- **Props:**
  - `title: string`
  - `subtitle?: string`
  - `actions?: React.ReactNode`
  - `breadcrumb?: { label: string; href?: string }[]`
- **Responsive Behavior:**
  - Desktop: Flex row with space-between alignment (height: ~40px).
  - Mobile: Stacks actions below title or wraps into compact toolbar (height: ~58px).

---

## 3. Financial Primitives

### 3.1 `AmountInput`
The cornerstone of ZLS Compact UX 2.0. Inspired by modern UPI banking apps (PhonePe / Google Pay).

- **Import:** `import { AmountInput } from '../../components/ui/AmountInput';`
- **Props:**
  - `value: string | number`
  - `onChange: (value: string) => void`
  - `quickAddValues?: number[]` (Default: `[100, 500, 1000, 5000]`)
  - `placeholder?: string` (Default: `'0.00'`)
  - `disabled?: boolean`
  - `autoFocus?: boolean`
  - `error?: string`
  - `label?: string`
- **Key Features:**
  - Permanent `₹` currency symbol anchored inside the input frame.
  - Large, bold 24px tabular font (`font-weight: 700`).
  - `inputMode="decimal"` automatically displays the numeric keypad on iOS and Android.
  - Interactive quick-denomination chips add cumulative amounts with a single tap.
- **Example Usage:**
```tsx
<AmountInput
  label="Transaction Amount"
  value={amount}
  onChange={setAmount}
  quickAddValues={[100, 200, 500, 1000]}
  autoFocus
/>
```

### 3.2 `StatCard`
Compact metric display card for executive dashboards and directory headers.

- **Import:** `import { StatCard } from '../../components/ui/StatCard';`
- **Props:**
  - `label: string`
  - `value: string | number`
  - `icon: React.ReactNode`
  - `variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral'`
  - `trend?: { value: number; isPositive: boolean }`
  - `onClick?: () => void`
- **Visual Specs:**
  - Height: Condensed to `68px` (down from 118px legacy).
  - Internal Padding: `10px 14px`.
  - Icon size: `20px` in soft tonal circle background.
  - Value typography: `1.125rem` (`18px`), tabular bold.

### 3.3 `DataTable`
High-density financial data grid supporting sortable columns, responsive hiding, row selection, and monospaced cells.

- **Import:** `import { DataTable } from '../../components/ui/DataTable';`
- **Props:**
  - `columns: Array<{ header: string; accessor: (row: T) => React.ReactNode; width?: string; align?: 'left'|'center'|'right'; responsiveHidden?: 'mobile'|'tablet' }>`
  - `data: T[]`
  - `onRowClick?: (row: T) => void`
  - `isLoading?: boolean`
  - `emptyMessage?: string`
- **Visual Specs:**
  - Row Height: `38px` (condensed padding: `8px 12px`).
  - Header Height: `32px` with uppercase 10px tracking labels.
  - Alternating zebra striping and subtle hover highlight.

### 3.4 `Badge`
Ultra-compact status pill for account health, transaction types, and system states.

- **Import:** `import { Badge } from '../../components/ui/Badge';`
- **Props:**
  - `variant: 'success' | 'warning' | 'error' | 'info' | 'neutral'`
  - `children: React.ReactNode`
  - `size?: 'sm' | 'md'` (sm: 18px height; md: 22px height)
- **Visual Specs:**
  - Font size: `11px`, `font-weight: 600`.
  - Border radius: `4px` or `999px` (pill mode).

---

## 4. Filters & Export Subsystem

### 4.1 `FilterBar`
Standardized filter and search strip for all directory screens.

- **Import:** `import { FilterBar } from '../../components/ui/FilterBar';`
- **Props:**
  - `searchQuery: string`
  - `onSearchChange: (query: string) => void`
  - `searchPlaceholder?: string`
  - `quickFilters?: Array<{ id: string; label: string; value: string; options: { label: string; value: string }[]; onChange: (v: string) => void }>`
  - `chips?: Array<{ id: string; label: string; valueDisplay: string; onRemove: () => void }>`
  - `onClearAll?: () => void`
  - `onOpenAdvanced?: () => void`
  - `hasActiveFilters?: boolean`
  - `totalCount?: number`
  - `filteredCount?: number`
  - `rightSlot?: React.ReactNode`
- **Features:**
  - Search input with instant escape/clear (x) button.
  - Compact inline filter dropdowns (32px height).
  - Active filter chips row with individual remove tags.
  - Live count indicator (`14 of 120`).

### 4.2 `AdvancedFilterSheet`
Secondary filter drawer that slides in on desktop and docks as an 85vh bottom sheet on mobile.

- **Import:** `import { AdvancedFilterSheet } from '../../components/ui/AdvancedFilterSheet';`
- **Props:**
  - `isOpen: boolean`
  - `onClose: () => void`
  - `onApply: () => void`
  - `onReset: () => void`
  - `title?: string`
  - `appliedCount?: number`
  - `children: React.ReactNode`
- **Features:**
  - Backdrop blur overlay.
  - Sticky header with active count badge.
  - Sticky footer with "Reset" and "Apply Filters" buttons.
  - Full keyboard accessibility (`Escape` key closes).

### 4.3 `ExportMenu`
Compact dropdown button providing instant single-click downloads without modal overhead.

- **Import:** `import { ExportMenu } from '../../components/ui/ExportMenu';`
- **Props:**
  - `onExportCSV?: () => void | Promise<void>`
  - `onExportExcel?: () => void | Promise<void>`
  - `onExportPDF?: () => void | Promise<void>`
  - `disabled?: boolean`
  - `label?: string` (Default: `'Export'`)
  - `size?: 'sm' | 'md'`
- **Export Guarantees:**
  - **CSV**: Prepended with UTF-8 BOM (`\uFEFF`) and protected against spreadsheet formula injection (`=`, `+`, `-`, `@` prefixed with `'`).
  - **Excel**: Full `.xlsx` workbook generated via `xlsx` library with auto-sized column widths.
  - **PDF**: Clean, branded institutional layout via `jspdf` and `jspdf-autotable`.

---

## 5. Drawers & Dialog Surfaces

### 5.1 `DrawerLayout`
Consistent structural wrapper for slide-out operation drawers (`DepositDrawer`, `WithdrawalDrawer`, etc.).

- **Header**: Compact title with student/account context tag and close button.
- **Body**: Scrollable form section with compact `AmountInput` and category selects.
- **Footer**: Sticky action bar with secondary "Cancel" and primary submit button (with loading spinner and idempotency guard).
- **Responsive Behavior**:
  - Desktop: 440px right slide-over.
  - Mobile: Full-screen bottom sheet with thumb-friendly controls.

### 5.2 `ConfirmationModal`
Destructive and critical action confirmation dialog.

- **Visuals**: Clean card with warning/danger icon, explicit message, and action buttons.
- **Accessibility**: Traps focus, blocks outside scrolling, and triggers cancel on `Escape`.

---

## 6. Accessibility & Keyboard Navigation Standards

1. **Touch Targets**: All interactive elements maintain a minimum hit target of `36px` on desktop and `44px` on touch screens.
2. **Keyboard Traps**: All drawers and modals implement `Escape` key listeners and restore focus to the triggering element upon closure.
3. **ARIA Attributes**: `aria-haspopup`, `aria-expanded`, `aria-label`, and role attributes are consistently applied across `Dropdown`, `ExportMenu`, `FilterBar`, and `DataTable`.
4. **Contrast Compliance**: Text colors adhere to WCAG 2.1 AA standards (minimum 4.5:1 contrast against light slate backgrounds).
