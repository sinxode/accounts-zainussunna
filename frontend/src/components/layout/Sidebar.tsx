import React, { useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ArrowLeftRight,
  HandCoins,
  Receipt,
  BarChart3, 
  Settings,
  ShieldCheck,
  Workflow,
  X,
  PanelLeftClose,
  PanelRightClose,
  LayoutTemplate,
  UsersRound,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useUIStore } from '../../store/useUIStore';
import styles from './Sidebar.module.scss';
import { useWindowSize } from '../../hooks/useWindowSize';
import { Button } from '../ui/Button';
import logoImg from '../../assets/logo_dark.png';
import { useAuth } from '../../contexts/AuthContext';
import type { Database } from '../../types/database';

type Role = Database['public']['Tables']['profiles']['Row']['role'];

interface NavItem {
  title: string;
  icon: React.ReactNode;
  path: string;
  roles?: Role[];
}

const navigation: NavItem[] = [
  { title: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
  { title: 'Operations Center', icon: <Workflow size={20} />, path: '/operations', roles: ['super_admin', 'admin', 'owner', 'manager'] },
  { title: 'Students', icon: <Users size={20} />, path: '/students' },
  { title: 'Internal Transfers', icon: <ArrowLeftRight size={20} />, path: '/internal-transfers', roles: ['super_admin', 'admin', 'owner', 'manager'] },
  { title: 'Batches', icon: <UsersRound size={20} />, path: '/batches', roles: ['super_admin', 'admin', 'owner', 'manager'] },
  { title: 'Entry Presets', icon: <LayoutTemplate size={20} />, path: '/presets', roles: ['super_admin', 'admin', 'owner', 'manager'] },
  { title: 'Borrowers', icon: <HandCoins size={20} />, path: '/borrowers', roles: ['super_admin', 'admin', 'owner', 'manager'] },
  { title: 'Transactions', icon: <Receipt size={20} />, path: '/transactions' },
  { title: 'Reports', icon: <BarChart3 size={20} />, path: '/reports', roles: ['super_admin', 'admin', 'faculty', 'owner', 'manager', 'staff'] },
  { title: 'Administration', icon: <ShieldCheck size={20} />, path: '/administration', roles: ['super_admin', 'owner'] },
  { title: 'Settings', icon: <Settings size={20} />, path: '/settings', roles: ['super_admin', 'admin', 'owner', 'manager'] },
];

export const Sidebar: React.FC = () => {
  const { role } = useAuth();
  const { isSidebarOpen, setSidebarOpen, isSidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const { width } = useWindowSize();
  const isMobile = width < 768;

  const visibleNavigation = navigation.filter(item => {
    if (!item.roles) return true;
    if (!role) return false;
    return item.roles.includes(role);
  });

  // Auto-collapse sidebar on tablet screen widths to optimize workspace layout
  useEffect(() => {
    if (width < 768) {
      setSidebarCollapsed(false);
    } else if (width >= 768 && width < 1024) {
      setSidebarCollapsed(true);
    } else if (width >= 1024) {
      setSidebarCollapsed(false);
    }
  }, [width, setSidebarCollapsed]);

  const handleToggleCollapse = () => setSidebarCollapsed(!isSidebarCollapsed);

  return (
    <>
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div 
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside 
        className={clsx(
          styles.sidebar, 
          isMobile && isSidebarOpen && styles.isOpen,
          !isMobile && isSidebarCollapsed && styles.collapsed
        )}
      >
        <div className={styles.logoArea}>
          <Link to="/" className={styles.logo}>
            <img src={logoImg} alt="ZLS Logo" className={styles.logoIcon} />
            <AnimatePresence>
              {(isMobile || !isSidebarCollapsed) && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className={styles.logoContent}>
                  <span className={styles.brand}>ZLS</span>
                  <span className={styles.tagline}>Financial Platform</span>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
          {isMobile && (
            <button className={styles.closeBtn} onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          )}
        </div>

        <div className={styles.scrollArea}>
          <nav className={styles.nav}>
            {visibleNavigation.map((item) => (
              <NavLink 
                key={item.path}
                to={item.path}
                title={item.title}
                onClick={() => isMobile && setSidebarOpen(false)}
                className={({ isActive }) => clsx(styles.navItem, isActive && styles.active)}
              >
                <span className={styles.icon}>{item.icon}</span>
                <AnimatePresence>
                  {(isMobile || !isSidebarCollapsed) && (
                     <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={styles.title}>{item.title}</motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className={styles.footer}>
          {!isMobile && (
            <Button 
              variant="ghost" 
              className={styles.collapseBtn}
              onClick={handleToggleCollapse}
            >
              {isSidebarCollapsed ? <PanelRightClose size={18} /> : <PanelLeftClose size={18} />}
            </Button>
          )}
          <div className={styles.version}>v2.0.0</div>
        </div>
      </aside>
    </>
  );
};
