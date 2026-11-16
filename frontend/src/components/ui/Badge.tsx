import React from 'react';
import { clsx } from 'clsx';
import styles from './Badge.module.scss';

export type BadgeVariant = 
  | 'credit' 
  | 'debit' 
  | 'transfer' 
  | 'pending' 
  | 'completed' 
  | 'active' 
  | 'left' 
  | 'hifz' 
  | 'da_wa' 
  | 'dawa'
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'info' 
  | 'neutral' 
  | 'primary' 
  | 'error';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
  pill?: boolean;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className,
  pill = true,
  style
}) => {
  // Normalize variants
  let mappedVariant = variant as string;
  if (mappedVariant === 'error') mappedVariant = 'danger';
  if (mappedVariant === 'success') mappedVariant = 'credit';
  if (mappedVariant === 'danger') mappedVariant = 'debit';
  if (mappedVariant === 'warning') mappedVariant = 'pending';
  if (mappedVariant === 'dawa' || mappedVariant === "da'wa") mappedVariant = 'da_wa';

  return (
    <span 
      style={style}
      className={clsx(
        styles.badge,
        styles[mappedVariant] || styles.neutral,
        styles[size],
        pill && styles.pill,
        className
      )}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

export const StatusIndicator: React.FC<{ status: string; variant?: BadgeVariant }> = ({ 
  status, 
  variant = 'neutral' 
}) => {
  let mappedVariant = variant as string;
  if (mappedVariant === 'error') mappedVariant = 'danger';
  if (mappedVariant === 'success') mappedVariant = 'credit';
  if (mappedVariant === 'danger') mappedVariant = 'debit';
  if (mappedVariant === 'warning') mappedVariant = 'pending';

  return (
    <div className={styles.statusIndicator}>
      <span className={clsx(styles.dot, styles[mappedVariant] || styles.neutral)} />
      <span className={styles.statusText}>{status}</span>
    </div>
  );
};
