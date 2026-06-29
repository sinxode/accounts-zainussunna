import React from 'react';
import { ArrowDownCircle, ArrowUpCircle, BellRing, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import styles from '../../pages/operations/OperationsCenter.module.scss';
import { clsx } from 'clsx';
import { transactionService } from '../../lib/services';

interface KPICardProps {
  label: string;
  value: string;
  subtext: string;
  icon: React.ReactNode;
  variant: 'success' | 'danger' | 'warning' | 'primary';
}

const KPICard: React.FC<KPICardProps> = ({ label, value, subtext, icon, variant }) => {
  return (
    <div className={clsx(styles.kpiCard, styles[variant])}>
      <div className={clsx(styles.kpiIcon, styles[variant])}>
        {icon}
      </div>
      <div className={styles.kpiContent}>
        <span className={styles.kpiLabel}>{label}</span>
        <span className={styles.kpiValue}>{value}</span>
        <span className={styles.kpiSubtext}>{subtext}</span>
      </div>
    </div>
  );
};

export const TodaySummary: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['todaySummary'],
    queryFn: () => transactionService.getTodaySummary(),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className={styles.summaryGrid}>
      <KPICard 
        label="Today's Money In" 
        value={`₹${data?.moneyIn.toLocaleString() || 0}`} 
        subtext={`${data?.countIn || 0} Transactions`} 
        icon={<ArrowDownCircle size={24} />} 
        variant="success" 
      />
      <KPICard 
        label="Today's Money Out" 
        value={`₹${data?.moneyOut.toLocaleString() || 0}`} 
        subtext={`${data?.countOut || 0} Transactions`} 
        icon={<ArrowUpCircle size={24} />} 
        variant="danger" 
      />
      <KPICard 
        label="Pending Actions" 
        value="0" 
        subtext="Requires attention" 
        icon={<BellRing size={24} />} 
        variant="warning" 
      />
      <KPICard 
        label="Ops Completed" 
        value={`${(data?.countIn || 0) + (data?.countOut || 0)}`} 
        subtext="All systems go" 
        icon={<CheckCircle size={24} />} 
        variant="primary" 
      />
    </div>
  );
};
