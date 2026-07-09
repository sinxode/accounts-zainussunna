import React from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPalette } from '../ui/CommandPalette';
import { GlobalFAB } from '../ui/GlobalFAB';
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
  const { isSidebarCollapsed, confirmationConfig, closeConfirmation } = useUIStore();

  return (
    <div className={styles.wrapper}>
      <Sidebar />
      <div className={clsx(styles.main, isSidebarCollapsed && styles.mainWithCollapsedSidebar)}>
        <Header />
        <main className={styles.content}>
          <AnimatePresence mode="wait" initial={true}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ 
                duration: 0.25, 
                ease: "easeInOut"
              }}
              className={styles.pageContainer}
            >
              {outlet}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      
      <CommandPalette />
      <NotificationDrawer />
      <DrawerManager />
      <GlobalFAB />
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
