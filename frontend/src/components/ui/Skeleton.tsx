import React from 'react';
import { clsx } from 'clsx';
import styles from './Skeleton.module.scss';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  circle?: boolean;
  mb?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'text',
  width,
  height,
  borderRadius,
  circle,
  mb
}) => {
  return (
    <div
      className={clsx(styles.skeleton, styles[variant], circle && styles.circle, className)}
      style={{ width, height, borderRadius, marginBottom: mb }}
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <div className={styles.cardSkeleton}>
    <Skeleton variant="rect" height={200} className={styles.mb} />
    <Skeleton variant="text" width="60%" className={styles.mb} />
    <Skeleton variant="text" width="40%" />
  </div>
);

export const TableSkeleton: React.FC = () => (
  <div className={styles.tableSkeleton}>
    <Skeleton variant="rect" height={40} className={styles.mb} />
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton key={i} variant="rect" height={60} className={styles.mb} />
    ))}
  </div>
);
