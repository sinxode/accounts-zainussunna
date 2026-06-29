import React from 'react';
import { Card } from '../ui/Card';
import { Lightbulb } from 'lucide-react';
import styles from '../../pages/batches/BatchManagement.module.scss';

export const BatchInsights: React.FC = () => {
  const insights = [
    { label: 'Largest Batch', value: 'Hostel Students (45)' },
    { label: 'Most Active', value: 'Zakaath Students (145 ops)' },
    { label: 'Highest Value', value: 'Staff Salary' },
    { label: 'Least Used', value: 'Staff Children (2 ops)' },
    { label: 'Recently Created', value: 'IT Club (Never Used)' },
    { label: 'Fastest Growing', value: 'Scholarship (+5 this month)' }
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
