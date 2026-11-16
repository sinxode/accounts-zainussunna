import type { ShortcutUserConfig } from './shortcutTypes';

const STORAGE_KEY = 'zls_keyboard_shortcuts_config';

const DEFAULT_CONFIG: ShortcutUserConfig = {
  enabled: true,
  customBindings: {}
};

export const shortcutStorage = {
  get(): ShortcutUserConfig {
    if (typeof window === 'undefined') return DEFAULT_CONFIG;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return DEFAULT_CONFIG;
      const parsed = JSON.parse(data);
      return {
        enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : true,
        customBindings: parsed.customBindings || {}
      };
    } catch {
      return DEFAULT_CONFIG;
    }
  },

  save(config: ShortcutUserConfig): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      // Dispatch storage event so other tabs/components sync
      window.dispatchEvent(new CustomEvent('zls_shortcut_config_changed', { detail: config }));
    } catch (e) {
      console.error('Failed to save shortcut config to localStorage:', e);
    }
  },

  setEnabled(enabled: boolean): void {
    const current = this.get();
    this.save({ ...current, enabled });
  },

  setBinding(shortcutId: string, keys: string[]): void {
    const current = this.get();
    this.save({
      ...current,
      customBindings: {
        ...current.customBindings,
        [shortcutId]: keys
      }
    });
  },

  removeBinding(shortcutId: string): void {
    const current = this.get();
    const updated = { ...current.customBindings };
    delete updated[shortcutId];
    this.save({
      ...current,
      customBindings: updated
    });
  },

  reset(): void {
    this.save(DEFAULT_CONFIG);
  }
};
