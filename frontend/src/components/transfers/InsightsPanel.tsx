import React from 'react';
import { Card } from '../ui/Card';
import { Lightbulb } from 'lucide-react';
import styles from '../../pages/transfers/InternalTransfers.module.scss';

export const InsightsPanel: React.FC = () => {
  const insights = [
    { label: 'Largest Outstanding', value: 'TRF-099 (₹15,000)' },
    { label: 'Most Active Borrower', value: 'Imran Shafiq' },
    { label: 'Most Active Lender', value: 'System Fund' },
    { label: 'Fastest Repayment', value: 'TRF-102 (2 Days)' },
    { label: 'Longest Outstanding', value: 'TRF-045 (145 Days)' }
  ];

  return (
    <Card padding="lg" className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}><Lightbulb size={16} className="text-warning" /> Smart Insights</h3>
      </div>
      <div className={styles.insightsGrid}>
        {insights.map((insight, idx) => (
          <div key={idx} className={styles.insightItem}>
            <span className="text-xs text-muted uppercase tracking-wider font-bold">{insight.label}</span>
            <span className="text-sm font-bold text-primary mt-1">{insight.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};
