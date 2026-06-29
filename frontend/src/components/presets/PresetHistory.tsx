import React from 'react';
import { Card } from '../ui/Card';
import { History, PlayCircle } from 'lucide-react';
import styles from '../../pages/presets/EntryPresets.module.scss';
import { clsx } from 'clsx';

export const PresetHistory: React.FC = () => {
  const history = [
    { id: 1, preset: 'Monthly Zakaath', records: '18 Students', amount: '₹18,000', user: 'Admin', time: 'Today, 10:45 AM' },
    { id: 2, preset: 'Food Allowance', records: '45 Active Students', amount: '₹9,000', user: 'Manager', time: 'Yesterday, 02:15 PM' },
    { id: 3, preset: 'Store Purchase', records: '1 Record', amount: '₹1,500', user: 'Admin', time: 'Oct 12, 11:00 AM' },
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
                <div className="text-sm font-bold text-primary">{item.preset}</div>
                <div className="text-sm font-bold">{item.amount}</div>
              </div>
              <div className="text-xs text-secondary mb-1">Generated {item.records} • By {item.user}</div>
              <div className="text-xs text-muted">{item.time}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
