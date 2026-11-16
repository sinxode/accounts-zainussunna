export type ShortcutCategory = 'global' | 'navigation' | 'operations' | 'lists' | 'interface';

export interface ShortcutDefinition {
  id: string;
  category: ShortcutCategory;
  label: string;
  description: string;
  defaultKeys: string[]; // e.g. ['Meta', 'k'] or ['g', 'd'] or ['Meta', 'Shift', 'd']
  customKeys?: string[];
  isSequence?: boolean;  // e.g. 'g' then 'd'
  actionId: string;
  allowedRoles?: string[];
  safeFinancial?: boolean;
  reserved?: boolean;    // cannot be modified (e.g. Esc)
}

export interface ShortcutUserConfig {
  enabled: boolean;
  customBindings: Record<string, string[]>; // shortcutId -> customKeys
}

export function detectIsMac(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return true;
  return /Mac|iPod|iPhone|iPad/.test(navigator.userAgent || navigator.platform || '');
}

export function formatKeyForDisplay(key: string, isMac: boolean): string {
  const lower = key.toLowerCase();
  if (isMac) {
    if (lower === 'meta' || lower === 'cmd' || lower === 'command') return '⌘';
    if (lower === 'shift') return '⇧';
    if (lower === 'alt' || lower === 'option') return '⌥';
    if (lower === 'control' || lower === 'ctrl') return '⌃';
    if (lower === 'enter' || lower === 'return') return '↵';
    if (lower === 'escape' || lower === 'esc') return 'Esc';
    if (lower === 'backspace') return '⌫';
    if (lower === 'arrowup' || lower === 'up') return '↑';
    if (lower === 'arrowdown' || lower === 'down') return '↓';
    if (lower === 'arrowleft' || lower === 'left') return '←';
    if (lower === 'arrowright' || lower === 'right') return '→';
    if (lower === 'slash' || lower === '/') return '/';
    return key.toUpperCase();
  } else {
    if (lower === 'meta' || lower === 'cmd' || lower === 'command' || lower === 'control' || lower === 'ctrl') return 'Ctrl';
    if (lower === 'shift') return 'Shift';
    if (lower === 'alt' || lower === 'option') return 'Alt';
    if (lower === 'enter' || lower === 'return') return 'Enter';
    if (lower === 'escape' || lower === 'esc') return 'Esc';
    if (lower === 'backspace') return 'Backspace';
    if (lower === 'arrowup' || lower === 'up') return '↑';
    if (lower === 'arrowdown' || lower === 'down') return '↓';
    if (lower === 'arrowleft' || lower === 'left') return '←';
    if (lower === 'arrowright' || lower === 'right') return '→';
    if (lower === 'slash' || lower === '/') return '/';
    return key.toUpperCase();
  }
}
