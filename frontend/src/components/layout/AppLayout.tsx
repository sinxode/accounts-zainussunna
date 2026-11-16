import React from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPalette } from '../ui/CommandPalette';
import { ShortcutReferenceModal } from '../ui/ShortcutReferenceModal';
import { SequenceIndicator } from '../ui/SequenceIndicator';
import { NotificationDrawer } from './NotificationDrawer';
import { DrawerManager } from '../operations/drawers/DrawerManager';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import styles from './AppLayout.module.scss';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import { useUIStore } from '../../store/useUIStore';
import { AnimatePresence, motion } from 'framer-motion';
import { clsx } from 'clsx';
import { BottomActionBar } from './BottomActionBar';

export const AppLayout: React.FC = () => {
  useKeyboardShortcuts();
  useRealtimeSync();
  const location = useLocation();
  const outlet = useOutlet();
  const { confirmationConfig, closeConfirmation, isSidebarCollapsed } = useUIStore();

  return (
    <div className={styles.pageWrapper}>
      <div className={clsx(styles.shell, isSidebarCollapsed && styles.shellCollapsed)}>
        <Sidebar />
        <div className={styles.main}>
          <Header />
          <main className={styles.content}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ 
                  duration: 0.18, 
                  ease: [0.2, 0.8, 0.2, 1]
                }}
                className={styles.pageContainer}
              >
                {outlet}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
      
      <CommandPalette />
      <ShortcutReferenceModal />
      <SequenceIndicator />
      <NotificationDrawer />
      <DrawerManager />
      <BottomActionBar />

      {confirmationConfig && (
        <ConfirmationModal
          isOpen={!!confirmationConfig}
          onClose={closeConfirmation}
          onConfirm={() => {
            confirmationConfig.onConfirm();
            closeConfirmation();
          }}
          title={confirmationConfig.title}
          message={confirmationConfig.message}
          confirmLabel={confirmationConfig.confirmLabel}
          variant={confirmationConfig.variant}
        />
      )}
    </div>
  );
};
