import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { Card } from './Card';
import styles from './QuickActionCard.module.scss';

interface QuickActionCardProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  shortcut?: string;
  onClick: () => void;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'secondary' | 'error' | 'info';
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  icon: Icon,
  label,
  description,
  shortcut,
  onClick,
  variant = 'primary'
}) => {
  const mappedVariant = variant === 'error' ? 'danger' : variant === 'secondary' ? 'primary' : variant;

  return (
    <Card 
      variant="interactive" 
      onClick={onClick} 
      className={styles.card}
      padding="md"
    >
      <div className={clsx(styles.iconWrapper, styles[mappedVariant])}>
        <Icon size={24} />
      </div>
      <div className={styles.info}>
        <h4 className={styles.label}>{label}</h4>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {shortcut && <kbd className={styles.shortcut}>{shortcut}</kbd>}
    </Card>
  );
};
