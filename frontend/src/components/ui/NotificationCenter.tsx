import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle, 
  UserMinus, 
  History 
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { reportingService } from '../../lib/reportingService';
import styles from './NotificationCenter.module.scss';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert' | 'borrower' | 'activity';
  time: string;
  isRead: boolean;
  amount?: string;
}

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

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
    refetchInterval: 15000 // Refetch every 15 seconds to keep it live!
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const visibleNotifications = rawNotifications
    .filter(n => !dismissedIds.includes(n.id))
    .map(n => ({
      ...n,
      isRead: n.isRead || readIds.includes(n.id)
    }));

  const unreadCount = visibleNotifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = () => {
    const allIds = visibleNotifications.map(n => n.id);
    setReadIds(allIds);
    localStorage.setItem('zls-read-notifications', JSON.stringify(allIds));
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextDismissed = [...dismissedIds, id];
    setDismissedIds(nextDismissed);
    localStorage.setItem('zls-dismissed-notifications', JSON.stringify(nextDismissed));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'warning': return <AlertTriangle size={16} className="text-warning" />;
      case 'alert': return <AlertCircle size={16} className="text-danger" />;
      case 'borrower': return <UserMinus size={16} className="text-danger" />;
      case 'activity': return <History size={16} className="text-primary" />;
      case 'success': return <CheckCircle size={16} className="text-success" />;
      default: return <Info size={16} className="text-primary" />;
    }
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button className={styles.trigger} onClick={() => setIsOpen(!isOpen)} title="Notifications">
        <Bell size={20} />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className={styles.dropdown}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.header}>
              <h3 className={styles.title}>System Notifications</h3>
              <button onClick={() => setIsOpen(false)} className={styles.close}>
                <X size={16} />
              </button>
            </div>

            <div className={styles.content}>
              {visibleNotifications.length === 0 ? (
                <div className={styles.empty}>No notifications yet</div>
              ) : (
                visibleNotifications.map(n => (
                  <div key={n.id} className={clsx(styles.item, !n.isRead && styles.unread)}>
                    <div className={styles.icon}>
                      {getIcon(n.type)}
                    </div>
                    <div className={styles.info}>
                      <div className={styles.itemHeader}>
                        <span className={styles.itemTitle}>{n.title}</span>
                        <span className={styles.time}>{n.time}</span>
                      </div>
                      <p className={styles.message}>{n.message}</p>
                    </div>
                    <button 
                      className="ml-2 p-1 rounded-md text-muted hover:bg-black/5 hover:text-primary transition-colors self-start"
                      onClick={(e) => handleDismiss(n.id, e)}
                      title="Dismiss"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className={styles.footer}>
              {visibleNotifications.some(n => !n.isRead) && (
                <button className={styles.viewAll} onClick={handleMarkAllRead}>
                  Mark all as read
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
