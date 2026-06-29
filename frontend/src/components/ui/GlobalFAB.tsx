import React, { useState } from 'react';
import { 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  HandCoins, 
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOperationsDrawer } from '../operations/drawers/OperationsDrawerContext';
import styles from './GlobalFAB.module.scss';
import { clsx } from 'clsx';

export const GlobalFAB: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { openDrawer } = useOperationsDrawer();

  const actions = [
    { id: 'deposit', label: 'Deposit', icon: <ArrowDownLeft size={20} />, variant: 'success' },
    { id: 'withdrawal', label: 'Withdrawal', icon: <ArrowUpRight size={20} />, variant: 'danger' },
    { id: 'internal', label: 'Transfer', icon: <ArrowUpRight size={20} />, variant: 'primary' },
    { id: 'external', label: 'Loan', icon: <HandCoins size={20} />, variant: 'warning' },
    { id: 'bulk', label: 'Bulk Operation', icon: <Package size={20} />, variant: 'info' }
  ];

  return (
    <div className={styles.wrapper} onMouseLeave={() => setIsOpen(false)}>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className={styles.menu}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
          >
            {actions.map((action, i) => (
              <motion.button
                key={action.id}
                className={clsx(styles.actionBtn, styles[action.variant])}
                onClick={() => {
                  openDrawer(action.id as any);
                  setIsOpen(false);
                }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <span className={styles.label}>{action.label}</span>
                <div className={styles.icon}>{action.icon}</div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        className={clsx(styles.trigger, isOpen && styles.active)}
        onClick={() => setIsOpen(!isOpen)}
        title="Quick Operations"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Plus size={28} />
        </motion.div>
      </button>
    </div>
  );
};
