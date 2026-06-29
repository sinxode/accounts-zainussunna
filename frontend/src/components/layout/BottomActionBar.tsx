import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Workflow, 
  Search, 
  MoreHorizontal,
  ArrowLeftRight,
  HandCoins,
  BarChart3,
  LayoutTemplate,
  UsersRound,
  ShieldCheck,
  Settings,
  X
} from 'lucide-react';
import styles from './BottomActionBar.module.scss';
import { useUIStore } from '../../store/useUIStore';
import { clsx } from 'clsx';

export const BottomActionBar: React.FC = () => {
  const { setCommandPaletteOpen } = useUIStore();
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.navGrid}>
          <NavLink to="/" className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}>
            <LayoutDashboard size={24} />
            <span className={styles.label}>Dashboard</span>
          </NavLink>
          
          <NavLink to="/operations" className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}>
            <Workflow size={24} />
            <span className={styles.label}>Operations</span>
          </NavLink>

          <NavLink to="/students" className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}>
            <Users size={24} />
            <span className={styles.label}>Students</span>
          </NavLink>

          <button onClick={() => setCommandPaletteOpen(true)} className={styles.navItemButton}>
            <Search size={24} />
            <span className={styles.label}>Search</span>
          </button>

          <button 
            onClick={() => setIsMoreSheetOpen(true)} 
            className={clsx(styles.navItemButton, isMoreSheetOpen && styles.active)}
          >
            <MoreHorizontal size={24} />
            <span className={styles.label}>More</span>
          </button>
        </div>
      </nav>

      {/* Bottom Sheet Drawer for More Options */}
      {isMoreSheetOpen && (
        <div className={styles.sheetOverlay} onClick={() => setIsMoreSheetOpen(false)} />
      )}
      
      <div className={clsx(styles.moreSheet, isMoreSheetOpen && styles.sheetOpen)}>
        <div className={styles.sheetHeader}>
          <span className={styles.sheetTitle}>More Options</span>
          <button className={styles.sheetClose} onClick={() => setIsMoreSheetOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <div className={styles.sheetGrid}>
          <NavLink to="/internal-transfers" className={styles.sheetItem} onClick={() => setIsMoreSheetOpen(false)}>
            <ArrowLeftRight size={20} />
            <span>Transfers</span>
          </NavLink>
          <NavLink to="/borrowers" className={styles.sheetItem} onClick={() => setIsMoreSheetOpen(false)}>
            <HandCoins size={20} />
            <span>Borrowers</span>
          </NavLink>
          <NavLink to="/reports" className={styles.sheetItem} onClick={() => setIsMoreSheetOpen(false)}>
            <BarChart3 size={20} />
            <span>Reports</span>
          </NavLink>
          <NavLink to="/presets" className={styles.sheetItem} onClick={() => setIsMoreSheetOpen(false)}>
            <LayoutTemplate size={20} />
            <span>Presets</span>
          </NavLink>
          <NavLink to="/batches" className={styles.sheetItem} onClick={() => setIsMoreSheetOpen(false)}>
            <UsersRound size={20} />
            <span>Batches</span>
          </NavLink>
          <NavLink to="/administration" className={styles.sheetItem} onClick={() => setIsMoreSheetOpen(false)}>
            <ShieldCheck size={20} />
            <span>Admin</span>
          </NavLink>
          <NavLink to="/settings" className={styles.sheetItem} onClick={() => setIsMoreSheetOpen(false)}>
            <Settings size={20} />
            <span>Settings</span>
          </NavLink>
        </div>
      </div>
    </>
  );
};
