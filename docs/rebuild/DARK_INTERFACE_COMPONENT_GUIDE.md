# ZLS DARK INTERFACE 3.0 — COMPONENT DESIGN GUIDE & SPECIFICATION
**Project:** Zainussunna Ledger System (ZLS)  
**Branch:** `zls-rebuild`  
**Phase:** Dark-First Fintech Component System  
**Status:** Approved & Implemented  
**Date:** October 2026  

---

## 1. Design Token Architecture

The ZLS Dark Interface 3.0 design system is built upon a 6-tier surface hierarchy, high-contrast typography, and curated fintech accent tokens. All tokens are declared as CSS custom properties in `frontend/src/styles/design-system/_colors.scss` and automatically injected via Vite.

### 1.1 Color Palette & Surface Tokens

| Token Name | Hex Value | Role & Usage |
|---|---|---|
| `--bg-app` | `#0B0F14` | Global viewport canvas background (`body`, main page wrapper). Deep charcoal minimizing OLED power consumption and eye strain. |
| `--bg-nav` | `#10161F` | Navigation surfaces (`Sidebar`, top `Header`, mobile bottom action dock). Layered one tier above canvas. |
| `--bg-surface` | `#151C26` | Primary card surfaces, stat cards, drawers, modal sheets, and dropdown menus. |
| `--bg-raised` | `#1C2633` | Elevated interactive controls: input textfields, select inputs, table headers, inactive action pills. |
| `--bg-hover` | `#222F3E` | Hover highlight state for table rows, navigation items, dropdown options, and list entries. |
| `--border-default` | `#2B3747` | Standard component border for cards, inputs, and section dividers. |
| `--border-subtle` | `#1E2836` | Subtle separators between table rows, list items, and card subsections. |
| `--border-strong` | `#3B4A5E` | Emphasized borders, active tabs, and focused input outlines. |

### 1.2 Typography Tokens

| Token Name | Hex Value | Font Weight | Intended Purpose |
|---|---|---|---|
| `--text-primary` | `#F3F6FA` | 500 / 600 / 700 | Primary headings, prominent balances, active labels. Maximum contrast (14.2:1 against surface). |
| `--text-secondary`| `#A4B0C0` | 400 / 500 | Secondary metadata, table body text, form field labels, breadcrumbs. |
| `--text-muted` | `#7E8A9A` | 400 | Inactive placeholders, helper text, timestamps, captions, disabled states. |

### 1.3 Semantic Status & Financial Accents

| Token Name | Hex Value | Purpose & Visual Meaning |
|---|---|---|
| `--primary` | `#8AB4F8` | Primary brand accent and interactive CTA focus color (Google FinTech Blue). High-visibility on dark backgrounds. |
| `--primary-strong` | `#A9C7FF` | Hover and active state for primary CTA buttons. |
| `--status-success` | `#45D6A0` | Positive financial movement (Credits, Deposits, Repayments, Healthy student balance). Emerald green. |
| `--status-danger` | `#FF7185` | Negative financial movement (Debits, Withdrawals, Overdue loans, Negative balance alert). Coral rose. |
| `--status-warning` | `#F4C66A` | Low balance warning, unlinked transactions, pending reconciliations. Warm amber. |
| `--status-info` | `#8AB4F8` | Informational badges, audit notes, neutral system notices. Soft azure. |

### 1.4 Corner Radii Scale

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

## 2. Core UI Components

### 2.1 Button (`frontend/src/components/ui/Button.tsx`)

Buttons adhere to a 10px radius with dedicated high-contrast dark variants:

```tsx
import { Button } from './components/ui/Button';

// Primary CTA (Dark Fintech: High-contrast azure with dark text)
<Button variant="primary" size="md" icon={<Plus size={16} />}>
  New Deposit
</Button>

// Secondary / Surface Action
<Button variant="secondary" size="md">
  Export Data
</Button>

// Destructive Action (Coral Red)
<Button variant="danger" size="md">
  Reverse Transaction
</Button>

// Outline / Ghost
<Button variant="outline" size="sm">
  View Details
</Button>
```

#### SCSS Rules:
```scss
.primary {
  background-color: var(--primary, #8AB4F8);
  color: #0B0F14; // High contrast dark text on vibrant azure
  font-weight: 600;
  border: 1px solid transparent;
  &:hover:not(:disabled) {
    background-color: var(--primary-strong, #A9C7FF);
    box-shadow: 0 0 12px rgba(138, 180, 248, 0.35);
  }
}

.secondary {
  background-color: var(--bg-raised, #1C2633);
  color: var(--text-primary, #F3F6FA);
  border: 1px solid var(--border-default, #2B3747);
  &:hover:not(:disabled) {
    background-color: var(--bg-hover, #222F3E);
    border-color: var(--border-strong, #3B4A5E);
  }
}
```

---

### 2.2 AmountInput (`frontend/src/components/ui/AmountInput.tsx`)

Inspired by mobile banking and UPI applications, `AmountInput` provides:
1. Prominent tabular amount display anchored by a high-contrast ₹ currency symbol.
2. Fast-add denomination pills (`+₹100`, `+₹500`, `+₹1000`, `+₹2000`).
3. Optional on-screen touch keypad with a tactile dark raised surface.
4. Immediate number formatting with two-decimal precision.

```tsx
import { AmountInput } from './components/ui/AmountInput';

<AmountInput
  value={amount}
  onChange={setAmount}
  showKeypad={true}
  quickAmounts={[100, 500, 1000, 2000]}
  label="Enter Deposit Amount"
  helperText="Funds will be immediately credited to student ledger."
/>
```

---

### 2.3 Badge (`frontend/src/components/ui/Badge.tsx`)

Status badges utilize 8px rounded corners with subtle tonal tint backgrounds (`12% opacity`) and matching soft border outlines, ensuring high legibility without harsh saturation.

```tsx
import { Badge } from './components/ui/Badge';

<Badge variant="healthy">Healthy</Badge>
<Badge variant="low">Low Balance</Badge>
<Badge variant="negative">Negative (Action Required)</Badge>
<Badge variant="info">Verified</Badge>
```

#### Color Mapping:
- **`healthy`**: Background `rgba(69, 214, 160, 0.12)`, Text `#45D6A0`, Border `rgba(69, 214, 160, 0.25)`.
- **`low`**: Background `rgba(244, 198, 106, 0.12)`, Text `#F4C66A`, Border `rgba(244, 198, 106, 0.25)`.
- **`negative` / `danger`**: Background `rgba(255, 113, 133, 0.12)`, Text `#FF7185`, Border `rgba(255, 113, 133, 0.25)`.
- **`primary` / `info`**: Background `rgba(138, 180, 248, 0.12)`, Text `#8AB4F8`, Border `rgba(138, 180, 248, 0.25)`.

---

### 2.4 DataTable (`frontend/src/components/ui/DataTable.tsx`)

The dark data table incorporates:
1. Raised header bar (`#1C2633`) with uppercase tracking and subtle bottom border (`#2B3747`).
2. Alternating row borders (`#1E2836`) and smooth row hover transitions (`#222F3E`).
3. Strict tabular numerals (`font-feature-settings: 'tnum' 1`) with right-alignment for currency columns.
4. Mobile adaptation: automatically transforms into touch-friendly compact cards below 768px.

```tsx
<DataTable
  columns={[
    { header: 'Student', accessor: 'name' },
    { header: 'Enrolment', accessor: 'enrolment_no' },
    { 
      header: 'Balance', 
      accessor: (row) => formatCurrency(row.current_balance),
      align: 'right',
      className: (row) => row.current_balance < 0 ? styles.negative : styles.positive
    },
    { 
      header: 'Status', 
      accessor: (row) => <Badge variant={row.health_status}>{row.health_status}</Badge> 
    }
  ]}
  data={students}
  isLoading={isLoading}
/>
```

---

### 2.5 Drawers & Modal Sheets (`frontend/src/components/ui/Drawer.tsx`)

The drawer component powers all operational workflows (Deposits, Withdrawals, Transfers, Repayments, Recoveries):
- **Desktop**: 440px / 480px side drawer sliding in from the right edge, 20px rounded top-left and bottom-left exposed corners.
- **Mobile**: Bottom sheet sliding up from the screen bottom, 20px rounded top corners, swipe handle pill.
- **Backdrop**: Dark translucent scrim with 6px Gaussian blur (`backdrop-filter: blur(6px)`).
- **Body & Footer**: `#151C26` body surface, `#10161F` sticky footer containing the primary submission CTA with double-click protection.

```tsx
<Drawer isOpen={isOpen} onClose={handleClose} title="New Cash Deposit" subtitle="Credit funds to student ledger">
  <div className={styles.drawerBody}>
    <StudentSelector value={selectedStudent} onChange={setSelectedStudent} />
    <AmountInput value={amount} onChange={setAmount} />
    <Input label="Purpose / Notes" value={purpose} onChange={setPurpose} />
  </div>
  <div className={styles.drawerFooter}>
    <Button variant="secondary" onClick={handleClose}>Cancel</Button>
    <Button variant="primary" loading={isSubmitting} onClick={handleSubmit}>
      Confirm Deposit
    </Button>
  </div>
</Drawer>
```

---

### 2.6 FilterBar & AdvancedFilterSheet

Filters provide instant client-side and server-side querying:
- Quick search textfield with search icon and clear button.
- Quick filter select dropdowns (Type, Direction, Health).
- Active filter pill badges with one-click clear button.
- Advanced filters trigger button opening the 20px rounded `AdvancedFilterSheet`.

```tsx
<FilterBar
  searchTerm={search}
  onSearchChange={setSearch}
  searchPlaceholder="Search by student name or enrolment..."
  quickFilters={[
    { key: 'health', label: 'All Health', value: healthFilter, options: healthOptions, onChange: setHealthFilter }
  ]}
  activeFilterCount={activeCount}
  onOpenAdvanced={() => setIsFilterSheetOpen(true)}
  onClearAll={handleClearFilters}
/>
```

---

### 2.7 ExportMenu (`frontend/src/components/ui/ExportMenu.tsx`)

The `ExportMenu` renders a compact dark popover providing multi-format data downloads:
- **Excel (.xlsx)**: Emerald green icon (`#45D6A0`).
- **CSV (.csv)**: Fintech azure icon (`#8AB4F8`), with automatic formula injection sanitization (`=`, `+`, `-`, `@`).
- **PDF (.pdf)**: Coral rose icon (`#FF7185`).

---

## 3. Best Practices for Dark UI Extensions

When adding new screens or custom components to ZLS:
1. **Never hardcode hex values**: Always use `var(--bg-surface, #151C26)`, `var(--text-primary, #F3F6FA)`, etc.
2. **Never nest dark surfaces deeply**: Adhere strictly to the 6 surface levels (Canvas -> Nav -> Surface -> Raised -> Hover).
3. **Tabular Numerals**: Apply `font-variant-numeric: tabular-nums` or `font-feature-settings: 'tnum' 1` on all financial figures.
4. **Idempotency Safeguards**: Retain generated idempotency keys across form validation retries and regenerate only after clean submission resets.
5. **Color Contrast Verification**: Maintain at least 4.5:1 contrast for secondary body text and 7:1 for primary financial figures.
