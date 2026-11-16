# ZLS Keyboard Shortcut Quick Reference

This reference documents the 15 active keyboard shortcuts implemented in the Zainussunna Ledger System (ZLS). Every shortcut listed here corresponds to a live registered handler in `ShortcutRegistry`.

---

## 1. Global Shortcuts

| Action | macOS | Windows / Linux | Description |
|---|---|---|---|
| **Command Palette & Search** | `⌘ K` | `Ctrl + K` | Opens global command palette and search dialog |
| **Keyboard Shortcuts Help** | `⌘ /` | `Ctrl + /` | Opens the compact shortcut reference cheatsheet |
| **Open Settings** | `⌘ ,` | `Ctrl + ,` | Navigates to System & Ledger Settings |
| **Close Active Overlay** | `Esc` | `Esc` | Dismisses the topmost modal, drawer, or palette |

---

## 2. Navigation Sequences (Two-Key)

Navigation uses the two-key sequence pattern `G` then `<Key>` with a 1200ms timeout and visual feedback pill.

| Destination | Sequence | Role Guard |
|---|---|---|
| **Dashboard** | `G` then `D` | All Authenticated Staff |
| **Students Register** | `G` then `S` | All Authenticated Staff |
| **Transactions Explorer** | `G` then `T` | All Authenticated Staff |
| **Reports & Audit Hub** | `G` then `R` | Faculty / Staff / Admin |
| **Operations Center** | `G` then `O` | Financial Managers / Admins |
| **Audit Center** | `G` then `A` | System Admins / Owners |

---

## 3. Financial Workflow Launchers (Safe)

> [!IMPORTANT]
> **Financial Safety Guarantee**: These shortcuts open interactive drawers with human review, student search, amount formatting, and explicit confirmation. No shortcut automatically posts a transaction or modifies balances.

| Workflow | macOS | Windows / Linux | Role Required |
|---|---|---|---|
| **Record Deposit Drawer** | `⌘ ⇧ D` | `Ctrl + Shift + D` | Manager / Admin |
| **Record Withdrawal Drawer** | `⌘ ⇧ W` | `Ctrl + Shift + W` | Manager / Admin |
| **Record Internal Transfer Drawer** | `⌘ ⇧ T` | `Ctrl + Shift + T` | Manager / Admin |

---

## 4. Lists & Search Controls

| Action | macOS | Windows / Linux | Description |
|---|---|---|---|
| **Focus Page Search** | `⌘ ⇧ F` | `Ctrl + Shift + F` | Selects the active list/table search input |
| **Refresh Ledger Data** | `⌘ ⇧ R` | `Ctrl + Shift + R` | Invalidates query cache and refreshes data |

---

## 5. UI Discovery Points
1. **Application Header**: Search pill displays `⌘ K`, and the `?` icon button triggers the shortcut cheatsheet (`⌘ /`).
2. **Command Palette**: Key badges appear beside every quick action and navigation item.
3. **User Menu**: `⌘ ,` shown beside Settings; `⌘ /` shown beside Shortcuts.
4. **Settings Interface**: `Preferences → Keyboard Shortcuts` provides toggling, conflict detection, and custom key binding.
