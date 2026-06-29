import React from 'react';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Copy, 
  ArrowLeftRight, 
  Landmark, 
  RefreshCcw, 
  UsersRound, 
  LayoutTemplate 
} from 'lucide-react';
import { clsx } from 'clsx';
import styles from '../../pages/operations/OperationsCenter.module.scss';
import { useOperationsDrawer } from './drawers/OperationsDrawerContext';
import type { DrawerType } from './drawers/OperationsDrawerContext';

export const QuickActions: React.FC = () => {
  const { openDrawer } = useOperationsDrawer();

  const actions: { id: DrawerType; title: string; description: string; icon: React.ReactNode; variant: string }[] = [
    {
      id: 'deposit',
      title: 'Deposit',
      description: 'Add money to a student\'s account',
      icon: <ArrowDownCircle size={24} />,
      variant: 'success'
    },
    {
      id: 'withdrawal',
      title: 'Withdrawal',
      description: 'Deduct money from a student\'s account',
      icon: <ArrowUpCircle size={24} />,
      variant: 'danger'
    },
    {
      id: 'bulk',
      title: 'Bulk Operation',
      description: 'Process transactions for multiple students',
      icon: <Copy size={24} />,
      variant: 'primary'
    },
    {
      id: 'internal',
      title: 'Internal Transfer',
      description: 'Transfer funds between two students',
      icon: <ArrowLeftRight size={24} />,
      variant: 'neutral'
    },
    {
      id: 'external',
      title: 'External Loan',
      description: 'Record money borrowed from outside',
      icon: <Landmark size={24} />,
      variant: 'warning'
    },
    {
      id: 'recovery',
      title: 'Recovery',
      description: 'Process a loan repayment',
      icon: <RefreshCcw size={24} />,
      variant: 'success'
    },
    {
      id: 'batch',
      title: 'Create Batch',
      description: 'Group students for faster selection',
      icon: <UsersRound size={24} />,
      variant: 'primary'
    },
    {
      id: 'preset',
      title: 'Create Preset',
      description: 'Save an operation configuration',
      icon: <LayoutTemplate size={24} />,
      variant: 'neutral'
    }
  ];

  return (
    <div className={styles.actionGrid}>
      {actions.map(action => (
        <div key={action.id} className={styles.actionCard} onClick={() => openDrawer(action.id)}>
          <div className={clsx(styles.actionIcon, styles[action.variant])}>
            {action.icon}
          </div>
          <div className={styles.actionContent}>
            <h3 className={styles.actionTitle}>{action.title}</h3>
            <p className={styles.actionDesc}>{action.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
