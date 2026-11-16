import React from 'react';
import { clsx } from 'clsx';
import styles from './PillTabs.module.scss';

export interface TabOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  count?: number;
  icon?: React.ReactNode;
}

export interface PillTabsProps<T extends string = string> {
  options: TabOption<T>[];
  value: T;
  onChange: (val: T) => void;
  variant?: 'lime' | 'dark' | 'subtle';
  size?: 'sm' | 'md';
  className?: string;
  fullWidth?: boolean;
}

export const PillTabs = <T extends string>({
  options,
  value,
  onChange,
  variant = 'lime',
  size = 'md',
  className,
  fullWidth = false
}: PillTabsProps<T>) => {
  return (
    <div 
      className={clsx(
        styles.pillTabsContainer,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        className
      )}
      role="tablist"
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={clsx(styles.tab, isActive && styles.active)}
            onClick={() => onChange(opt.value)}
          >
            {opt.icon && <span className={styles.icon}>{opt.icon}</span>}
            <span className={styles.label}>{opt.label}</span>
            {typeof opt.count === 'number' && (
              <span className={clsx(styles.countBadge, isActive && styles.activeCount)}>
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
