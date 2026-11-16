import React from 'react';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Check, X } from 'lucide-react';
import { clsx } from 'clsx';
import styles from './TransactionRow.module.scss';

export interface TransactionRowProps {
  id?: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | string;
  direction?: 'credit' | 'debit';
  amount: number;
  purpose: string;
  studentName?: string;
  accountName?: string;
  date: string | Date;
  status?: string;
  needsAttention?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onClick?: () => void;
  className?: string;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  type,
  direction,
  amount,
  purpose,
  studentName,
  accountName,
  date,
  needsAttention = false,
  onApprove,
  onReject,
  onClick,
  className
}) => {
  const isCredit = direction === 'credit' || type === 'deposit';
  const isTransfer = type === 'transfer' || type === 'internal' || type === 'internal_transfer';
  const isDebit = !isCredit && !isTransfer;

  const formattedAmount = `${isCredit ? '+' : isDebit ? '−' : ''}₹${Math.abs(amount).toLocaleString('en-IN')}`;

  const renderIcon = () => {
    if (isCredit) {
      return <ArrowDownLeft className={styles.iconSvg} size={16} strokeWidth={2.2} />;
    }
    if (isDebit) {
      return <ArrowUpRight className={styles.iconSvg} size={16} strokeWidth={2.2} />;
    }
    return <ArrowLeftRight className={styles.iconSvg} size={16} strokeWidth={2.2} />;
  };

  const formatDate = (d: string | Date) => {
    if (!d) return '';
    const dateObj = typeof d === 'string' ? new Date(d) : d;
    return dateObj.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const metaParts = [studentName, accountName].filter(Boolean);

  return (
    <div
      className={clsx(
        styles.transactionRow,
        needsAttention && styles.needsAttention,
        onClick && styles.clickable,
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      aria-label={`${purpose}, ${isCredit ? 'plus' : 'minus'} ${Math.abs(amount)} rupees`}
    >
      {/* 40px Circular Icon */}
      <div className={clsx(
        styles.iconWrapper,
        isCredit && styles.creditIcon,
        isDebit && styles.debitIcon,
        isTransfer && styles.transferIcon
      )}>
        {renderIcon()}
      </div>

      {/* Primary & Secondary Meta */}
      <div className={styles.centerMeta}>
        <span className={styles.primaryText}>{purpose || 'Untitled Entry'}</span>
        <span className={styles.secondaryMeta}>
          {metaParts.length > 0 ? metaParts.join(' • ') : (type || 'General')}
        </span>
      </div>

      {/* Siburian Inline Approval (when needs attention) */}
      {needsAttention && (onApprove || onReject) ? (
        <div className={styles.actionPills} onClick={(e) => e.stopPropagation()}>
          {onApprove && (
            <button 
              type="button" 
              className={clsx(styles.circleBtn, styles.approveBtn)} 
              onClick={onApprove} 
              aria-label="Approve"
            >
              <Check size={16} strokeWidth={2.5} />
            </button>
          )}
          {onReject && (
            <button 
              type="button" 
              className={clsx(styles.circleBtn, styles.rejectBtn)} 
              onClick={onReject} 
              aria-label="Reject"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>
      ) : (
        /* Right: Signed Amount & Date */
        <div className={styles.rightMeta}>
          <span className={clsx(
            styles.amount,
            isCredit && styles.creditAmount,
            isDebit && styles.debitAmount,
            isTransfer && styles.transferAmount
          )}>
            {formattedAmount}
          </span>
          <span className={styles.dateText}>{formatDate(date)}</span>
        </div>
      )}
    </div>
  );
};
