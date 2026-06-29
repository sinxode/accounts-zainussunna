import React from 'react';
import { StatCard } from '../ui/StatCard';
import { 
  Wallet, 
  ArrowLeftRight, 
  AlertTriangle, 
  IndianRupee 
} from 'lucide-react';
import styles from '../../pages/transfers/InternalTransfers.module.scss';
import { useQuery } from '@tanstack/react-query';
import { transactionService } from '../../lib/services';

export const TransferDashboard: React.FC = () => {
  const { data } = useQuery({
    queryKey: ['transferSummary'],
    queryFn: () => transactionService.getTransferSummary(),
  });

  return (
    <div className={styles.kpiGrid}>
      <StatCard 
        label="Outstanding Amount" 
        value={`₹${data?.totalOutstanding.toLocaleString() || 0}`} 
        icon={<Wallet size={24} />} 
        variant="warning" 
      />
      <StatCard 
        label="Active Transfers" 
        value={`${data?.activeTransfers || 0}`} 
        icon={<ArrowLeftRight size={24} />} 
        variant="primary" 
      />
      <StatCard 
        label="Overdue Transfers" 
        value={`${data?.overdueTransfers || 0}`} 
        icon={<AlertTriangle size={24} />} 
        variant="danger" 
      />
      <StatCard 
        label="Repayments This Month" 
        value={`₹${data?.repaymentsThisMonth?.toLocaleString() || 0}`} 
        icon={<IndianRupee size={24} />} 
        variant="info" 
      />
    </div>
  );
};
