import React from 'react';
import { Card } from '../ui/Card';
import { BarChart3 } from 'lucide-react';
import styles from '../../pages/batches/BatchManagement.module.scss';

export const BatchAnalytics: React.FC = () => {
  const analytics = [
    { label: 'Most Used Batch', value: 'Zakaath Students' },
    { label: 'Largest Batch', value: 'Hostel Students (45)' },
    { label: 'Average Batch Size', value: '24 Students' },
    { label: 'Most Active Batch', value: 'Food Allowance' },
    { label: 'Usage Trend', value: '+12% this month' }
  ];

  return (
    <Card padding="lg" className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}><BarChart3 size={16} className="text-primary" /> Batch Analytics</h3>
      </div>
      <div className={styles.analyticsGrid}>
        {analytics.map((stat, idx) => (
          <div key={idx} className={styles.analyticsItem}>
            <span className="text-xs text-muted uppercase tracking-wider font-bold">{stat.label}</span>
            <span className="text-lg font-bold text-primary mt-1">{stat.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};
