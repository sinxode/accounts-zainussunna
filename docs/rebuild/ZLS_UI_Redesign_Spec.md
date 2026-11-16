# ZLS (Zainussunna Ledger System) — UI Redesign Spec

**Audience:** coding agent. **Scope:** frontend visual/UX rebuild only. **Do NOT change** backend, API contracts, auth, business logic, data models or route paths. Only presentation, layout, components and interaction patterns change.

**Stack assumed:** React + Vite, SCSS, React Router, Lucide React icons. No new UI library (no MUI/Chakra/Ant). Charts: Recharts only if a chart is specified below.

---

## 0. Design intent (read first)

ZLS is a **cash ledger**, not an analytics product. The reference dashboards (Donezo, Siburian finance, Finnova, Peoplexio) are used for their **visual language**: white shell, soft grey canvas, one deep-green hero card, lime accent, big rounded containers, calm spacing, pill controls, big numbers. They are **not** a content checklist.

Rules:
1. Copy the visual language exactly: colours, radius, spacing, type scale, card style, pill tabs, drawers, list rows.
2. Do NOT copy decorative widgets from references (time tracker, rewards, download-app card, hatched bar charts, project analytics, hiring charts, stock images, mascot avatars). They have no meaning in a ledger.
3. Every container on screen must answer a ledger question: *How much do we hold? What moved? Who owes/paid? What do I do next?* If a container doesn't, delete it.
4. UPI-like simplicity: the three primary actions (**Deposit, Withdraw, Transfer**) are always one tap away and open **drawers**, not new pages.
5. Fewer containers, bigger containers. Target max **5 visible containers** on any screen at desktop width.

---

## 1. Design tokens

Create `src/styles/_tokens.scss` and expose as CSS variables on `:root`. No hardcoded hex values anywhere else in the codebase.

### 1.1 Colour

```scss
:root {
  /* Canvas */
  --bg-page:        #EEF0EC;   /* outer app background, soft grey-green */
  --bg-shell:       #FFFFFF;   /* main app shell / sidebar */
  --bg-surface:     #FFFFFF;   /* cards */
  --bg-subtle:      #F5F6F3;   /* inputs, table zebra, inactive pills */
  --bg-muted:       #E9ECE6;   /* tracks, skeletons */

  /* Brand green (from references) */
  --green-900:      #0B3B26;   /* darkest: hero card base, primary button text-on-light */
  --green-800:      #12543A;
  --green-700:      #1A6B49;   /* primary buttons, active nav */
  --green-600:      #2A8A5E;
  --green-300:      #8FD6A8;
  --green-100:      #DDF3E4;   /* soft tint backgrounds, success chips */
  --lime-500:       #B7F26B;   /* accent: active pill, highlight card, CTA circle */
  --lime-300:       #D2F79F;
  --lime-100:       #EEFBD6;

  /* Text */
  --text-strong:    #0E1A14;
  --text-body:      #2E3B34;
  --text-muted:     #6B776F;
  --text-faint:     #9AA59D;
  --text-on-dark:   #FFFFFF;
  --text-on-dark-muted: rgba(255,255,255,.68);

  /* Semantic (ledger) */
  --credit:         #1A8F4E;   /* money in */
  --credit-bg:      #E3F6EA;
  --debit:          #D9483B;   /* money out */
  --debit-bg:       #FCE9E6;
  --warn:           #E58A1F;
  --warn-bg:        #FEF1DD;
  --info:           #2F6FED;   /* use sparingly: "Transfer" chips only */
  --info-bg:        #E6EEFE;

  /* Lines */
  --border:         #E4E7E1;
  --border-strong:  #D3D8D0;

  /* Elevation */
  --shadow-sm: 0 1px 2px rgba(11,59,38,.05);
  --shadow-md: 0 6px 20px rgba(11,59,38,.07);
  --shadow-lg: 0 20px 50px rgba(11,59,38,.14);   /* drawers, modals */

  /* Hero gradient (dark green card in Donezo reference) */
  --grad-hero: linear-gradient(135deg, #0B3B26 0%, #17603F 55%, #2A8A5E 100%);
}
```

Colour usage rules:
- **Green = brand/primary/positive. Lime = highlight only** (active pill, big circular arrow button, one highlight card per screen max).
- Debit = red, Credit = green, always with a sign (`+₹5,000` / `−₹4,000`) and never colour alone (accessibility).
- Blue is allowed **only** for the "Transfer" transaction type chip. No purple, no yellow, no orange accents beyond `--warn` for pending/needs-attention.
- No dark mode in this phase. Light only. Structure tokens so dark can be added later.

### 1.2 Typography

Fonts (max two): **DM Sans** (headings, big numbers) and **Inter** (body/UI). Load via `@fontsource` or Google Fonts with `display=swap`.

| Token | Font | Size / Line | Weight | Use |
|---|---|---|---|---|
| `display` | DM Sans | 40/44 (mobile 32/36) | 600 | Hero balance |
| `h1` | DM Sans | 28/34 | 600 | Page title ("Dashboard") |
| `h2` | DM Sans | 20/26 | 600 | Card titles |
| `h3` | DM Sans | 16/22 | 600 | Sub-headings |
| `body` | Inter | 14/22 | 400 | Default |
| `body-strong` | Inter | 14/22 | 600 | Row primary text |
| `caption` | Inter | 12/16 | 500 | Labels, meta, chips |
| `num` | DM Sans, `font-variant-numeric: tabular-nums` | — | 600 | All money values |

All currency uses `Intl.NumberFormat('en-IN', {style:'currency', currency:'INR'})`. Paise de-emphasised: render decimals in `--text-faint` at 60% size in the hero balance only.

### 1.3 Shape, spacing, motion

- **Radius:** shell 28px · cards 20px · inner tiles 14px · inputs 12px · pills/buttons 999px · drawer top corners 24px.
- **Spacing scale (4px base):** 4, 8, 12, 16, 20, 24, 32, 40, 48. Card padding 20 (desktop) / 16 (mobile). Gap between cards 16 (desktop) / 12 (mobile).
- **Borders:** 1px `--border` on cards. No heavy shadows on cards (`--shadow-sm` max). Shadows only on floating layers.
- **Motion:** 180ms `cubic-bezier(.2,.8,.2,1)` for hover/press; 280ms for drawers; number count-up 600ms on first load of hero balance only. Respect `prefers-reduced-motion` (disable all except opacity fades).
- **Icons:** Lucide, 18px in lists, 20px in nav, stroke 1.75.

---

## 2. App shell & navigation

### 2.1 Desktop (≥1200px)
Outer page = `--bg-page` with **24px padding**. Inside: one big white rounded shell (radius 28, `--shadow-md`) exactly like the references. Shell is a 2-column grid: `sidebar 248px | main 1fr`.

**Sidebar** (white, no divider line, just spacing):
- Top: logo mark (green rounded square with academy glyph) + "Zainussunna" / small "Ledger" caption.
- Section label `MENU` (caption, faint, uppercase tracking .08em).
- Nav items (icon + label, 44px height, radius 12): 
  1. Dashboard (`LayoutDashboard`)
  2. Transactions (`ArrowLeftRight`)
  3. Accounts (`Wallet`)
  4. Students (`GraduationCap`)
  5. Debts (`HandCoins`)
- Section label `GENERAL`: Settings (`Settings`), Logout (`LogOut`).
- Active item: `--green-700` text + 3px green left indicator bar (Donezo style) + `--green-100` background tint. Inactive: `--text-muted`. Hover: `--bg-subtle`.
- **No download-app card, no promo cards.** Bottom of sidebar: small user chip (avatar, name, role).

**Top bar** (inside main, 72px, no border, sits on the main panel):
- Left: page title block (h1 + one-line muted subtitle).
- Centre-right: global search pill (`Search students, transactions…`, with `⌘K` hint chip) — opens command palette (student quick-jump + transaction search). Width 360.
- Right: **primary CTA group**: `+ Deposit` (filled green-700, white text), `Withdraw` (outlined green), icon button for Notifications (only if the app already has notifications; otherwise omit), avatar.

### 2.2 Tablet (768–1199px)
Sidebar collapses to a **72px icon rail** (tooltips on hover). Top bar keeps search as icon button that expands.

### 2.3 Mobile (<768px)
- No sidebar. **Bottom tab bar** (64px, white, top border, safe-area padding): Home, Transactions, **centre FAB (lime circle, `Plus`)**, Students, More.
- FAB opens a **bottom sheet** "Quick actions": Deposit / Withdraw / Transfer (3 large tiles with icons).
- "More" sheet: Accounts, Debts, Settings, Logout.
- Header: greeting + avatar left, search icon right. Shell chrome (rounded outer frame) is removed on mobile — full-bleed white screen with `--bg-page` behind cards.

---

## 3. Core component library

Build these once in `src/components/ui/` and refactor all screens to use them. Delete ad-hoc one-off containers afterwards.

1. **Card** — `surface | hero | lime | tint` variants. Header slot (title `h2` + optional action link/button + optional `⋯` menu), body, footer.
2. **StatCard** — label (caption), value (`num`, 28px), delta chip (`▲ 12% vs last month`, green/red tint pill), optional circular arrow button top-right (40px, outlined; hero variant: white circle). Matches "Total Projects / Ended Projects" cards.
3. **Button** — `primary` (green-700 bg, white), `secondary` (white, 1px green border, green text), `ghost`, `danger` (debit-red text on debit-bg), `lime-circle` (48px lime circle with `ArrowUpRight`). Heights 40 / 48. Loading state with spinner replacing label, width preserved.
4. **PillTabs** — segmented control; active = lime-500 bg with `--green-900` text (Siburian "Overview" pill) or green-900 bg with white text (Finnova nav). Use lime for in-page filtering, dark for top-level switching.
5. **Chip/Badge** — 24px high, radius 999, tinted bg + coloured text. Variants: credit, debit, transfer, pending, completed, active, left, hifz, da'wa.
6. **Avatar** — circle, initials fallback on `--green-100`; student photo when available (cropped square from uploader).
7. **TransactionRow** — see §5.3.
8. **Drawer** (right, desktop 440px) / **BottomSheet** (mobile, 92vh max) — shared component with focus trap, ESC close, scrim `rgba(14,26,20,.35)` + 4px backdrop blur, header (title + close), scrollable body, **sticky footer** with primary action.
9. **Field** — label above (caption), input 48px, radius 12, `--bg-subtle` fill, 1px transparent border → `--green-600` on focus with 3px `--green-100` ring. Error text in `--debit`. Helper text muted.
10. **AmountInput** — large centred input (DM Sans 40px) with `₹` prefix, quick-amount chips below (`+500 +1,000 +5,000`). This is the UPI-style entry. Numeric keypad on mobile (`inputMode="decimal"`).
11. **StudentPicker** — combobox with avatar + name + enrollment no. + category chip, keyboard-navigable, recent students at top.
12. **AccountPicker** — selectable tiles (not dropdown) when ≤6 accounts: each shows account name + current balance; selected = green border + `--green-100` bg + check icon.
13. **EmptyState** — simple Lucide icon in a green-100 circle, one-line title, one-line help, one CTA. No illustrations.
14. **Skeleton** — shimmer on `--bg-muted`. Required for every async container.
15. **Toast** — bottom-centre, dark `--green-900`, white text, success/error icon. Used after every successful drawer submit with "Undo" only where the backend supports it.
16. **DataTable** (desktop only; collapses to list rows on mobile) — sticky header, 56px rows, no vertical lines, 1px horizontal `--border`, hover `--bg-subtle`, row click opens detail drawer.

---

## 4. Screens

### 4.1 Dashboard (Overview)

Desktop grid (12 col, gap 16). Page title "Dashboard", subtitle "Cash position and recent activity."

**Row 1**
- **Hero balance card** (span 7, `hero` variant with `--grad-hero`, white text): label "Total balance across accounts", `display` number, delta chip vs last month, bottom-left three buttons: `Deposit` (lime pill), `Withdraw` (translucent white outline pill), `Transfer` (translucent white outline pill). Top-right white circular arrow → Accounts page. Subtle large faint star/leaf glyph watermark at 6% opacity (Siburian/Donezo reference), no photos.
- **This month card** (span 5, `surface`): two StatCards stacked in one container — Money in (green) and Money out (red) with sparkline-free minimal bars showing proportion (single horizontal bar split in/out). Below: "Net this month" value.

**Row 2**
- **Accounts strip** (span 12): horizontally laid tiles (one per cash account): name, balance, small `↑ in / ↓ out this month` caption. Click → account detail. Max 6 visible, rest scroll with snap. Mobile: swipeable carousel.

**Row 3**
- **Recent transactions** (span 8): last 8 rows (TransactionRow), header action "View all". 
- **Cash flow chart** (span 4, optional): rounded **solid** bars (no hatching) for last 6 months, in = `--green-700`, out = `--green-300`, current month highlighted in `--lime-500`. If the agent judges this adds clutter, it may be replaced by "Students needing attention" (see below) — pick one, not both.

Optional only if data already exists: **Students with outstanding/negative balances** list (top 5). Do not add new backend calls.

Removed from current dashboard: any card not mapped above (temporary monitoring widgets get moved to the Students page as a filter/view, see §4.4).

### 4.2 Transactions (central ledger)

- Header: title, `PillTabs` (All · Deposits · Withdrawals · Transfers), right: `Export` ghost button, `Filters` button (opens filter drawer; shows count badge when active).
- Below header: **active filter chips row** (removable), then a compact summary strip: `Total in | Total out | Net` for the current filtered set (one container, three inline stats, no individual cards).
- Month navigation: `‹ November 2026 ›` pill control left of the tabs (month-wise view). 
- Body: **grouped by date** ("Today", "Yesterday", "03 Nov 2026") with a daily net on the group header right side. Desktop = DataTable with columns: Date · Description/Purpose · Student · Account · Type chip · Amount (right aligned, signed, coloured). Mobile = TransactionRow list.
- Row click → **Transaction detail drawer** (read-only summary, receipt-style layout, with whatever existing edit/delete actions already exist as ghost/danger buttons at the bottom).
- Pagination: keep existing mechanism; style as "Load more" pill, not numbered pagination, unless the backend is page-based (then centred minimal pager).

### 4.3 Accounts

- Page = grid of **Account cards** (3 per row desktop, 1 mobile). Card: account name, holder/purpose caption, balance (`num` 28px), in/out for the month, `Deposit` / `Withdraw` small buttons. One card (the primary/central account) uses the **hero** variant; others `surface`. 
- Account detail page: hero header (balance + actions), then the same transaction list component scoped to the account (reuse §4.2 list, don't rebuild).

### 4.4 Students

- Header: title, search (inline, not the global one), `PillTabs` for state (Active · Completed · Left), secondary filter chips for category (All · Da'wa · Hifz), `+ Add student` primary button (opens drawer).
- Desktop: DataTable — Avatar+Name · Enrollment No. · Category chip · Class · Balance (signed/coloured) · State chip · row chevron. Mobile: list rows with avatar, name, enrollment no., balance on the right.
- Optional view toggle (`List | Monitor`) in the header. **Monitor** = the existing temporary dashboard for classes/students, restyled as grouped lists per class using the same row component (no bespoke widgets).
- Batch operations: checkbox column appears only after clicking "Select"; a floating **action bar** (dark green pill, bottom-centre) shows count + batch actions.

### 4.5 Student account (individual)

Layout modelled on Peoplexio's profile tile + Siburian's balance card:
- **Left column (span 4):** Profile card — large avatar (cropper-edited), name, enrollment no., category + state chips, phone / parent phone / WhatsApp as icon rows with tap-to-call/WhatsApp actions, `Edit profile` secondary button.
- **Right column (span 8):**
  1. Balance card (`hero` variant): student balance, delta, buttons `Deposit` / `Withdraw`.
  2. Transactions card: month `PillTabs`/navigator + TransactionRows for this student only, with monthly totals in the header.
- Mobile: stacked — compact profile header, balance hero, transactions.

### 4.6 Internal transfer

Not a page. It is a **drawer** (see §5.2) launched from Dashboard hero, Accounts, and the FAB. Keep any existing route as a redirect that opens the drawer over Transactions.

### 4.7 Debts (external)

Same list pattern as Transactions: summary strip (`Owed to us | We owe | Net`), list rows with party name, amount, due/created date, status chip (Open / Partially paid / Settled). Row click → detail drawer with `Record payment` action (reuses the Deposit/Withdraw drawer pattern).

### 4.8 Login / Auth

Centered white card (max 400px) on `--bg-page`, logo, h1, two fields, one primary button. No illustration, no split-screen.

---

## 5. Drawers (the heart of the UX)

All drawers share: header (title + subtitle + close), body with generous 20px padding, sticky footer with full-width primary button + secondary "Cancel". Submit button label states the action and amount: **"Deposit ₹5,000"**. Disabled until valid. After success: close, toast, and update lists optimistically if the existing data layer supports it; otherwise refetch.

### 5.1 Deposit / Withdraw drawer
Order of fields (top → bottom):
1. Type switch at top: `PillTabs` Deposit | Withdraw (lets the user flip without closing). Withdraw tints the primary button to `--debit`-toned dark red text-on-light? **No** — keep primary green for both; only the amount sign colour and header chip change. Consistency beats colour-coding the button.
2. **AmountInput** (hero of the drawer).
3. **AccountPicker** tiles.
4. **StudentPicker** (optional/required per existing business rule — keep current validation).
5. Purpose (text field + recent-purpose chips from templates; the existing "Templates" feature surfaces here as chips).
6. Date (default today, compact date pill with calendar popover).
7. Optional note.
Withdrawals: show live "Balance after: ₹X" line under AccountPicker; turn `--debit` if it would go negative (follow existing rule on whether negatives are blocked).

### 5.2 Transfer drawer
`From` AccountPicker tile → centered circular swap button (`ArrowDownUp`) → `To` AccountPicker tile. Amount input, purpose, date. Live preview card: `From balance after` / `To balance after`. Disable if From = To.

### 5.3 TransactionRow anatomy (shared by every list)
`[40px circular icon: ArrowDownLeft green-100 (credit) / ArrowUpRight debit-bg (debit) / ArrowLeftRight info-bg (transfer)] [primary: purpose, body-strong; secondary: student name · account · time, caption muted] [right: signed amount num, coloured; below: date caption]`. Height 64. Hover bg `--bg-subtle`. Pending/needs-attention rows use the Siburian highlighted pattern: `--warn-bg` fill, warn border, inline ✓ / ✕ icon buttons.

### 5.4 Other drawers
Add/Edit student (with crop+zoom uploader in a nested modal, circular mask preview), Filters (date range, account, type, student, category, state — apply/reset footer), Transaction detail, Batch actions confirmation. Destructive confirms use a small centred modal, not a drawer.

---

## 6. Responsiveness matrix

| Breakpoint | Shell | Nav | Dashboard grid | Tables |
|---|---|---|---|---|
| ≥1200 | framed 28px shell | 248px sidebar | 12-col as spec | DataTable |
| 768–1199 | framed shell | 72px icon rail | hero 12, month 12, accounts 12, recent 12, chart hidden | DataTable (hide Account col) |
| <768 | full-bleed | bottom tab bar + FAB | single column, hero first | list rows only |

Touch targets ≥44px. Drawers → bottom sheets <768. Test at 360, 390, 768, 1024, 1280, 1440.

---

## 7. States & feedback (no screen ships without these)

- **Loading:** skeletons shaped like final content (no spinners except buttons).
- **Empty:** EmptyState with CTA ("No transactions this month — Add deposit").
- **Error:** inline card with retry; never raw error text.
- **Success:** toast + row highlight flash (`--lime-100` fade 1.2s) for newly added transactions.
- **Validation:** inline under field, on blur + on submit.
- **Offline/slow:** disable submit, show muted "Reconnecting…" top banner.

---

## 8. Accessibility

- Contrast ≥4.5:1 for body text; `--text-faint` only for non-essential meta.
- Visible focus ring on everything (`outline: 2px solid var(--green-600); outline-offset: 2px`).
- Drawers: `role="dialog"`, `aria-modal`, focus trap, return focus on close.
- Amounts announced as "plus 5,000 rupees" via `aria-label` on rows.
- Never convey credit/debit by colour alone (sign + icon).

---

## 9. What to delete / simplify in the current UI

Agent must audit existing screens and:
1. Remove every container that duplicates data already shown elsewhere on the same screen.
2. Replace multiple small stat cards with the hero card + one "This month" card.
3. Replace any dropdown for ≤6 accounts with AccountPicker tiles.
4. Replace full-page forms for deposit/withdraw/transfer with drawers.
5. Replace nested borders/boxes-in-boxes with spacing and one card level.
6. Remove any custom colours, gradients or shadows not in §1.

---

## 10. Implementation order (ship in this sequence, each step must leave the app working)

1. **Tokens + fonts + global reset** (`_tokens.scss`, base typography).
2. **UI primitives:** Button, Card, Chip, Avatar, Field, PillTabs, Skeleton, Toast, EmptyState.
3. **App shell:** sidebar / icon rail / bottom nav, top bar, responsive layout wrapper.
4. **Drawer + BottomSheet**, then AmountInput, AccountPicker, StudentPicker.
5. **Deposit/Withdraw drawer → Transfer drawer** (wire to existing API calls unchanged).
6. **TransactionRow + DataTable**, then **Transactions page**.
7. **Dashboard.**
8. **Students list → Student account page → Add/Edit student drawer.**
9. **Accounts, Debts, Login, Settings.**
10. **Polish pass:** motion, skeletons, empty/error states, a11y audit, cross-breakpoint QA.

---

## 11. Acceptance checklist

- [ ] No hex colours outside `_tokens.scss`.
- [ ] Only DM Sans + Inter loaded.
- [ ] Every money value uses tabular numerals, `en-IN` formatting, signed for movements.
- [ ] Deposit, Withdraw, Transfer reachable in ≤1 tap from Dashboard, Student page and mobile FAB.
- [ ] No screen has more than 5 top-level containers at desktop width.
- [ ] No horizontal scroll at 360px.
- [ ] Every async container has loading, empty and error states.
- [ ] All existing features (filters, templates, batch ops, student states, month/student views, image crop) still function.
- [ ] Lighthouse accessibility ≥ 95 on Dashboard and Transactions.
- [ ] No backend, API or routing contract changed.
