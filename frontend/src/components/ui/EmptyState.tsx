import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from './Button';
import styles from './EmptyState.module.scss';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>
        <Icon size={48} strokeWidth={1.5} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && (
        <Button onClick={action.onClick} variant="primary" className={styles.button}>
          {action.label}
        </Button>
      )}
    </div>
  );
};
