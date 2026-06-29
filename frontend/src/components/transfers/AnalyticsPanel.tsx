import React from 'react';
import { Card } from '../ui/Card';
import { BarChart3 } from 'lucide-react';
import styles from '../../pages/transfers/InternalTransfers.module.scss';

export const AnalyticsPanel: React.FC = () => {
  const analytics = [
    { label: 'Outstanding Trend', value: '+12% this month' },
    { label: 'Transfer Volume', value: '₹1.2M YTD' },
    { label: 'Repayment Rate', value: '85%' },
    { label: 'Average Transfer', value: '₹5,400' },
    { label: 'Settlement Rate', value: '72%' }
  ];

  return (
    <Card padding="lg" className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}><BarChart3 size={16} className="text-primary" /> Transfer Analytics</h3>
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
