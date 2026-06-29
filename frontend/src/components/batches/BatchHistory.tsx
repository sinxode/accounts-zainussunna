import React from 'react';
import { Card } from '../ui/Card';
import { History, PlayCircle } from 'lucide-react';
import styles from '../../pages/batches/BatchManagement.module.scss';
import { clsx } from 'clsx';

export const BatchHistory: React.FC = () => {
  const history = [
    { id: 1, operation: 'Monthly Zakaath', batch: 'Zakaath Students', records: '18 Students', amount: '₹18,000', user: 'Admin', time: 'Today, 10:45 AM' },
    { id: 2, operation: 'Food Allowance', batch: 'Hostel Students', records: '45 Students', amount: '₹9,000', user: 'Manager', time: 'Yesterday, 02:15 PM' },
    { id: 3, operation: 'Scholarship Distribution', batch: 'Hifz Top 10', records: '10 Students', amount: '₹15,000', user: 'Admin', time: 'Oct 12, 11:00 AM' },
  ];

  return (
    <Card padding="lg" className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}><History size={16} className="text-muted" /> Usage History</h3>
      </div>
      <div className={styles.historyTimeline}>
        {history.map(item => (
          <div key={item.id} className={styles.historyItem}>
            <div className={clsx(styles.historyIcon, 'primary')}>
              <PlayCircle size={14} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <div className="text-sm font-bold text-primary">{item.operation}</div>
                <div className="text-sm font-bold">{item.amount}</div>
              </div>
              <div className="text-xs text-secondary mb-1">Batch: {item.batch} • Generated {item.records} • By {item.user}</div>
              <div className="text-xs text-muted">{item.time}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
