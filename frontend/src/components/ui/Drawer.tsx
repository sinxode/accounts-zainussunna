import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import styles from './Drawer.module.scss';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  position?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  position = 'right',
  size = 'md'
}) => {
  const variants = {
    left: { x: '-100%' },
    right: { x: '100%' }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.wrapper}>
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={clsx(styles.drawer, styles[position], styles[size])}
            initial={variants[position]}
            animate={{ x: 0 }}
            exit={variants[position]}
            transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
          >
            <div className={styles.header}>
              <div className={styles.headerTitleContainer}>
                <h2 className={styles.title}>{title}</h2>
                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
              </div>
              <button className={styles.closeBtn} onClick={onClose}>
                <X size={24} />
              </button>
            </div>
            <div className={styles.content}>
              {children}
            </div>
            {footer && <div className={styles.footer}>{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
