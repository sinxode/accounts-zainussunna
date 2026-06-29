import React from 'react';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import styles from './ConfirmationModal.module.scss';
import { clsx } from 'clsx';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm Action',
  variant = 'info',
  loading
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className={styles.container}>
        <div className={clsx(styles.iconArea, styles[variant])}>
          {variant === 'danger' && <ShieldAlert size={32} />}
          {variant === 'warning' && <AlertTriangle size={32} />}
          {variant === 'info' && <Info size={32} />}
        </div>
        
        <p className={styles.message}>{message}</p>

        <div className={styles.actions}>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button 
            variant={variant === 'danger' ? 'danger' : 'primary'} 
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
