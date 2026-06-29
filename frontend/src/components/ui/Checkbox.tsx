import React from 'react';
import { Check } from 'lucide-react';
import { clsx } from 'clsx';
import styles from './Checkbox.module.scss';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, className, ...props }) => {
  return (
    <label className={clsx(styles.container, className)}>
      <input type="checkbox" className={styles.input} {...props} />
      <div className={styles.checkbox}>
        <Check size={14} className={styles.checkIcon} />
      </div>
      <span className={styles.label}>{label}</span>
    </label>
  );
};
