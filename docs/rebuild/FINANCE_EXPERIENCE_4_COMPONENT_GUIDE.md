# ZLS DARK FINANCE EXPERIENCE 4.0 — COMPONENT DESIGN GUIDE & SPECIFICATION
**Project:** Zainussunna Ledger System (ZLS)  
**Branch:** `zls-rebuild`  
**Phase:** Dark Finance Experience 4.0 — Premium Product Redesign, Interface Architecture & Interaction Overhaul  
**Status:** Approved & Implemented  
**Date:** October 2026  

---

## 1. Design Token Architecture

The Dark Finance Experience 4.0 system is powered by an authoritative set of CSS custom properties defined in `frontend/src/styles/design-system/_colors.scss` and globally available across all SCSS modules.

### 1.1 Surface & Elevation Tokens

| CSS Variable | Hex Value | Purpose & Architectural Usage |
|---|---|---|
| `--bg-app` | `#0B0F14` | Viewport foundation canvas (`body`, layout root). Deep charcoal engineered for long sessions. |
| `--bg-nav` | `#10161F` | Navigation surfaces (`Sidebar`, top `Header`, sticky bottom dock, drawer headers/footers). |
| `--bg-surface` | `#151C26` | Primary card surfaces, stat cards, table containers, modal bodies, and drawer body canvas. |
| `--bg-raised` | `#1C2633` | Raised interactive controls: textfield inputs, table header bars, inactive action pills. |
| `--bg-hover` | `#222F3E` | Hover highlight state for table rows, navigation items, dropdown options, and list entries. |
| `--border-default` | `#2B3747` | Standard component border for cards, inputs, and section dividers. |
| `--border-subtle` | `#1E2836` | Subtle separators between table rows, list items, and card subsections. |
| `--border-strong` | `#3B4A5E` | Focused input outlines, active tabs, and highlighted borders. |

### 1.2 Typography & Semantic Accents

| CSS Variable | Hex Value | Weight | Usage & Contrast |
|---|---|---|---|
| `--text-primary` | `#F3F6FA` | 500 / 600 / 700 | Primary headings, prominent balances, active labels. 14.2:1 contrast against surface. |
| `--text-secondary`| `#A4B0C0` | 400 / 500 | Secondary metadata, table body text, form field labels, breadcrumbs. |
| `--text-muted` | `#7E8A9A` | 400 | Inactive placeholders, helper text, timestamps, captions, disabled states. |
| `--primary` | `#8AB4F8` | 600 | Primary brand accent and interactive CTA focus color (Google FinTech Blue). |
| `--primary-strong` | `#A9C7FF` | 600 | Hover and active state for primary CTA buttons. |
| `--status-success` | `#45D6A0` | 600 | Positive financial movement (Credits, Deposits, Repayments, Healthy student balance). |
| `--status-danger` | `#FF7185` | 600 | Negative financial movement (Debits, Withdrawals, Overdue loans, Negative balance alert). |
| `--status-warning` | `#F4C66A` | 600 | Low balance warning, unlinked transactions, pending reconciliations. |

### 1.3 Geometric Radii Scale

```scss
--radius-xs: 4px;   // Small indicators, tiny chips
--radius-sm: 8px;   // Badges, tags, dropdown items
--radius-md: 10px;  // Buttons, text inputs, search fields
--radius-lg: 14px;  // Standard cards, table containers, stat cards
--radius-xl: 18px;  // Modal dialogs, floating popovers
--radius-2xl: 20px; // Drawers, mobile bottom action sheets
--radius-pill: 9999px; // Denomination pills, avatar circles
```

---

## 2. Shared Component Specifications

### 2.1 PageHeader (`frontend/src/components/ui/PageHeader.tsx`)

The unified header component standardizes page navigation across all 40 routes, providing breadcrumb trails, contextual status badges, and responsive action groups.

```tsx
import { PageHeader } from './components/ui/PageHeader';
import { Badge } from './components/ui/Badge';
import { Button } from './components/ui/Button';

<PageHeader
  title="Ahmed Khan"
  subtitle="Enrolment: ZLS-001 • Academic Batch: Senior 2026"
  breadcrumbs={[
    { label: 'Students', href: '/students' },
    { label: 'Ahmed Khan' }
  ]}
  badge={<Badge variant="healthy">Healthy</Badge>}
  actions={
    <div className="flex items-center gap-2">
      <Button variant="secondary" size="sm">Export Statement</Button>
      <Button variant="primary" size="sm">New Deposit</Button>
    </div>
  }
/>
```

---

### 2.2 AmountInput (`frontend/src/components/ui/AmountInput.tsx`)

A dedicated financial input component inspired by mobile UPI and banking applications:
1. Prominent tabular amount display anchored by a high-contrast ₹ currency symbol.
2. Fast-add denomination pills (`+₹100`, `+₹500`, `+₹1000`, `+₹2000`).
3. Optional on-screen touch keypad with a tactile dark raised surface (`#1C2633`).
4. Strict number formatting with two-decimal precision.

```tsx
import { AmountInput } from './components/ui/AmountInput';

<AmountInput
  value={amount}
  onChange={setAmount}
  showKeypad={true}
  quickAmounts={[100, 500, 1000, 2000]}
  label="Deposit Amount"
  helperText="Funds will be immediately credited to student ledger."
/>
```

---

### 2.3 DataTable (`frontend/src/components/ui/DataTable.tsx`)

The dark data table provides:
1. Raised sticky header bar (`#1C2633`) with uppercase tracking and subtle bottom border (`#2B3747`).
2. Alternating row borders (`#1E2836`) and smooth row hover transitions (`#222F3E`).
3. Strict tabular numerals (`font-feature-settings: 'tnum' 1`) with right-alignment for currency columns.
4. Mobile adaptation: automatically transforms into touch-friendly compact cards below 768px (`styles.cardView`).

```tsx
<DataTable
  columns={[
    { header: 'Student', accessor: 'name' },
    { header: 'Enrolment', accessor: 'enrolment_no' },
    { 
      header: 'Balance', 
      accessor: (row) => `${row.current_balance < 0 ? '-' : '+'}₹${Math.abs(row.current_balance).toLocaleString()}`,
      align: 'right',
      className: (row) => row.current_balance < 0 ? 'text-debit' : 'text-credit'
    },
    { 
      header: 'Status', 
      accessor: (row) => <Badge variant={row.health_status}>{row.health_status}</Badge>,
      align: 'center'
    }
  ]}
  data={students}
  isLoading={isLoading}
/>
```

---

### 2.4 Button (`frontend/src/components/ui/Button.tsx`)

Buttons adhere to a 10px radius with dedicated high-contrast dark variants:
- **`primary`**: High-contrast azure (`#8AB4F8`) with `#0B0F14` text.
- **`secondary`**: Raised surface (`#1C2633`) with `#2B3747` border and `#F3F6FA` text.
- **`ghost` / `outline`**: Transparent with subtle hover background (`#222F3E`).
- **`danger`**: Coral rose (`#FF7185`) for irreversible operations with reason requirement.

```tsx
<Button variant="primary" size="md" icon={<Plus size={16} />}>
  Confirm Deposit
</Button>
<Button variant="secondary" size="md">
  Cancel
</Button>
<Button variant="danger" size="sm">
  Reverse Transaction
</Button>
```

---

### 2.5 Drawers & Modal Sheets (`frontend/src/components/ui/Drawer.tsx`)

Operational drawers handle all money movement (Deposits, Withdrawals, Transfers, Repayments, Recoveries):
- **Desktop**: 440px / 480px side drawer sliding in from the right edge, 20px rounded top-left and bottom-left exposed corners.
- **Mobile**: Bottom sheet sliding up from the screen bottom, 20px rounded top corners, swipe handle pill.
- **Backdrop**: Dark translucent scrim with 6px Gaussian blur (`backdrop-filter: blur(6px)`).
- **Body & Footer**: `#151C26` body surface, `#10161F` sticky footer containing the primary submission CTA with double-click protection via stable idempotency keys.

---

### 2.6 FilterBar & AdvancedFilterSheet

Filters provide instant querying:
- Quick search textfield with search icon and clear button.
- Quick filter select dropdowns (Type, Direction, Health).
- Active filter pill badges with one-click clear button.
- Advanced filters trigger button opening the 20px rounded `AdvancedFilterSheet`.

---

### 2.7 ExportMenu (`frontend/src/components/ui/ExportMenu.tsx`)

The `ExportMenu` renders a compact dark popover providing multi-format data downloads:
- **Excel (.xlsx)**: Emerald green icon (`#45D6A0`).
- **CSV (.csv)**: Fintech azure icon (`#8AB4F8`), with automatic formula injection sanitization (`=`, `+`, `-`, `@`).
- **PDF (.pdf)**: Coral rose icon (`#FF7185`).
