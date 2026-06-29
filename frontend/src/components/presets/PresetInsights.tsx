import React from 'react';
import { Card } from '../ui/Card';
import { Lightbulb } from 'lucide-react';
import styles from '../../pages/presets/EntryPresets.module.scss';

export const PresetInsights: React.FC = () => {
  const insights = [
    { label: 'Most Popular Preset', value: 'Monthly Zakaath' },
    { label: 'Unused Presets', value: 'Winter Jacket, Laptop Grant' },
    { label: 'Favorite Presets', value: '4 Configured' },
    { label: 'Recently Created', value: 'Store Purchase (2 weeks ago)' },
    { label: 'Highest Value Preset', value: 'Staff Salary (₹4,50,000 avg)' },
    { label: 'Most Frequent Batch', value: 'Zakaath Students' }
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
