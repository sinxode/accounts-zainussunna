import React from 'react';
import { clsx } from 'clsx';
import styles from './AmountInput.module.scss';

export interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  error?: string;
  quickAmounts?: number[];
  className?: string;
}

export const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChange,
  label,
  placeholder = '0',
  autoFocus = false,
  disabled = false,
  error,
  quickAmounts = [500, 1000, 5000],
  className
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // Allow empty or positive decimal numbers with up to 2 decimal places
    if (val === '' || /^\d*(\.\d{0,2})?$/.test(val)) {
      onChange(val);
    }
  };

  const handleAddQuick = (addVal: number) => {
    const current = parseFloat(value) || 0;
    onChange((current + addVal).toFixed(2).replace(/\.00$/, ''));
  };

  return (
    <div className={clsx(styles.container, className)}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={clsx(styles.inputCard, error && styles.hasError, disabled && styles.disabled)}>
        <span className={styles.currencySymbol}>₹</span>
        <input
          type="text"
          inputMode="decimal"
          pattern="[0-9]*[.]?[0-9]*"
          autoComplete="off"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled}
          className={styles.amountField}
        />
        {value && !disabled && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={() => onChange('')}
            aria-label="Clear amount"
          >
            ✕
          </button>
        )}
      </div>

      {quickAmounts && quickAmounts.length > 0 && !disabled && (
        <div className={styles.quickChips}>
          {quickAmounts.map((amt) => (
            <button
              key={amt}
              type="button"
              className={styles.quickChip}
              onClick={() => handleAddQuick(amt)}
            >
              +{amt.toLocaleString('en-IN')}
            </button>
          ))}
        </div>
      )}

      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};
