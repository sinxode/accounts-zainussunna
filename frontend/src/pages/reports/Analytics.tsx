import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  Calendar,
  AlertCircle,
  Scale
} from 'lucide-react';
import { ChartCard } from '../../components/reports/ChartCard';
import { PageContainer } from '../../components/ui/PageContainer';
import { PageHeader } from '../../components/ui/PageHeader';
import { ReportTabs } from '../../components/reports/ReportTabs';
import { reportingService } from '../../lib/reportingService';
import styles from './Analytics.module.scss';
import { clsx } from 'clsx';

export const Analytics: React.FC = () => {
  const { data: insights, isLoading } = useQuery({
    queryKey: ['smartInsights'],
    queryFn: reportingService.getSmartInsights
  });

  const growthData = insights?.growthData || [];
  const borrowerRiskData = insights?.borrowerRiskData || [
    { name: 'Low Risk', value: 0 },
    { name: 'Medium Risk', value: 0 },
    { name: 'High Risk', value: 0 },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Analytics Dashboard"
        subtitle="Real-time financial intelligence and trends."
        actions={
          <div className="flex gap-2 items-center">
            <Calendar size={16} className="text-muted" />
            <span className="text-sm font-bold text-secondary">Last 6 Months</span>
          </div>
        }
      />

      <ReportTabs />

      {isLoading ? (
        <div className={styles.loadingWrapper}>
          <div className={clsx("glass-effect", styles.loadingBox)}>Calculating Analytics & Intelligence Trends...</div>
        </div>
      ) : (
        <>
          <section className={styles.insightSection}>
            <div className={styles.insightGrid}>
              <div className={styles.insightCard}>
            <div className={styles.iIcon}><AlertCircle className="text-warning" /></div>
            <div className={styles.iContent}>
              <span className={styles.iLabel}>Low Balance Students</span>
              <div className={styles.iValue}>{insights?.lowBalanceCount || 0}</div>
              <p className={styles.iDesc}>Attention recommended</p>
            </div>
          </div>
          <div className={styles.insightCard}>
            <div className={styles.iIcon}><TrendingUp className="text-success" /></div>
            <div className={styles.iContent}>
              <span className={styles.iLabel}>Highest Balance</span>
              <div className={styles.iValue}>₹{insights?.highestBalance?.current_balance?.toLocaleString() || '0'}</div>
              <p className={styles.iDesc}>{insights?.highestBalance?.name || 'N/A'}</p>
            </div>
          </div>
          <div className={styles.insightCard}>
            <div className={styles.iIcon}><Scale className="text-info" /></div>
            <div className={styles.iContent}>
              <span className={styles.iLabel}>Capital Utilization</span>
              <div className={styles.iValue}>{insights?.utilizationRate?.toFixed(1) || '0'}%</div>
              <p className={styles.iDesc}>Active loan exposure rate</p>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.chartsGrid}>
        <div className={styles.span2}>
          <ChartCard 
            title="Revenue vs Expenditure Trend" 
            type="line" 
            data={growthData} 
            dataKeys={['collections', 'withdrawals']} 
            colors={['#10b981', '#ef4444']} 
          />
        </div>
        <ChartCard 
          title="Borrower Risk Breakdown" 
          type="pie" 
          data={borrowerRiskData} 
          dataKeys={['value']} 
          colors={['#10b981', '#f59e0b', '#ef4444']} 
        />
      </div>

      <div className={styles.chartsGrid}>
        <ChartCard 
          title="Monthly Collections" 
          type="bar" 
          data={growthData} 
          dataKeys={['collections']} 
          colors={['#3b82f6']} 
        />
        <div className={styles.span2}>
          <ChartCard 
            title="Operational Growth" 
            type="bar" 
            data={growthData} 
            dataKeys={['collections', 'withdrawals']} 
          />
        </div>
      </div>
      </>
      )}
    </PageContainer>
  );
};
