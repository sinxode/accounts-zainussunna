import React from 'react';
import { clsx } from 'clsx';
import styles from './Badge.module.scss';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary' | 'error';

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
  pill = false,
  style
}) => {
  return (
    <span 
      style={style}
      className={clsx(
      styles.badge,
      styles[variant === 'error' ? 'danger' : variant],
      styles[size],
      pill && styles.pill,
      className
    )}>
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </span>
  );
};

export const StatusIndicator: React.FC<{ status: string, variant?: BadgeVariant }> = ({ status, variant = 'neutral' }) => {
  return (
    <div className={styles.statusIndicator}>
      <span className={clsx(styles.dot, styles[variant === 'error' ? 'danger' : variant])} />
      <span className={styles.statusText}>{status}</span>
    </div>
  );
};
