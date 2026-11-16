import React, { useState, useEffect } from 'react';
import { 
  Keyboard, 
  RotateCcw, 
  Laptop, 
  AlertTriangle
} from 'lucide-react';
import { Card } from '../ui/Card';
import { KeyBadge } from '../ui/KeyBadge';
import { shortcutStorage } from '../../lib/shortcuts/shortcutStorage';
import { ShortcutRegistry } from '../../lib/shortcuts/shortcutRegistry';
import { type ShortcutDefinition, detectIsMac } from '../../lib/shortcuts/shortcutTypes';
import toast from 'react-hot-toast';
import styles from './KeyboardShortcutsSettings.module.scss';

export const KeyboardShortcutsSettings: React.FC = () => {
  const isMac = detectIsMac();
  const [config, setConfig] = useState(shortcutStorage.get());
  const [shortcuts, setShortcuts] = useState<ShortcutDefinition[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      ShortcutRegistry.reloadConfig();
      setConfig(shortcutStorage.get());
      setShortcuts(ShortcutRegistry.getAllShortcuts());
    };
    refresh();

    window.addEventListener('zls_shortcut_config_changed', refresh);
    return () => window.removeEventListener('zls_shortcut_config_changed', refresh);
  }, []);

  const handleToggleEnabled = (e: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = e.target.checked;
    shortcutStorage.setEnabled(enabled);
    setConfig(prev => ({ ...prev, enabled }));
    ShortcutRegistry.reloadConfig();
    toast.success(enabled ? 'Keyboard shortcuts enabled' : 'Keyboard shortcuts disabled');
  };

  const handleResetAll = () => {
    shortcutStorage.reset();
    ShortcutRegistry.reloadConfig();
    setConfig(shortcutStorage.get());
    setShortcuts(ShortcutRegistry.getAllShortcuts());
    setEditingId(null);
    setConflictWarning(null);
    toast.success('Shortcuts restored to defaults');
  };

  const handleResetSingle = (id: string) => {
    shortcutStorage.removeBinding(id);
    ShortcutRegistry.reloadConfig();
    setConfig(shortcutStorage.get());
    setShortcuts(ShortcutRegistry.getAllShortcuts());
    toast.success('Shortcut reset to default');
  };

  // Keyboard capture for custom assignment
  useEffect(() => {
    if (!editingId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setEditingId(null);
        setConflictWarning(null);
        return;
      }

      // We need at least a modifier or two keys
      const keys: string[] = [];
      if (e.metaKey) keys.push('Meta');
      if (e.ctrlKey) keys.push('Control');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey) keys.push('Shift');

      const regularKey = e.key;
      if (!['Meta', 'Control', 'Alt', 'Shift'].includes(regularKey)) {
        keys.push(regularKey.toLowerCase());
      }

      // Only save if we have a non-modifier key pressed
      if (keys.length > 0 && !['Meta', 'Control', 'Alt', 'Shift'].includes(regularKey)) {
        const conflict = ShortcutRegistry.detectConflict(editingId, keys);
        if (conflict.hasConflict) {
          if (conflict.isBrowserReserved) {
            setConflictWarning('That shortcut combination is reserved by the web browser or OS.');
          } else {
            setConflictWarning(`Conflict detected: already assigned to "${conflict.conflictingWith}".`);
          }
          return;
        }

        // Save valid binding
        shortcutStorage.setBinding(editingId, keys);
        ShortcutRegistry.reloadConfig();
        setConfig(shortcutStorage.get());
        setShortcuts(ShortcutRegistry.getAllShortcuts());
        setEditingId(null);
        setConflictWarning(null);
        toast.success('Custom shortcut saved');
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [editingId]);

  return (
    <Card className={styles.cardWrapper} padding="lg">
      <div className={styles.topRow}>
        <div className={styles.headerMeta}>
          <div className={styles.iconBadge}>
            <Keyboard size={20} />
          </div>
          <div>
            <h3 className={styles.title}>Keyboard Shortcuts</h3>
            <p className={styles.subtitle}>
              Accelerate common workflows and navigation across ZLS with zero accidental transactions.
            </p>
          </div>
        </div>

        <div className={styles.toggleAction}>
          <span className={styles.toggleLabel}>Enable Shortcuts</span>
          <label className={styles.switch}>
            <input 
              type="checkbox" 
              checked={config.enabled} 
              onChange={handleToggleEnabled}
            />
            <span className={styles.slider} />
          </label>
        </div>
      </div>

      <div className={styles.platformBanner}>
        <span className={styles.platformBadge}>
          <Laptop size={15} />
          {isMac ? 'Detected macOS (⌘ Command Modifiers)' : 'Detected Windows/Linux (Ctrl Modifiers)'}
        </span>
        <button 
          type="button" 
          className={styles.resetBtn} 
          onClick={handleResetAll}
        >
          <RotateCcw size={13} />
          <span>Reset All Defaults</span>
        </button>
      </div>

      {conflictWarning && (
        <div className={styles.conflictAlert}>
          <AlertTriangle size={16} />
          <span>{conflictWarning} Press Esc to cancel or try another combination.</span>
        </div>
      )}

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <span>Action / Workflow</span>
          <span>Shortcut Keys</span>
          <span style={{ textAlign: 'right' }}>Customization</span>
        </div>

        {shortcuts.map(s => {
          const isEditing = editingId === s.id;
          const isCustom = !!config.customBindings[s.id];

          return (
            <div 
              key={s.id} 
              className={`${styles.shortcutItem} ${!config.enabled ? styles.disabledRow : ''}`}
            >
              <div className={styles.itemInfo}>
                <span className={styles.itemLabel}>
                  {s.label}
                  {s.safeFinancial && (
                    <span className={styles.safeBadge}>Safe Workflow</span>
                  )}
                </span>
                <span className={styles.itemDesc}>{s.description}</span>
              </div>

              <div>
                {isEditing ? (
                  <div className={styles.recordingBox}>
                    <span>Press keys... (Esc to cancel)</span>
                  </div>
                ) : (
                  <KeyBadge shortcut={s} size="md" isMac={isMac} />
                )}
              </div>

              <div className={styles.actionsCol}>
                {!s.reserved && !s.isSequence && config.enabled && (
                  <>
                    {isEditing ? (
                      <button 
                        type="button" 
                        className={styles.editBtn} 
                        onClick={() => { setEditingId(null); setConflictWarning(null); }}
                      >
                        Cancel
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        className={styles.editBtn} 
                        onClick={() => { setEditingId(s.id); setConflictWarning(null); }}
                      >
                        Edit
                      </button>
                    )}
                    {isCustom && (
                      <button 
                        type="button" 
                        className={styles.resetSingleBtn} 
                        onClick={() => handleResetSingle(s.id)}
                        title="Reset to default"
                      >
                        Reset
                      </button>
                    )}
                  </>
                )}
                {s.reserved && (
                  <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>System</span>
                )}
                {s.isSequence && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sequence</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
