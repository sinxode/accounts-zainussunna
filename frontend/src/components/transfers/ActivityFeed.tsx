import React from 'react';
import { Card } from '../ui/Card';
import { History, RefreshCcw } from 'lucide-react';
import styles from '../../pages/transfers/InternalTransfers.module.scss';
import { clsx } from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { transactionService } from '../../lib/services';

export const ActivityFeed: React.FC = () => {
  const { data: transfers = [] } = useQuery({
    queryKey: ['internalTransfers'],
    queryFn: transactionService.listInternalTransfers,
  });

  const activities = transfers.slice(0, 5).map((trf: any) => {
    const lender = trf.participants.find((p: any) => p.direction === 'debit')?.name || 'System';
    const borrower = trf.participants.find((p: any) => p.direction === 'credit')?.name || 'Unknown';
    return {
      id: trf.id,
      desc: `Transfer of ₹${trf.amount.toLocaleString()}`,
      detail: `${lender} → ${borrower}`,
      user: trf.purpose || 'Internal Lending',
      time: new Date(trf.transaction_date).toLocaleDateString() + ' ' + new Date(trf.transaction_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      icon: RefreshCcw,
      color: trf.is_reversed ? 'success' : 'primary'
    };
  });

  return (
    <Card padding="lg" className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}><History size={16} className="text-muted" /> Real-time Activity Feed</h3>
      </div>
      <div className={styles.feedContainer}>
        {activities.map(activity => {
          const Icon = activity.icon;
          return (
            <div key={activity.id} className={styles.feedItem}>
              <div className={clsx(styles.feedIcon, styles[activity.color])}>
                <Icon size={14} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold">{activity.desc}</div>
                <div className="text-xs text-secondary font-medium">{activity.detail}</div>
                <div className="text-xs text-muted">Purpose: {activity.user}</div>
              </div>
              <div className="text-xs text-secondary self-start pt-1">{activity.time}</div>
            </div>
          );
        })}
        {activities.length === 0 && (
          <div className="text-center p-8 text-muted text-sm w-full">
            No recent activity.
          </div>
        )}
      </div>
    </Card>
  );
};
