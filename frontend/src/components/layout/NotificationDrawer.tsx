import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  UserMinus, 
  History,
  AlertCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import { useUIStore } from '../../store/useUIStore';
import { Drawer } from '../ui/Drawer';
import { Badge } from '../ui/Badge';
import { useQuery } from '@tanstack/react-query';
import { reportingService } from '../../lib/reportingService';
import styles from './NotificationDrawer.module.scss';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert' | 'borrower' | 'activity';
  time: string;
  isRead: boolean;
  amount?: string;
}

export const NotificationDrawer: React.FC = () => {
  const { isNotificationDrawerOpen, setNotificationDrawerOpen } = useUIStore();
  const [activeTab, setActiveTab] = useState<'all' | 'alerts' | 'history'>('all');

  // Local storage state for Read and Dismissed notifications
  const [readIds, setReadIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('zls-read-notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('zls-dismissed-notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const { data: rawNotifications = [] } = useQuery<Notification[]>({
    queryKey: ['system-notifications'],
    queryFn: () => reportingService.getSystemNotifications(),
    refetchInterval: 15000
  });

  // Sync state between drawers/centers on load or state updates
  useEffect(() => {
    const handleStorageChange = () => {
      const savedRead = localStorage.getItem('zls-read-notifications');
      if (savedRead) setReadIds(JSON.parse(savedRead));
      const savedDismissed = localStorage.getItem('zls-dismissed-notifications');
      if (savedDismissed) setDismissedIds(JSON.parse(savedDismissed));
    };

    window.addEventListener('storage', handleStorageChange);
    // Poll localstorage changes locally
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const visibleNotifications = rawNotifications
    .filter(n => !dismissedIds.includes(n.id))
    .map(n => ({
      ...n,
      isRead: n.isRead || readIds.includes(n.id)
    }));

  const filteredNotifications = visibleNotifications.filter(n => {
    if (activeTab === 'alerts') {
      return ['warning', 'alert', 'borrower'].includes(n.type);
    }
    if (activeTab === 'history') {
      return ['activity', 'success', 'info'].includes(n.type);
    }
    return true;
  });

  const handleToggleRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let nextRead: string[];
    if (readIds.includes(id)) {
      nextRead = readIds.filter(x => x !== id);
    } else {
      nextRead = [...readIds, id];
    }
    setReadIds(nextRead);
    localStorage.setItem('zls-read-notifications', JSON.stringify(nextRead));
  };

  const handleResolve = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextDismissed = [...dismissedIds, id];
    setDismissedIds(nextDismissed);
    localStorage.setItem('zls-dismissed-notifications', JSON.stringify(nextDismissed));
  };

  const handleMarkAllRead = () => {
    const allIds = visibleNotifications.map(n => n.id);
    setReadIds(allIds);
    localStorage.setItem('zls-read-notifications', JSON.stringify(allIds));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'warning': 
        return <AlertTriangle size={18} className="text-warning" />;
      case 'alert': 
        return <AlertCircle size={18} className="text-danger" />;
      case 'borrower': 
        return <UserMinus size={18} className="text-danger" />;
      default: 
        return <History size={18} className="text-primary" />;
    }
  };

  return (
    <Drawer 
      isOpen={isNotificationDrawerOpen} 
      onClose={() => setNotificationDrawerOpen(false)}
      title="Notifications & Alerts"
    >
      <div className={styles.container}>
        <div className={styles.tabs}>
          <button 
            className={clsx(styles.tab, activeTab === 'all' && styles.active)}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button 
            className={clsx(styles.tab, activeTab === 'alerts' && styles.active)}
            onClick={() => setActiveTab('alerts')}
          >
            Alerts
          </button>
          <button 
            className={clsx(styles.tab, activeTab === 'history' && styles.active)}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>

        <div className={styles.list}>
          {filteredNotifications.length === 0 ? (
            <div className="text-center text-muted p-12 text-sm">
              No notifications in this category.
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <div key={n.id} className={clsx(styles.item, !n.isRead && styles.unread)}>
                <div className={styles.itemHeader}>
                  <div className={styles.iconArea}>
                    {getIcon(n.type)}
                  </div>
                  <div className={styles.titleArea} onClick={(e) => handleToggleRead(n.id, e)}>
                    <span className={clsx(styles.title, n.isRead && "opacity-70")}>{n.title}</span>
                    <span className={styles.time}>{n.time}</span>
                  </div>
                  {n.amount && (
                    <Badge variant={n.type === 'activity' ? 'info' : 'danger'} size="sm">
                      {n.amount}
                    </Badge>
                  )}
                </div>
                <p className={styles.message}>{n.message}</p>
                <div className={styles.actions}>
                  <button className={styles.actionBtn} onClick={(e) => handleResolve(n.id, e)}>
                    Resolve / Dismiss
                  </button>
                  <button 
                    className={clsx(styles.actionBtn, n.isRead ? "text-muted" : "text-primary font-semibold")}
                    onClick={(e) => handleToggleRead(n.id, e)}
                  >
                    {n.isRead ? 'Mark Unread' : 'Mark Read'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.footer}>
          {visibleNotifications.some(n => !n.isRead) && (
            <button className={styles.markAll} onClick={handleMarkAllRead}>
              Mark all as read
            </button>
          )}
        </div>
      </div>
    </Drawer>
  );
};
