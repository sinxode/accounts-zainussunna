import React, { useState } from 'react';
import { Plus, IndianRupee, Wallet, Download } from 'lucide-react';
import { clsx } from 'clsx';
import styles from '../../pages/transfers/InternalTransfers.module.scss';

interface FloatingActionsProps {
  onAction?: (actionId: string) => void;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({ onAction }) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { id: 'export', label: 'Export', icon: Download },
    { id: 'outstanding', label: 'Outstanding Center', icon: Wallet },
    { id: 'repayment', label: 'Record Repayment', icon: IndianRupee },
    { id: 'transfer', label: 'New Transfer', icon: Plus },
  ];

  return (
    <div className={styles.fabContainer}>
      <div className={clsx(styles.fabMenu, isOpen && styles.open)}>
        {actions.map(action => {
          const Icon = action.icon;
          return (
            <button 
              key={action.id} 
              className={styles.fabItem}
              onClick={() => {
                onAction?.(action.id);
                setIsOpen(false);
              }}
            >
              <span className={styles.fabLabel}>{action.label}</span>
              <div className={styles.fabIcon}>
                <Icon size={18} />
              </div>
            </button>
          );
        })}
      </div>
      
      <button 
        className={clsx(styles.fabMain, isOpen && styles.open)}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Plus size={24} />
      </button>
    </div>
  );
};
