import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowLeftRight,
  GraduationCap, 
  MoreHorizontal,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  HandCoins,
  BarChart3,
  Settings,
  LogOut,
  X
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../contexts/AuthContext';
import { useOperationsDrawer } from '../operations/drawers/OperationsDrawerContext';
import styles from './BottomActionBar.module.scss';

export const BottomActionBar: React.FC = () => {
  const { signOut } = useAuth();
  const { openDrawer } = useOperationsDrawer();
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  const handleAction = (drawerType: 'deposit' | 'withdrawal' | 'internal') => {
    setIsQuickActionsOpen(false);
    openDrawer(drawerType);
  };

  return (
    <>
      <nav className={styles.bottomBar}>
        <div className={styles.barGrid}>
          {/* 1. Home */}
          <NavLink to="/" className={({ isActive }) => clsx(styles.barItem, isActive && styles.active)}>
            <LayoutDashboard size={20} strokeWidth={1.75} />
            <span className={styles.label}>Home</span>
          </NavLink>
          
          {/* 2. Transactions */}
          <NavLink to="/transactions" className={({ isActive }) => clsx(styles.barItem, isActive && styles.active)}>
            <ArrowLeftRight size={20} strokeWidth={1.75} />
            <span className={styles.label}>Ledger</span>
          </NavLink>

          {/* 3. Center Lime FAB */}
          <div className={styles.fabWrapper}>
            <button
              type="button"
              className={clsx(styles.centerFab, isQuickActionsOpen && styles.fabOpen)}
              onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
              aria-label="Quick Actions"
            >
              <Plus size={24} strokeWidth={2.5} />
            </button>
          </div>

          {/* 4. Students */}
          <NavLink to="/students" className={({ isActive }) => clsx(styles.barItem, isActive && styles.active)}>
            <GraduationCap size={20} strokeWidth={1.75} />
            <span className={styles.label}>Students</span>
          </NavLink>

          {/* 5. More */}
          <button 
            type="button"
            onClick={() => setIsMoreSheetOpen(true)} 
            className={clsx(styles.barItem, isMoreSheetOpen && styles.active)}
            aria-label="More options"
          >
            <MoreHorizontal size={20} strokeWidth={1.75} />
            <span className={styles.label}>More</span>
          </button>
        </div>
      </nav>

      {/* Quick Actions Bottom Sheet */}
      {isQuickActionsOpen && (
        <div className={styles.sheetOverlay} onClick={() => setIsQuickActionsOpen(false)} />
      )}
      <div className={clsx(styles.bottomSheet, isQuickActionsOpen && styles.sheetOpen)}>
        <div className={styles.sheetHandle} />
        <div className={styles.sheetHeader}>
          <h3 className={styles.sheetTitle}>Quick Actions</h3>
          <button type="button" className={styles.closeBtn} onClick={() => setIsQuickActionsOpen(false)} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className={styles.actionTiles}>
          <button type="button" className={clsx(styles.actionTile, styles.depositTile)} onClick={() => handleAction('deposit')}>
            <div className={styles.tileIcon}><ArrowDownLeft size={24} strokeWidth={2} /></div>
            <div className={styles.tileInfo}>
              <span className={styles.tileTitle}>Deposit</span>
              <span className={styles.tileDesc}>Record incoming cash</span>
            </div>
          </button>

          <button type="button" className={clsx(styles.actionTile, styles.withdrawTile)} onClick={() => handleAction('withdrawal')}>
            <div className={styles.tileIcon}><ArrowUpRight size={24} strokeWidth={2} /></div>
            <div className={styles.tileInfo}>
              <span className={styles.tileTitle}>Withdraw</span>
              <span className={styles.tileDesc}>Record cash payout</span>
            </div>
          </button>

          <button type="button" className={clsx(styles.actionTile, styles.transferTile)} onClick={() => handleAction('internal')}>
            <div className={styles.tileIcon}><ArrowLeftRight size={24} strokeWidth={2} /></div>
            <div className={styles.tileInfo}>
              <span className={styles.tileTitle}>Transfer</span>
              <span className={styles.tileDesc}>Move between accounts</span>
            </div>
          </button>
        </div>
      </div>

      {/* More Bottom Sheet */}
      {isMoreSheetOpen && (
        <div className={styles.sheetOverlay} onClick={() => setIsMoreSheetOpen(false)} />
      )}
      <div className={clsx(styles.bottomSheet, isMoreSheetOpen && styles.sheetOpen)}>
        <div className={styles.sheetHandle} />
        <div className={styles.sheetHeader}>
          <h3 className={styles.sheetTitle}>All Navigation</h3>
          <button type="button" className={styles.closeBtn} onClick={() => setIsMoreSheetOpen(false)} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className={styles.moreList}>
          <NavLink to="/operations" className={styles.moreItem} onClick={() => setIsMoreSheetOpen(false)}>
            <div className={styles.moreIcon}><Wallet size={20} /></div>
            <span>Accounts & Operations</span>
          </NavLink>

          <NavLink to="/borrowers" className={styles.moreItem} onClick={() => setIsMoreSheetOpen(false)}>
            <div className={styles.moreIcon}><HandCoins size={20} /></div>
            <span>External Debts & Loans</span>
          </NavLink>

          <NavLink to="/reports" className={styles.moreItem} onClick={() => setIsMoreSheetOpen(false)}>
            <div className={styles.moreIcon}><BarChart3 size={20} /></div>
            <span>Financial Reports & Audit</span>
          </NavLink>

          <NavLink to="/settings" className={styles.moreItem} onClick={() => setIsMoreSheetOpen(false)}>
            <div className={styles.moreIcon}><Settings size={20} /></div>
            <span>Settings</span>
          </NavLink>

          <button type="button" className={clsx(styles.moreItem, styles.logoutItem)} onClick={() => { setIsMoreSheetOpen(false); signOut(); }}>
            <div className={styles.moreIcon}><LogOut size={20} /></div>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};
