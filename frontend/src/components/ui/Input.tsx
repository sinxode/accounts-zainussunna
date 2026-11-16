import React from 'react';
import { clsx } from 'clsx';
import styles from './Input.module.scss';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  as?: 'input' | 'textarea';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'cell';
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error,
  icon,
  rightElement,
  className,
  as = 'input',
  size = 'lg',
  variant = 'default',
  fullWidth,
  ...props
}) => {
  const Component = as;

  return (
    <div className={clsx(styles.container, fullWidth && styles.fullWidth, className)}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={clsx(styles.wrapper, error && styles.hasError)}>
        {icon && <div className={styles.icon}>{icon}</div>}
        <Component
          className={clsx(
            styles.field,
            styles[size],
            styles[variant],
            icon && styles.withIcon,
            rightElement && styles.withRightElement
          )}
          {...(props as any)}
        />
        {rightElement && <div className={styles.rightElement}>{rightElement}</div>}
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
      {!error && helperText && <span className={styles.helperText}>{helperText}</span>}
    </div>
  );
};

export const Field = Input;
