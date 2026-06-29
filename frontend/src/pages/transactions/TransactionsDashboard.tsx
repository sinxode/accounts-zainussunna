import React from 'react';
import { 
  Receipt, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  RotateCcw, 
  Activity,
  Search,
  TrendingUp,
  ShieldAlert,
  Zap,
  Target,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '../../components/ui/PageContainer';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useOperationsDrawer } from '../../components/operations/drawers/OperationsDrawerContext';
import { reportingService } from '../../lib/reportingService';
import { formatCurrency } from '../../lib/utils';
import styles from './TransactionsDashboard.module.scss';
import { clsx } from 'clsx';

export const TransactionsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { openDrawer } = useOperationsDrawer();

  // Fetch daily summary stats from the backend
  const { data: dailyStats } = useQuery({
    queryKey: ['daily-summary'],
    queryFn: () => reportingService.getDailySummary()
  });

  const stats = [
    { 
      label: 'Total Transactions', 
      value: (dailyStats?.totalTransactions || 0).toLocaleString(), 
      icon: <Receipt size={24} />, 
      variant: 'primary' as const, 
      subtitle: 'Lifetime history' 
    },
    { 
      label: 'Money In', 
      value: formatCurrency(dailyStats?.credits || 0), 
      icon: <ArrowDownCircle size={24} />, 
      variant: 'success' as const, 
      subtitle: 'Gross collections' 
    },
    { 
      label: 'Money Out', 
      value: formatCurrency(dailyStats?.debits || 0), 
      icon: <ArrowUpCircle size={24} />, 
      variant: 'danger' as const, 
      subtitle: 'Gross payouts' 
    },
    { 
      label: "Today's Transactions", 
      value: (dailyStats?.todayTxCount || 0).toLocaleString(), 
      icon: <Activity size={24} />, 
      variant: 'neutral' as const, 
      subtitle: 'Active processing' 
    },
  ];

  const smartInsights = [
    { title: 'Most Active Student', value: 'Ahmed Khan', desc: '14 transactions this month', icon: <Zap size={18} />, color: 'primary' },
    { title: 'Largest Deposit', value: '₹25,000', desc: 'By Malik Bashir', icon: <TrendingUp size={18} />, color: 'success' },
    { title: 'Top Event Type', value: 'Store Bill', desc: '42% of total volume', icon: <Target size={18} />, color: 'warning' },
  ];

  const warningAlerts = [
    { title: 'Large Withdrawal', desc: '₹15,000 by Yusuf Raza', time: '2h ago', risk: 'medium' },
    { title: 'Multiple Reversals', desc: '3 reversals by Staff: Sarah', time: '4h ago', risk: 'high' },
    { title: 'Repeated Amount', desc: '5x ₹500 transactions detected', time: '1d ago', risk: 'low' },
  ];

  return (
    <PageContainer>
      <PageHeader 
        title="Transactions Dashboard" 
        subtitle="Understand global money movement and operational truth."
        actions={
          <div className="flex gap-2">
            <Button icon={<Search size={18} />} variant="soft" onClick={() => navigate('/transactions/explorer')}>Explorer</Button>
            <Button icon={<RotateCcw size={18} />} variant="soft" onClick={() => navigate('/transactions/reversals')}>Reversals</Button>
            <Button icon={<Plus size={18} />} onClick={() => openDrawer('deposit')}>New Entry</Button>
          </div>
        }
      />

      <div className={styles.grid}>
        {/* Row 1: KPI Cards */}
        <div className={styles.statsRow}>
          {stats.map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
        </div>

        <div className={styles.mainLayout}>
          <div className={styles.leftColumn}>
            {/* Section: Activity Trends */}
            <section className={styles.section}>
              <h3 className="label-sm mb-4">Money Movement Summary</h3>
              <div className={styles.movementGrid}>
                <Card padding="lg" className={styles.movementCard}>
                  <span className={styles.mLabel}>Monthly Net Movement</span>
                  <div className={styles.mValue}>+₹4,33,000</div>
                  <div className={styles.mBadge}>
                    <TrendingUp size={14} />
                    <span>12% Growth</span>
                  </div>
                </Card>
                <Card padding="lg" className={styles.movementCard}>
                  <span className={styles.mLabel}>Active Period Balance</span>
                  <div className={styles.mValue}>₹1,24,500</div>
                  <span className={styles.mDesc}>Currently held by academy</span>
                </Card>
              </div>
            </section>

            {/* Section: Transaction Types Breakdown */}
            <section className={styles.section}>
              <div className="flex-between mb-4">
                <h3 className="label-sm">Volume by Type</h3>
                <Button variant="ghost" size="sm">Full Analytics</Button>
              </div>
              <div className={styles.typeGrid}>
                {[
                  { label: 'Deposits', val: '45%', color: 'success' },
                  { label: 'Store Bills', val: '28%', color: 'warning' },
                  { label: 'Withdrawals', val: '15%', color: 'danger' },
                  { label: 'Other', val: '12%', color: 'primary' },
                ].map(item => (
                  <div key={item.label} className={styles.typeItem}>
                    <div className={styles.typeHeader}>
                      <span className={styles.typeLabel}>{item.label}</span>
                      <span className={styles.typeVal}>{item.val}</span>
                    </div>
                    <div className={styles.progressBase}>
                      <div className={clsx(styles.progressFill, styles[item.color])} style={{ width: item.val }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section: Action Required */}
            <section className={styles.section}>
              <h3 className="label-sm mb-4">Action Required</h3>
              <Card padding="md" className={styles.insightItem}>
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-primary">Pending Reversals</span>
                  <p className="text-xs text-muted">3 transactions await manual approval from managers.</p>
                  <Button variant="soft" size="sm" className="mt-2" onClick={() => navigate('/transactions/reversals')}>Review Pending</Button>
                </div>
              </Card>
            </section>

            {/* Section: Upcoming Operational Thresholds */}
            <section className={styles.section}>
              <h3 className="label-sm mb-4">Operational Thresholds</h3>
              <Card padding="md">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted">Daily Limit</span>
                      <span className="font-bold">
                        {formatCurrency(dailyStats?.todayVolume || 0)} / ₹10,00,000
                      </span>
                    </div>
                    <div className="w-full bg-tertiary h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-primary h-full transition-all duration-500" 
                        style={{ width: `${Math.min(((dailyStats?.todayVolume || 0) / 1000000) * 100, 100)}%` }} 
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted">Reversal Buffer</span>
                      <span className="font-bold">
                        {dailyStats?.todayReversals || 0} / 20 Used
                      </span>
                    </div>
                    <div className="w-full bg-tertiary h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-warning h-full transition-all duration-500" 
                        style={{ width: `${Math.min(((dailyStats?.todayReversals || 0) / 20) * 100, 100)}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </section>
          </div>

          <div className={styles.rightColumn}>
            {/* Section: Warning Center */}
            <section className={styles.section}>
              <div className="flex-between mb-4">
                <h3 className="label-sm">Warning Center</h3>
                <ShieldAlert size={18} className="text-danger" />
              </div>
              <div className={styles.warningStack}>
                {warningAlerts.map((alert, i) => (
                  <Card key={i} padding="md" className={styles.warningCard}>
                    <div className={styles.wHeader}>
                      <span className={styles.wTitle}>{alert.title}</span>
                      <span className={styles.wTime}>{alert.time}</span>
                    </div>
                    <p className={styles.wDesc}>{alert.desc}</p>
                    <Badge variant={alert.risk === 'high' ? 'danger' : alert.risk === 'medium' ? 'warning' : 'neutral'} size="sm">
                      {alert.risk} risk
                    </Badge>
                  </Card>
                ))}
              </div>
            </section>

            {/* Section: Smart Insights */}
            <section className={styles.section}>
              <h3 className="label-sm mb-4">Smart Insights</h3>
              <div className={styles.insightsStack}>
                {smartInsights.map((insight, i) => (
                  <Card key={i} padding="md" className={styles.insightItem}>
                    <div className={clsx(styles.iIcon, styles[insight.color])}>
                      {insight.icon}
                    </div>
                    <div className={styles.iContent}>
                      <span className={styles.iLabel}>{insight.title}</span>
                      <strong className={styles.iValue}>{insight.value}</strong>
                      <p className={styles.iDesc}>{insight.desc}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
