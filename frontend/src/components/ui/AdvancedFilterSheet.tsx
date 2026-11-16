import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, Check } from 'lucide-react';
import styles from './AdvancedFilterSheet.module.scss';

export interface AdvancedFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
  title?: string;
  appliedCount?: number;
  children: React.ReactNode;
}

export const AdvancedFilterSheet: React.FC<AdvancedFilterSheetProps> = ({
  isOpen,
  onClose,
  onApply,
  onReset,
  title = 'Filter Options',
  appliedCount = 0,
  children,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.overlay} onClick={onClose}>
          <motion.div
            className={styles.sheet}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, x: 280 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 280 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.titleArea}>
                <h3 className={styles.title}>{title}</h3>
                {appliedCount > 0 && (
                  <span className={styles.badge}>{appliedCount} active</span>
                )}
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Close filters"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Body */}
            <div className={styles.body}>{children}</div>

            {/* Sticky Action Footer */}
            <div className={styles.footer}>
              <button
                type="button"
                className={styles.resetBtn}
                onClick={onReset}
                disabled={appliedCount === 0}
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
              <button
                type="button"
                className={styles.applyBtn}
                onClick={() => {
                  onApply();
                  onClose();
                }}
              >
                <Check size={14} />
                <span>Apply Filters</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
