import React from 'react';
import { clsx } from 'clsx';
import styles from './Input.module.scss';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>, 'size'> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  as?: 'input' | 'textarea';
  size?: 'md' | 'lg';
  variant?: 'default' | 'cell';
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  className,
  as = 'input',
  size = 'md',
  variant = 'default',
  fullWidth,
  ...props
}) => {
  const Component = as;

  return (
    <div className={clsx(styles.container, className)}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={clsx(styles.wrapper, error && styles.hasError)}>
        {icon && <div className={styles.icon}>{icon}</div>}
        <Component
          className={clsx(styles.field, styles[size], styles[variant], icon && styles.withIcon)}
          {...(props as any)}
        />
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};

