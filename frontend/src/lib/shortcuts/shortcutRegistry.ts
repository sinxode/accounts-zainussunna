import { 
  type ShortcutDefinition, 
  detectIsMac, 
  formatKeyForDisplay,
  type ShortcutUserConfig 
} from './shortcutTypes';
import { shortcutStorage } from './shortcutStorage';

export const DEFAULT_SHORTCUTS: ShortcutDefinition[] = [
  // Global
  {
    id: 'global.command',
    category: 'global',
    label: 'Command Palette & Search',
    description: 'Quick search students, accounts, and run actions',
    defaultKeys: ['Meta', 'k'],
    actionId: 'open_command_palette'
  },
  {
    id: 'global.shortcuts',
    category: 'global',
    label: 'Keyboard Shortcuts Help',
    description: 'Open shortcut reference guide and cheatsheet',
    defaultKeys: ['Meta', '/'],
    actionId: 'open_shortcut_reference'
  },
  {
    id: 'global.settings',
    category: 'global',
    label: 'Open Settings',
    description: 'Navigate to system settings and ledger preferences',
    defaultKeys: ['Meta', ','],
    actionId: 'open_settings'
  },
  {
    id: 'global.escape',
    category: 'global',
    label: 'Close Active Overlay',
    description: 'Dismiss topmost active modal, drawer, or palette',
    defaultKeys: ['Escape'],
    actionId: 'close_topmost_overlay',
    reserved: true
  },

  // Navigation (Two-key sequences)
  {
    id: 'nav.dashboard',
    category: 'navigation',
    label: 'Go to Dashboard',
    description: 'Navigate to Ledger Overview and Cash Position',
    defaultKeys: ['g', 'd'],
    isSequence: true,
    actionId: 'nav_dashboard'
  },
  {
    id: 'nav.students',
    category: 'navigation',
    label: 'Go to Students',
    description: 'Open Student Ledger accounts register',
    defaultKeys: ['g', 's'],
    isSequence: true,
    actionId: 'nav_students'
  },
  {
    id: 'nav.transactions',
    category: 'navigation',
    label: 'Go to Transactions',
    description: 'Open Transactions Explorer and audit log',
    defaultKeys: ['g', 't'],
    isSequence: true,
    actionId: 'nav_transactions'
  },
  {
    id: 'nav.reports',
    category: 'navigation',
    label: 'Go to Reports Hub',
    description: 'Open Financial Reports and Reconciliation Hub',
    defaultKeys: ['g', 'r'],
    isSequence: true,
    actionId: 'nav_reports',
    allowedRoles: ['super_admin', 'admin', 'faculty', 'owner', 'manager', 'staff']
  },
  {
    id: 'nav.operations',
    category: 'navigation',
    label: 'Go to Operations Center',
    description: 'Open Cashbook Operations and money movement center',
    defaultKeys: ['g', 'o'],
    isSequence: true,
    actionId: 'nav_operations',
    allowedRoles: ['super_admin', 'admin', 'owner', 'manager']
  },
  {
    id: 'nav.audit',
    category: 'navigation',
    label: 'Go to Audit Center',
    description: 'Open system audit logs and data integrity trail',
    defaultKeys: ['g', 'a'],
    isSequence: true,
    actionId: 'nav_audit',
    allowedRoles: ['super_admin', 'owner', 'admin']
  },

  // Operations (Safe financial workflow launchers - NEVER auto-posts)
  {
    id: 'op.deposit',
    category: 'operations',
    label: 'New Deposit Workflow',
    description: 'Open Record Deposit drawer with balance preview',
    defaultKeys: ['Meta', 'Shift', 'd'],
    actionId: 'open_deposit_drawer',
    safeFinancial: true,
    allowedRoles: ['super_admin', 'admin', 'owner', 'manager']
  },
  {
    id: 'op.withdrawal',
    category: 'operations',
    label: 'New Withdrawal Workflow',
    description: 'Open Record Withdrawal drawer with balance preview',
    defaultKeys: ['Meta', 'Shift', 'w'],
    actionId: 'open_withdrawal_drawer',
    safeFinancial: true,
    allowedRoles: ['super_admin', 'admin', 'owner', 'manager']
  },
  {
    id: 'op.transfer',
    category: 'operations',
    label: 'Internal Transfer Workflow',
    description: 'Open Transfer drawer between cash accounts',
    defaultKeys: ['Meta', 'Shift', 't'],
    actionId: 'open_transfer_drawer',
    safeFinancial: true,
    allowedRoles: ['super_admin', 'admin', 'owner', 'manager']
  },

  // Lists & Interface
  {
    id: 'list.search',
    category: 'lists',
    label: 'Focus Page Search',
    description: 'Focus current search filter on students or transactions',
    defaultKeys: ['Meta', 'Shift', 'f'],
    actionId: 'focus_page_search'
  },
  {
    id: 'list.refresh',
    category: 'lists',
    label: 'Refresh Ledger Data',
    description: 'Reload and synchronize active tables and cache',
    defaultKeys: ['Meta', 'Shift', 'r'],
    actionId: 'refresh_active_query'
  }
];

export const RESERVED_BROWSER_SHORTCUTS = [
  'Meta+w', 'Control+w', // Close window/tab
  'Meta+q', 'Control+q', // Quit
  'Meta+n', 'Control+n', // New window
  'Meta+t', 'Control+t', // New tab
  'Meta+p', 'Control+p', // Print
  'Meta+r', 'Control+r', // Hard reload
  'Meta+l', 'Control+l', // Address bar
  'F5', 'F12'            // Reload / DevTools
];

export class ShortcutRegistry {
  private static userConfig: ShortcutUserConfig = shortcutStorage.get();

  public static reloadConfig() {
    this.userConfig = shortcutStorage.get();
  }

  public static isEnabled(): boolean {
    return this.userConfig.enabled;
  }

  public static getAllShortcuts(role?: string): ShortcutDefinition[] {
    const config = this.userConfig;
    return DEFAULT_SHORTCUTS.filter(s => {
      if (!s.allowedRoles || !role) return true;
      return s.allowedRoles.includes(role);
    }).map(s => {
      const custom = config.customBindings[s.id];
      return {
        ...s,
        customKeys: custom || s.defaultKeys
      };
    });
  }

  public static getShortcutById(id: string): ShortcutDefinition | undefined {
    const all = this.getAllShortcuts();
    return all.find(s => s.id === id);
  }

  public static getKeysForShortcut(shortcut: ShortcutDefinition): string[] {
    return shortcut.customKeys || shortcut.defaultKeys;
  }

  public static getDisplayKeys(shortcut: ShortcutDefinition, isMac?: boolean): string[] {
    const mac = isMac !== undefined ? isMac : detectIsMac();
    const keys = this.getKeysForShortcut(shortcut);
    return keys.map(k => formatKeyForDisplay(k, mac));
  }

  public static detectConflict(
    targetShortcutId: string, 
    newKeys: string[], 
    isSequence?: boolean
  ): { hasConflict: boolean; conflictingWith?: string; isBrowserReserved?: boolean } {
    const keyString = newKeys.join('+').toLowerCase();

    // 1. Check browser/system reserved
    for (const reserved of RESERVED_BROWSER_SHORTCUTS) {
      if (reserved.toLowerCase() === keyString) {
        return { hasConflict: true, isBrowserReserved: true };
      }
    }

    // 2. Check collisions with other shortcuts
    const all = this.getAllShortcuts();
    for (const other of all) {
      if (other.id === targetShortcutId) continue;
      if (Boolean(other.isSequence) !== Boolean(isSequence)) continue;

      const otherKeys = (other.customKeys || other.defaultKeys).join('+').toLowerCase();
      if (otherKeys === keyString) {
        return { hasConflict: true, conflictingWith: other.label };
      }
    }

    return { hasConflict: false };
  }
}
