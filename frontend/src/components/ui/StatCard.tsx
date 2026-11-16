import React from 'react';
import { clsx } from 'clsx';
import { ArrowUpRight } from 'lucide-react';
import { Card } from './Card';
import styles from './StatCard.module.scss';

export interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: React.ReactNode;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'danger' | 'info' | 'hero' | 'surface';
  onActionClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  icon,
  trend,
  variant = 'surface',
  onActionClick,
  className
}) => {
  const isHero = variant === 'hero';

  return (
    <Card 
      variant={isHero ? 'hero' : 'surface'} 
      padding="none" 
      className={clsx(
        styles.statCard, 
        isHero && styles.heroCard, 
        styles[variant], 
        className
      )}
    >
      <div className={styles.topRow}>
        <span className={styles.label} title={label}>{label}</span>
        <div className={styles.actions}>
          {icon && <div className={styles.icon}>{icon}</div>}
          {onActionClick && (
            <button 
              type="button" 
              onClick={onActionClick} 
              className={styles.circleArrowBtn}
              aria-label={`View details for ${label}`}
            >
              <ArrowUpRight size={16} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      <div className={styles.valueRow}>
        <span className={styles.value}>{value}</span>
      </div>

      {(trend || subValue) && (
        <div className={styles.bottomRow}>
          {trend && (
            <div className={clsx(
              styles.deltaChip,
              trend.isPositive ? styles.positive : styles.negative
            )}>
              <span>{trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
              {trend.label && <span className={styles.deltaLabel}>{trend.label}</span>}
            </div>
          )}
          {subValue && !trend && (
            <div className={styles.subValue}>
              {subValue}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
