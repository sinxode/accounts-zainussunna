import React from 'react';
import { clsx } from 'clsx';
import styles from './StatGrid.module.scss';

export interface StatGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

export const StatGrid: React.FC<StatGridProps> = ({
  children,
  columns = 4,
  className
}) => {
  return (
    <div className={clsx(styles.statGrid, styles[`cols-${columns}`], className)}>
      {children}
    </div>
  );
};
