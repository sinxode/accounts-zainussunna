import React from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Search, 
  Menu,
  Command as CommandIcon,
  Bell
} from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { UserMenu } from './UserMenu';
import { NotificationCenter } from '../ui/NotificationCenter';
import { useWindowSize } from '../../hooks/useWindowSize';
import { useQuery } from '@tanstack/react-query';
import { reportingService } from '../../lib/reportingService';
import styles from './Header.module.scss';

const titleMap: Record<string, string> = {
  '/': 'Dashboard',
  '/operations': 'Operations Center',
  '/students': 'Students',
  '/internal-transfers': 'Internal Transfers',
  '/borrowers': 'Borrowers',
  '/transactions': 'Transactions',
  '/reports': 'Reports',
  '/reports/students': 'Student Reports',
  '/reports/monthly': 'Monthly Reports',
  '/reports/borrowers': 'Borrower Reports',
  '/reports/summary': 'Financial Summary',
  '/reports/analytics': 'Analytics',
  '/administration': 'Administration',
  '/administration/users': 'User Management',
  '/administration/global': 'Global Settings',
  '/administration/periods': 'Accounting Periods',
  '/administration/audit': 'Audit Center',
  '/administration/notifications': 'Notification Management',
  '/administration/health': 'System Health',
  '/administration/data-health': 'Data Health',
  '/administration/import': 'Import Center',
  '/settings': 'Settings',
  '/profile': 'Profile',
  '/presets': 'Entry Presets',
  '/batches': 'Batches',
};

export const Header: React.FC = () => {
  const { setSidebarOpen, setCommandPaletteOpen, setNotificationDrawerOpen } = useUIStore();
  const location = useLocation();
  const { width } = useWindowSize();
  const isMobile = width < 768;

  // Local storage state for Read and Dismissed notifications to compute accurate count on mobile
  const [readIds, setReadIds] = React.useState<string[]>([]);
  const [dismissedIds, setDismissedIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    const syncStates = () => {
      const savedRead = localStorage.getItem('zls-read-notifications');
      if (savedRead) setReadIds(JSON.parse(savedRead));
      const savedDismissed = localStorage.getItem('zls-dismissed-notifications');
      if (savedDismissed) setDismissedIds(JSON.parse(savedDismissed));
    };
    syncStates();
    const interval = setInterval(syncStates, 1000);
    return () => clearInterval(interval);
  }, []);

  const { data: rawNotifications = [] } = useQuery<any[]>({
    queryKey: ['system-notifications'],
    queryFn: () => reportingService.getSystemNotifications(),
    refetchInterval: 15000,
    enabled: isMobile // Only run query in Header context if we are on mobile
  });

  const unreadCount = rawNotifications
    .filter(n => !dismissedIds.includes(n.id))
    .filter(n => !n.isRead && !readIds.includes(n.id))
    .length;

  const getPageTitle = (path: string) => {
    if (titleMap[path]) return titleMap[path];
    if (path.startsWith('/students/')) return 'Student Profile';
    if (path.startsWith('/borrowers/')) return 'Borrower Profile';
    return 'ZLS Ledger';
  };

  return (
    <header className={styles.header}>
      <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}>
        <Menu size={24} />
      </button>

      <div className={styles.mobileTitle}>
        {getPageTitle(location.pathname)}
      </div>

      <div className={styles.searchBar} onClick={() => setCommandPaletteOpen(true)}>
        <Search size={18} className={styles.searchIcon} />
        <span className={styles.placeholder}>Search students, events, borrowers...</span>
        <div className={styles.shortcut}>
          <CommandIcon size={12} />
          <span>K</span>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.mobileSearchBtn} onClick={() => setCommandPaletteOpen(true)}>
          <Search size={20} />
        </button>
        {isMobile ? (
          <button className={styles.actionBtn} onClick={() => setNotificationDrawerOpen(true)}>
            <Bell size={20} />
            {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
          </button>
        ) : (
          <NotificationCenter />
        )}
        <div className={styles.divider} />
        <div className={styles.userMenuWrapper}>
          <UserMenu />
        </div>
      </div>
    </header>
  );
};
