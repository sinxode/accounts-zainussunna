import React from 'react';
import { Card } from '../ui/Card';
import { BarChart3 } from 'lucide-react';
import styles from '../../pages/presets/EntryPresets.module.scss';

export const PresetAnalytics: React.FC = () => {
  const analytics = [
    { label: 'Most Used', value: 'Monthly Zakaath (145)' },
    { label: 'Least Used', value: 'Eid Bonus (3)' },
    { label: 'Usage Trend', value: '+15% this month' },
    { label: 'Monthly Usage', value: '28 executions' },
    { label: 'Average Value Generated', value: '₹12,400' }
  ];

  return (
    <Card padding="lg" className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}><BarChart3 size={16} className="text-primary" /> Preset Analytics</h3>
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
