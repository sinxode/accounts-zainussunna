import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { useWindowSize } from '../../hooks/useWindowSize';
import styles from './Drawer.module.scss';

export interface DrawerProps {
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
  const { width } = useWindowSize();
  const isMobile = width < 768;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const variants = isMobile
    ? {
        hidden: { y: '100%', opacity: 1 },
        visible: { y: 0, opacity: 1 }
      }
    : {
        hidden: { x: position === 'right' ? '100%' : '-100%', opacity: 1 },
        visible: { x: 0, opacity: 1 }
      };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.wrapper} role="dialog" aria-modal="true">
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className={clsx(styles.drawer, styles[position], styles[size])}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={variants}
            transition={{ type: 'tween', duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {isMobile && <div className={styles.handle} />}
            <div className={styles.header}>
              <div className={styles.headerTitleContainer}>
                <div className={styles.title}>{title}</div>
                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
              </div>
              <button 
                type="button" 
                className={styles.closeBtn} 
                onClick={onClose}
                aria-label="Close dialog"
              >
                <X size={20} strokeWidth={2} />
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
