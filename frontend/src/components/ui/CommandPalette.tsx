import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, User, History, Plus, Minus, Layers3, ArrowLeftRight, HandCoins, ArrowLeft } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { globalSearchService } from '../../lib/globalSearchService';
import { useNavigate } from 'react-router-dom';
import styles from './CommandPalette.module.scss';

export const CommandPalette: React.FC = () => {
  const { isCommandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (search.length > 1) {
      globalSearchService.search(search).then(setResults);
    } else {
      setResults([]);
    }
  }, [search]);

  if (!isCommandPaletteOpen) return null;

  const quickOps = [
    { id: 'deposit', name: 'Quick Deposit', icon: <Plus size={16} />, path: '/operations' },
    { id: 'withdrawal', name: 'Quick Withdrawal', icon: <Minus size={16} />, path: '/operations' },
    { id: 'bulk', name: 'New Bulk Operation', icon: <Layers3 size={16} />, path: '/operations' },
    { id: 'transfer', name: 'New Internal Transfer', icon: <ArrowLeftRight size={16} />, path: '/transfers' },
    { id: 'loan', name: 'New External Loan', icon: <HandCoins size={16} />, path: '/borrowers' },
  ];

  const navigations = [
    { name: 'Dashboard', path: '/' },
    { name: 'Operations Center', path: '/operations' },
    { name: 'Students', path: '/students' },
    { name: 'Transactions', path: '/transactions' },
    { name: 'Reports', path: '/reports' },
  ];

  const handleAction = (item: any) => {
    if (item.path) {
      navigate(item.path);
    }
    setCommandPaletteOpen(false);
    setSearch('');
  };

  return (
    <AnimatePresence>
      <div className={styles.wrapper}>
        <motion.div 
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setCommandPaletteOpen(false)}
        />
        <motion.div 
          className={styles.palette}
          initial={{ scale: 0.95, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <div className={styles.header}>
            <button className={styles.backBtn} onClick={() => setCommandPaletteOpen(false)}>
              <ArrowLeft size={20} />
            </button>
            <Search size={20} className={styles.searchIcon} />
            <input 
              autoFocus
              placeholder="Search students, transactions, operations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.input}
            />
            <button className={styles.escMobileClose} onClick={() => setCommandPaletteOpen(false)}>
              Cancel
            </button>
            <div className={styles.esc}>ESC</div>
          </div>

          <div className={styles.content}>
            {search.length <= 1 ? (
              <>
                <div className={styles.section}>
                  <h4 className={styles.sectionTitle}>Quick Actions</h4>
                  <div className={styles.list}>
                    {quickOps.map((op) => (
                      <button key={op.id} className={styles.item} onClick={() => handleAction(op)}>
                        <div className={styles.itemIcon}>{op.icon}</div>
                        <span className={styles.itemName}>{op.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.section}>
                  <h4 className={styles.sectionTitle}>Navigate To</h4>
                  <div className={styles.list}>
                    {navigations.map((nav) => (
                      <button key={nav.path} className={styles.item} onClick={() => handleAction(nav)}>
                        <div className={styles.itemIcon}><ArrowRight size={14} /></div>
                        <span className={styles.itemName}>{nav.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className={styles.section}>
                <h4 className={styles.sectionTitle}>Search Results</h4>
                <div className={styles.list}>
                  {results.length === 0 ? (
                    <div className={styles.noResults}>No matches found for "{search}"</div>
                  ) : (
                    results.map((res) => (
                      <button key={res.id} className={styles.item} onClick={() => handleAction(res)}>
                        <div className={styles.itemIcon}>
                          {res.type === 'Student' && <User size={14} />}
                          {res.type === 'Borrower' && <HandCoins size={14} />}
                          {res.type === 'Transaction' && <History size={14} />}
                        </div>
                        <div className={styles.itemInfo}>
                          <span className={styles.itemName}>{res.title}</span>
                          <span className={styles.itemSub}>{res.sub} — {res.type}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
