import React from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Search, 
  Command as CommandIcon, 
  Bell, 
  Plus, 
  ArrowUpRight,
  HelpCircle
} from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { UserMenu } from './UserMenu';
import { NotificationCenter } from '../ui/NotificationCenter';
import { useWindowSize } from '../../hooks/useWindowSize';
import { useQuery } from '@tanstack/react-query';
import { reportingService } from '../../lib/reportingService';
import { useOperationsDrawer } from '../operations/drawers/OperationsDrawerContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import styles from './Header.module.scss';

interface PageMeta {
  title: string;
}

const pageMetaMap: Record<string, PageMeta> = {
  '/': { title: 'Dashboard' },
  '/transactions': { title: 'Transactions' },
  '/operations': { title: 'Accounts & Operations' },
  '/students': { title: 'Students' },
  '/borrowers': { title: 'Debts & Borrowers' },
  '/internal-transfers': { title: 'Internal Transfers' },
  '/batches': { title: 'Batch Operations' },
  '/presets': { title: 'Entry Presets' },
  '/reports': { title: 'Reports & Audit' },
  '/reports/student-statement': { title: 'Student Statement' },
  '/reports/students': { title: 'Student Balances' },
  '/reports/monthly': { title: 'Monthly Summary' },
  '/reports/cashbook': { title: 'Cashbook & Reconciliation' },
  '/reports/borrowers': { title: 'Borrower Loans' },
  '/reports/borrower-aging': { title: 'Loan Aging Schedule' },
  '/reports/summary': { title: 'Financial Summary' },
  '/reports/transaction-types': { title: 'Transaction Type Matrix' },
  '/reports/audit': { title: 'Audit Activity Trail' },
  '/reports/reconciliation-exceptions': { title: 'Exceptions & Data Health' },
  '/settings': { title: 'Settings & Governance' },
  '/profile': { title: 'User Profile' },
};

export const Header: React.FC = () => {
  const { setCommandPaletteOpen, setNotificationDrawerOpen, setShortcutReferenceOpen } = useUIStore();
  const { openDrawer } = useOperationsDrawer();
  const { profile, user } = useAuth();
  const location = useLocation();
  const { width } = useWindowSize();
  const isMobile = width < 768;

  const canManageMoney = ['super_admin', 'admin', 'owner', 'manager'].includes(profile?.role || '');

  // Local storage state for Read and Dismissed notifications
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
    const interval = setInterval(syncStates, 5000);
    return () => clearInterval(interval);
  }, []);

  const { data: rawNotifications = [] } = useQuery<any[]>({
    queryKey: ['system-notifications'],
    queryFn: () => reportingService.getSystemNotifications(),
    refetchInterval: 30000,
    enabled: isMobile
  });

  const unreadCount = rawNotifications
    .filter(n => !dismissedIds.includes(n.id))
    .filter(n => !n.isRead && !readIds.includes(n.id))
    .length;

  const getPageInfo = (): PageMeta => {
    const path = location.pathname;
    if (pageMetaMap[path]) return pageMetaMap[path];
    if (path.startsWith('/students/')) return { title: 'Student Profile' };
    if (path.startsWith('/borrowers/')) return { title: 'Borrower Profile' };
    if (path.startsWith('/transactions/')) return { title: 'Transaction Detail' };
    return { title: 'ZLS Ledger' };
  };

  const pageInfo = getPageInfo();
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Admin';

  if (isMobile) {
    return (
      <header className={styles.mobileHeader}>
        <div className={styles.mobileLeft}>
          <Avatar name={displayName} size="sm" />
          <div className={styles.mobileGreeting}>
            <span className={styles.greetingText}>Hello, {displayName.split(' ')[0]}</span>
            <span className={styles.mobileSub}>{pageInfo.title}</span>
          </div>
        </div>
        <div className={styles.mobileRight}>
          <button 
            type="button"
            className={styles.iconBtn} 
            onClick={() => setCommandPaletteOpen(true)} 
            aria-label="Search"
          >
            <Search size={18} />
          </button>
          <button 
            type="button"
            className={styles.iconBtn}
            onClick={() => setNotificationDrawerOpen(true)}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className={styles.badgeDot} />}
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className={styles.header}>
      {/* Left: Page Title */}
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>{pageInfo.title}</h1>
      </div>

      {/* Centre-Right: Global Search Pill */}
      <div className={styles.searchSection}>
        <button 
          type="button" 
          className={styles.searchPill} 
          onClick={() => setCommandPaletteOpen(true)} 
          aria-label="Search"
        >
          <Search size={16} className={styles.searchIcon} />
          <span className={styles.placeholder}>Search students, transactions...</span>
          <div className={styles.shortcut}>
            <CommandIcon size={11} />
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Right: Primary CTA Group */}
      <div className={styles.actionGroup}>
        {canManageMoney && (
          <div className={styles.ctaButtons}>
            <Button 
              variant="primary" 
              size="md"
              icon={<Plus size={16} strokeWidth={2.5} />}
              onClick={() => openDrawer('deposit')}
            >
              Deposit
            </Button>
            <Button 
              variant="secondary" 
              size="md"
              icon={<ArrowUpRight size={16} strokeWidth={2.2} />}
              onClick={() => openDrawer('withdrawal')}
            >
              Withdraw
            </Button>
          </div>
        )}

        <div className={styles.notificationWrapper}>
          <NotificationCenter />
        </div>

        <button 
          type="button"
          className={styles.shortcutBtn}
          onClick={() => setShortcutReferenceOpen(true)}
          title="Keyboard Shortcuts (⌘/)"
          aria-label="Keyboard Shortcuts"
        >
          <HelpCircle size={18} />
        </button>

        <UserMenu />
      </div>
    </header>
  );
};
