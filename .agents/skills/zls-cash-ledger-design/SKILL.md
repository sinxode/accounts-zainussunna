---
name: zls-cash-ledger-design
description: Complete design system and frontend engineering standard for the Zainussunna Ledger System (ZLS). Enforces the cash ledger visual language inspired by Donezo, Siburian Finance, Finnova, and Peoplexio: soft grey-green canvas (#EEF0EC), framed 28px white shell (#FFFFFF), deep-green hero card gradient, lime accents (#B7F26B), pill controls, big numbers, maximum 5 desktop containers, and UPI-like drawer interactions.
---

# ZLS Cash Ledger Design System

The Zainussunna Ledger System (ZLS) is a **cash ledger**, not an analytics dashboard. It combines the speed and clarity of modern UPI banking applications with the information density and precision of a professional financial workspace.

---

## 1. Core Principles

1. **Cash Ledger, Not Analytics Product**:
   Every container on screen must answer a ledger question:
   - *How much do we hold?*
   - *What moved?*
   - *Who owes/paid?*
   - *What do I do next?*
   Decorative widgets (time trackers, rewards, stock photos, mascot avatars) are strictly forbidden.

2. **Container Budget (Max 5 Rule)**:
   Target a maximum of **5 visible top-level containers** on any screen at desktop width. Avoid boxes-inside-boxes; use generous spacing, typography, and clear visual hierarchy.

3. **1-Tap UPI-Like Operations**:
   The three primary actions (**Deposit, Withdraw, Transfer**) are always 1 tap away:
   - Desktop Header: `+ Deposit` (primary green), `Withdraw` (secondary green outline).
   - Desktop Dashboard Hero: `Deposit` (lime-500 pill), `Withdraw` (hero outline), `Transfer` (hero outline).
   - Mobile: 64px white bottom bar with center lime circle FAB (`Plus`) opening a Quick Actions sheet.
   - All actions open **drawers** or bottom sheets, never full-page navigation.

---

## 2. Design Tokens Reference

All design tokens are defined in `src/styles/_tokens.scss` and exposed as CSS variables on `:root`. **Never use hardcoded hex colors** in UI components or SCSS modules.

### 2.1 Color Tokens
```scss
:root {
  /* Canvas */
  --bg-page:        #EEF0EC;   /* outer background: soft grey-green */
  --bg-shell:       #FFFFFF;   /* main app shell / sidebar */
  --bg-surface:     #FFFFFF;   /* cards */
  --bg-subtle:      #F5F6F3;   /* inputs, table hover, inactive pills */
  --bg-muted:       #E9ECE6;   /* tracks, skeletons */

  /* Brand Greens */
  --green-900:      #0B3B26;   /* darkest: hero base, text on lime */
  --green-800:      #12543A;   /* dark hover state */
  --green-700:      #1A6B49;   /* primary brand button, active indicator */
  --green-600:      #2A8A5E;   /* focus ring outline */
  --green-300:      #8FD6A8;   /* borders on tinted surfaces */
  --green-100:      #DDF3E4;   /* credit chips, avatar background, active nav tint */

  /* Lime Accent (Used sparingly for highlight & active pills) */
  --lime-500:       #B7F26B;   /* active pill tab, hero CTA, FAB */
  --lime-300:       #D2F79F;   /* hover state for lime */
  --lime-100:       #EEFBD6;   /* soft lime highlight card */

  /* Typography Colors */
  --text-strong:    #0E1A14;   /* primary text, headings */
  --text-body:      #2E3B34;   /* secondary body copy */
  --text-muted:     #6B776F;   /* captions, placeholders */
  --text-faint:     #9AA59D;   /* non-essential metadata */
  --text-on-dark:   #FFFFFF;   /* text inside hero gradient */
  --text-on-dark-muted: rgba(255, 255, 255, 0.68);

  /* Semantic Money Colors */
  --credit:         #1A8F4E;   /* money in (+₹) */
  --credit-bg:      #E3F6EA;
  --debit:          #D9483B;   /* money out (−₹) */
  --debit-bg:       #FCE9E6;
  --warn:           #E58A1F;   /* pending, overdrawn */
  --warn-bg:        #FEF1DD;
  --info:           #2F6FED;   /* internal transfer */
  --info-bg:        #E6EEFE;

  /* Borders & Elevation */
  --border:         #E8EBE5;
  --border-strong:  #D6DAD3;
  --shadow-none:    none;
  --shadow-sm:      0 1px 2px rgba(0, 0, 0, 0.03);
  --shadow-md:      0 2px 6px rgba(0, 0, 0, 0.04);
  --shadow-lg:      0 10px 28px rgba(0, 0, 0, 0.06);
  --shadow-shell:   0 2px 12px rgba(0, 0, 0, 0.03);

  /* Motion & Easing */
  --ease-out:       cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out:   cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast:  150ms;
  --duration-normal: 240ms;

  /* Hero Gradient */
  --grad-hero: linear-gradient(135deg, #0B3B26 0%, #17603F 55%, #2A8A5E 100%);
}
```

### 2.2 Geometry & Radius Scale
| Element | Radius | Token |
|---|---|---|
| Outer Desktop Shell | 28px | `--radius-shell` |
| Primary Cards | 20px | `--radius-card` |
| Inner Tiles / Account Tiles | 14px | `--radius-tile` |
| Form Fields / Inputs | 12px | `--radius-input` |
| Buttons / Pills / Badges | 999px | `--radius-pill` |
| Drawers (Top corners / Left corners) | 24px | `--radius-drawer` |

### 2.3 Typography Scale
- Fonts loaded: **DM Sans** (headings, numbers) and **Inter** (body, controls).
- All numbers use `tabular-nums` formatting.
- Indian numbering format: `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.
- Signed values: always prefix movements (`+₹5,000` for credit, `−₹4,000` for debit). Never rely on color alone.

---

## 3. App Shell Architecture

### 3.1 Desktop (≥ 1200px)
- **Outer Page**: `--bg-page: #EEF0EC` with **24px outer padding**.
- **Inner Shell**: Single white container (`--bg-shell: #FFFFFF`, radius 28px, box shadow `--shadow-md`).
- **Layout Grid**: 2 columns: `sidebar 248px | main 1fr`.
- **Sidebar**:
  - Logo mark: green rounded square with book/ledger glyph + "Zainussunna" / "Ledger".
  - Section `MENU`: Dashboard, Transactions, Accounts, Students, Debts.
  - Section `GENERAL`: Reports, Settings, Logout.
  - Active item: `--green-700` text + 3px green indicator bar + `--green-100` tint.
  - Bottom: small User Chip with Avatar, name, role.
- **Header** (72px, borderless inside shell):
  - Page Title block: `h1` + muted one-line description.
  - Search pill: 360px centered input with `⌘K` shortcut chip.
  - Action group: `+ Deposit` (primary), `Withdraw` (secondary), Notifications, Avatar.

### 3.2 Tablet (768px – 1199px)
- Sidebar collapses to a **72px icon rail** with tooltips on hover.
- Grid switches to single column or 72px rail.

### 3.3 Mobile (< 768px)
- Full bleed canvas; outer shell padding removed.
- Sidebar hidden.
- Header: compact greeting + search icon + notification bell.
- Bottom Tab Bar (64px, white, safe-area padding):
  - `Home` · `Transactions` · **Center Lime Circle FAB (48px, `Plus`)** · `Students` · `More`.
  - Tapping the FAB opens a slide-up "Quick Actions" sheet: Deposit, Withdraw, Transfer.
  - Tapping "More" opens a slide-up navigation sheet: Accounts, Debts, Reports, Settings, Logout.

---

## 4. UI Primitives (`frontend/src/components/ui/`)

1. **`Card`**:
   - `surface`: standard white card, 1px `--border`, radius 20px.
   - `hero`: `--grad-hero` gradient, white text, radial corner glow, dot watermark.
   - `lime`: `--lime-100` background, `--green-900` text.
2. **`StatCard`**:
   - Caption label, DM Sans 28px tabular value, delta chip (`↑ 12% vs last month`), optional 36px circular arrow button.
3. **`Button`**:
   - Pill radius (999px). Variants: `primary` (green-700), `secondary` (outline green), `ghost`, `danger` (debit-bg/red), `lime` (lime-500), `hero-outline` (translucent white outline).
4. **`PillTabs`**:
   - Segmented control. Variants: `lime` (active tab lime-500 with green-900 text), `dark` (active tab green-900 with white text), `subtle` (white active card).
5. **`Badge`**:
   - 24px height, pill radius, semantic tints (`credit`, `debit`, `transfer`, `pending`, `active`, `hifz`, `da_wa`).
6. **`Avatar`**:
   - Circle with uppercase initials fallback on `--green-100`. Sizes: `sm` (28px), `md` (36px), `lg` (48px), `xl` (64px).
7. **`Input` / `Field`**:
   - 48px height, 12px radius, `--bg-subtle` fill, 1px transparent border → `--green-600` on focus with 3px `--green-100` ring.
8. **`AmountInput`**:
   - Centered DM Sans 40px input with `₹` symbol prefix, clear button (`✕`), and quick addition chips (`+500`, `+1,000`, `+5,000`).
9. **`TransactionRow`**:
   - 64px height, 40px circular icon (`ArrowDownLeft` credit / `ArrowUpRight` debit / `ArrowLeftRight` transfer), bold primary purpose, secondary metadata line, right-aligned signed amount and date.
10. **`Drawer`**:
    - Desktop: 440px right panel with 24px border radius.
    - Mobile: 92vh bottom sheet with top drag handle.
    - Scrim: `rgba(14, 26, 20, 0.35)` with 4px backdrop blur.
    - Focus trap and ESC key dismiss.
    - Sticky footer with dynamic action amount (e.g., **"Deposit ₹5,000"**).

---

## 5. Screen Templates

### 5.1 Dashboard
- **Row 1**:
  - Hero Balance Card (span 7): total ledger balance, 3 quick buttons (`Deposit`, `Withdraw`, `Transfer`), top-right circular arrow to operations.
  - This Month Card (span 5): Money In (+), Money Out (−), horizontal proportion bar, Net This Month.
- **Row 2**:
  - Accounts Strip (span 12): horizontal scroll of cash account tiles (`Central Cashbook`, `Student Pool`, `External Loans`).
- **Row 3**:
  - Recent Transactions (span 8): last 8 rows using `TransactionRow`.
  - Needs Attention (span 4): overdrawn/negative balance accounts with one-click review.

### 5.2 Central Transactions Ledger
- **Controls**: Month navigator (`‹ November 2026 ›`), PillTabs (`All`, `Deposits`, `Withdrawals`, `Transfers`), inline search, Export buttons.
- **Summary Strip**: single inline banner with `Total In` | `Total Out` | `Net Movement` | `Record Count`.
- **Desktop**: DataTable with 56px rows.
- **Mobile**: `TransactionRow` list.
- **Click**: opens slide-over receipt drawer with full verification details and reversal action.

### 5.3 Student Directory & Profile
- **Directory**: status PillTabs (`All`, `Active`, `Archived`), health PillTabs (`All`, `Positive`, `Overdrawn`), table with Avatar, Enrollment, Category, Balance, State.
- **Profile**:
  - Left column (span 4): Profile card with large avatar, contact cards (phone, parent phone, WhatsApp), inflow/outflow totals.
  - Right column (span 8): Hero balance card with deposit/withdraw actions, transaction history table.

---

## 6. Implementation Checklist for New Screens & Refactors

When building or updating screens in ZLS, verify every item:
- [ ] Outer page uses `--bg-page: #EEF0EC` and inner shell uses `--bg-shell: #FFFFFF` with radius 28px.
- [ ] No hardcoded hex values; all colors reference CSS variables from `_tokens.scss`.
- [ ] No screen has more than 5 visible top-level containers on desktop.
- [ ] All money values use DM Sans, `font-variant-numeric: tabular-nums`, and `en-IN` formatting.
- [ ] All monetary movements display an explicit sign (`+` or `−`).
- [ ] Form actions (Deposit, Withdraw, Transfer) open drawers with sticky footers stating the amount.
- [ ] Mobile viewport (< 768px) is responsive, contains no horizontal scrolling, and uses the 64px bottom bar with center lime FAB.
