import React from 'react';
import { clsx } from 'clsx';
import { Card } from './Card';
import styles from './StatCard.module.scss';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: React.ReactNode;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'danger' | 'info';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  icon,
  trend,
  variant = 'neutral'
}) => {
  const mappedVariant = variant === 'error' ? 'danger' : variant;

  return (
    <Card className={styles.card} padding="lg">
      <div className={styles.header}>
        <div className={clsx(styles.iconWrapper, styles[mappedVariant])}>
          {icon}
        </div>
        {trend && (
          <div className={clsx(styles.trend, trend.isPositive ? styles.positive : styles.negative)}>
            <span>{trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      
      <div className={styles.content}>
        <span className={styles.label}>{label}</span>
        <h3 className={styles.value}>{value}</h3>
        {subValue && (
          <span className="text-xs text-muted" style={{ display: 'block', marginTop: '3px' }}>
            {subValue}
          </span>
        )}
      </div>
    </Card>
  );
};
