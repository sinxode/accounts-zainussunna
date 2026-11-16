import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Keyboard, 
  Search, 
  X, 
  Settings as SettingsIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../../store/useUIStore';
import { useAuth } from '../../contexts/AuthContext';
import { ShortcutRegistry } from '../../lib/shortcuts/shortcutRegistry';
import type { ShortcutCategory } from '../../lib/shortcuts/shortcutTypes';
import { KeyBadge } from './KeyBadge';
import { clsx } from 'clsx';
import styles from './ShortcutReferenceModal.module.scss';

export const ShortcutReferenceModal: React.FC = () => {
  const { isShortcutReferenceOpen, setShortcutReferenceOpen } = useUIStore();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | ShortcutCategory>('all');

  const allShortcuts = useMemo(() => {
    return ShortcutRegistry.getAllShortcuts(profile?.role);
  }, [profile?.role]);

  const filteredShortcuts = useMemo(() => {
    let list = allShortcuts;
    if (activeTab !== 'all') {
      list = list.filter(s => s.category === activeTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => 
        s.label.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        (s.customKeys || s.defaultKeys).join(' ').toLowerCase().includes(q)
      );
    }
    return list;
  }, [allShortcuts, activeTab, search]);

  const groupedShortcuts = useMemo(() => {
    const groups: Record<string, typeof filteredShortcuts> = {};
    for (const s of filteredShortcuts) {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push(s);
    }
    return groups;
  }, [filteredShortcuts]);

  if (!isShortcutReferenceOpen) return null;

  const handleClose = () => {
    setShortcutReferenceOpen(false);
    setSearch('');
  };

  const handleGoToSettings = () => {
    handleClose();
    navigate('/settings');
  };

  const categoryTitles: Record<string, string> = {
    global: 'Global Controls',
    navigation: 'Navigation Sequences',
    operations: 'Cashbook Workflows (Safe)',
    lists: 'Lists & Search Filters',
    interface: 'Interface & Dialogs'
  };

  return (
    <AnimatePresence>
      <div className={styles.backdrop} onClick={handleClose}>
        <motion.div 
          className={styles.modal}
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.titleGroup}>
              <div className={styles.iconWrap}>
                <Keyboard size={18} />
              </div>
              <h2 className={styles.title}>Keyboard Shortcuts</h2>
            </div>
            <button 
              type="button" 
              className={styles.closeBtn} 
              onClick={handleClose} 
              aria-label="Close shortcuts dialog"
            >
              <X size={16} />
            </button>
          </div>

          {/* Search Bar */}
          <div className={styles.searchBar}>
            <Search size={16} className={styles.searchIcon} />
            <input 
              autoFocus
              type="text"
              placeholder="Search shortcuts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Category Tabs */}
          <div className={styles.filterTabs}>
            <button 
              type="button"
              className={clsx(styles.tabBtn, activeTab === 'all' && styles.active)}
              onClick={() => setActiveTab('all')}
            >
              All Shortcuts
            </button>
            <button 
              type="button"
              className={clsx(styles.tabBtn, activeTab === 'global' && styles.active)}
              onClick={() => setActiveTab('global')}
            >
              Global
            </button>
            <button 
              type="button"
              className={clsx(styles.tabBtn, activeTab === 'navigation' && styles.active)}
              onClick={() => setActiveTab('navigation')}
            >
              Navigation
            </button>
            <button 
              type="button"
              className={clsx(styles.tabBtn, activeTab === 'operations' && styles.active)}
              onClick={() => setActiveTab('operations')}
            >
              Financial Workflows
            </button>
            <button 
              type="button"
              className={clsx(styles.tabBtn, activeTab === 'lists' && styles.active)}
              onClick={() => setActiveTab('lists')}
            >
              Lists & Search
            </button>
          </div>

          {/* Content */}
          <div className={styles.content}>
            {Object.keys(groupedShortcuts).length === 0 ? (
              <div className={styles.emptyState}>
                <p>No keyboard shortcuts matching "{search}"</p>
              </div>
            ) : (
              Object.entries(groupedShortcuts).map(([cat, list]) => (
                <div key={cat} className={styles.categoryGroup}>
                  <div className={styles.categoryTitle}>
                    {categoryTitles[cat] || cat}
                  </div>
                  {list.map(s => (
                    <div key={s.id} className={styles.shortcutRow}>
                      <div className={styles.shortcutMeta}>
                        <span className={styles.shortcutLabel}>{s.label}</span>
                        <span className={styles.shortcutDesc}>{s.description}</span>
                      </div>
                      <KeyBadge shortcut={s} size="md" />
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <button 
              type="button" 
              className={styles.settingsLink} 
              onClick={handleGoToSettings}
            >
              <SettingsIcon size={14} />
              <span>Customize in Settings</span>
            </button>
            <div className={styles.hintEsc}>
              <KeyBadge keys={['Esc']} size="sm" />
              <span>to dismiss</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
