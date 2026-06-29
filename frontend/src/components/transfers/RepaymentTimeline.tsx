import React from 'react';
import { Card } from '../ui/Card';
import { History, PlusCircle, IndianRupee } from 'lucide-react';
import styles from '../../pages/transfers/InternalTransfers.module.scss';
import { clsx } from 'clsx';

export const RepaymentTimeline: React.FC = () => {
  const events = [
    { id: 1, type: 'created', title: 'Transfer Created', date: 'Oct 1, 2023', amount: '₹5,000', icon: PlusCircle, color: 'primary' },
    { id: 2, type: 'repayment', title: 'Partial Repayment', date: 'Oct 15, 2023', amount: '₹500', icon: IndianRupee, color: 'success' },
  ];

  return (
    <Card padding="lg" className={styles.sectionCard}>
      <h3 className={styles.sectionTitle}><History size={16} className="text-muted inline mr-2" /> Repayment Timeline</h3>
      
      <div className={styles.timelineContainer}>
        {events.map(event => {
          const Icon = event.icon;
          return (
            <div key={event.id} className={styles.timelineItem}>
              <div className={clsx(styles.timelineIcon, styles[event.color])}>
                <Icon size={14} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <div className="font-bold text-sm">{event.title}</div>
                  <div className={clsx("font-bold text-sm", event.type === 'repayment' ? 'text-success' : 'text-primary')}>
                    {event.amount}
                  </div>
                </div>
                <div className="text-xs text-muted">{event.date}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
