# ZLS Keyboard Shortcut Architecture & Implementation Plan 1.0

## Executive Overview
The Zainussunna Ledger System (ZLS) requires a desktop-class keyboard shortcut system modeled after tools like VS Code, Linear, and Notion. The system provides instantaneous navigation, workflow initiation, and interface control without compromising financial safeguards, accessibility, or clean UI layout.

---

## 1. Core Architectural Principles
1. **Centralized Single Source of Truth**:
   A single registry (`shortcutRegistry.ts`) defines all shortcuts, actions, default bindings, platform formatting, permission requirements, and safety constraints. UI hints, command palette badges, settings panels, and the reference dialog all draw directly from this registry.
2. **Financial Safety First (No Auto-Posting)**:
   Financial operations (`deposit`, `withdrawal`, `internal_transfer`) open the respective drawer with interactive inputs, live balance preview, and human confirmation. No shortcut ever commits or posts a ledger transaction directly.
3. **Context-Aware Event Filtering**:
   Keystrokes occurring within editable inputs (`<input>`, `<textarea>`, `<select>`, `[contenteditable="true"]`) do NOT trigger single-key or navigation sequences. Only escape or designated system combinations are captured.
4. **Topmost Modal & Overlay Dismissal**:
   `Escape` closes the topmost active surface in strict priority order (Confirmation Modal → Shortcut Reference Dialog → Command Palette → Notification Drawer → Operation Drawer → Input focus blur), preventing cascading closures.
5. **Two-Key Navigation Sequences (`G then Key`)**:
   Navigation uses sequences (`G → D`, `G → S`, `G → T`, `G → R`, `G → O`, `G → A`) with a 1200ms timeout and cancellation on `Escape` or unmatched keys. A subtle floating indicator gives feedback during pending sequences.
6. **Platform-Aware Display & Execution**:
   Automatically detects macOS vs. Windows/Linux. On macOS, displays symbols `⌘`, `⇧`, `⌥`, `↵` and binds to `e.metaKey`. On Windows/Linux, displays `Ctrl`, `Shift`, `Alt`, `Enter` and binds to `e.ctrlKey`.
7. **Zero New Routes**:
   No standalone `/shortcuts` route or page is created. Shortcuts are integrated into:
   - Existing `Header` (search pill + `?` shortcut reference trigger).
   - Existing `CommandPalette` (shortcut hints on actions).
   - Existing `UserMenu` (`⌘ ,` on Settings, `⌘ /` on Shortcuts).
   - Existing `GlobalSettings` and `UserProfile` (Preferences → Keyboard Shortcuts section).
   - Compact reference modal dialog.

---

## 2. Proposed Shortcut Matrix

| ID | Category | Action | Mac Binding | Win/Linux Binding | Role Guard | Safety Type |
|---|---|---|---|---|---|---|
| `global.command` | Global | Open Command Palette / Search | `⌘ K` | `Ctrl + K` | All | Safe UI |
| `global.shortcuts` | Global | Open Shortcut Reference Dialog | `⌘ /` | `Ctrl + /` | All | Safe UI |
| `global.settings` | Global | Open Settings | `⌘ ,` | `Ctrl + ,` | Admin/Staff | Safe UI |
| `global.escape` | Global | Close active overlay / dismiss | `Esc` | `Esc` | All | Safe UI |
| `nav.dashboard` | Navigation | Go to Dashboard | `G` then `D` | `G` then `D` | All | Navigation |
| `nav.students` | Navigation | Go to Students Ledger | `G` then `S` | `G` then `S` | All | Navigation |
| `nav.transactions` | Navigation | Go to Transactions Explorer | `G` then `T` | `G` then `T` | All | Navigation |
| `nav.reports` | Navigation | Go to Reports & Audit Hub | `G` then `R` | `G` then `R` | Staff/Admin | Navigation |
| `nav.operations` | Navigation | Go to Operations Center | `G` then `O` | `G` then `O` | Manager/Admin | Navigation |
| `nav.audit` | Navigation | Go to Audit Center / Activity | `G` then `A` | `G` then `A` | Admin/Owner | Navigation |
| `op.deposit` | Operations | Open Deposit Drawer | `⌘ ⇧ D` | `Ctrl + Shift + D` | Manager/Admin | Workflow Launcher |
| `op.withdrawal` | Operations | Open Withdrawal Drawer | `⌘ ⇧ W` | `Ctrl + Shift + W` | Manager/Admin | Workflow Launcher |
| `op.transfer` | Operations | Open Transfer Drawer | `⌘ ⇧ T` | `Ctrl + Shift + T` | Manager/Admin | Workflow Launcher |
| `list.search` | Lists | Focus Page Search Input | `⌘ ⇧ F` | `Ctrl + Shift + F` | All | Safe Focus |
| `list.refresh` | Lists | Invalidate & Refresh Data | `⌘ ⇧ R` | `Ctrl + Shift + R` | All | Safe Refresh |

---

## 3. Directory & File Plan

- `frontend/src/lib/shortcuts/shortcutTypes.ts`: Type definitions, categories, and platform detection.
- `frontend/src/lib/shortcuts/shortcutRegistry.ts`: Static registry, default shortcuts, conflict checking, and OS badge generation.
- `frontend/src/lib/shortcuts/shortcutStorage.ts`: Local storage persistence for user customized bindings & enable/disable preference.
- `frontend/src/components/ui/KeyBadge.tsx` & `.module.scss`: Visual `<kbd>` cap badge matching ZLS design system tokens.
- `frontend/src/components/ui/ShortcutReferenceModal.tsx` & `.module.scss`: Polished searchable modal dialog.
- `frontend/src/components/ui/SequenceIndicator.tsx` & `.module.scss`: Bottom-floating sequence pill (`G → ...`).
- `frontend/src/components/settings/KeyboardShortcutsSettings.tsx` & `.module.scss`: Inline preferences section with toggle, conflict detector, customization, and reset.
- `frontend/src/hooks/useKeyboardShortcuts.ts`: Centralized keyboard listener with context filtering and overlay priority.
- Integration updates:
  - `Header.tsx`: Search pill key badge + `?` shortcut reference trigger.
  - `CommandPalette.tsx`: Key badges next to quick actions and navigation items.
  - `UserMenu.tsx`: Key badges on Settings and Shortcuts menu items.
  - `GlobalSettings.tsx` & `UserProfile.tsx`: Embedded shortcut preferences component.
  - `AppLayout.tsx`: Mounts `ShortcutReferenceModal` and `SequenceIndicator`.
