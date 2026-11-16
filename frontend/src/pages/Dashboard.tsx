import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowLeftRight, 
  Wallet,
  ChevronRight
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TransactionRow } from '../components/ui/TransactionRow';
import { Skeleton } from '../components/ui/Skeleton';
import { useOperationsDrawer } from '../components/operations/drawers/OperationsDrawerContext';
import { studentService, borrowerService, transactionService } from '../lib/services';
import { reportingService } from '../lib/reportingService';
import styles from './Dashboard.module.scss';
import { clsx } from 'clsx';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { openDrawer } = useOperationsDrawer();

  // Authoritative Queries
  const { data: healthSummary = [], isLoading: healthLoading } = useQuery({
    queryKey: ['student-health-dashboard'],
    queryFn: () => studentService.getHealthSummary()
  });

  const { data: borrowerStats, isLoading: borrowerLoading } = useQuery({
    queryKey: ['borrower-stats-dashboard'],
    queryFn: () => borrowerService.getDashboardStats()
  });

  const { data: recentTransactions = [], isLoading: txLoading } = useQuery({
    queryKey: ['recent-transactions-dashboard'],
    queryFn: () => transactionService.list(8)
  });

  const { data: dailyStats, isLoading: statsLoading } = useQuery({
    queryKey: ['daily-summary'],
    queryFn: () => reportingService.getDailySummary()
  });

  const isLoading = healthLoading || borrowerLoading || txLoading || statsLoading;

  // Key metrics
  const totalStudentBalance = healthSummary.reduce((sum, s) => sum + (Number(s.current_balance) || 0), 0);
  const totalDeposits = dailyStats?.credits || 0;
  const totalWithdrawals = dailyStats?.debits || 0;
  const netThisMonth = totalDeposits - totalWithdrawals;
  const outstandingLoans = borrowerStats?.outstanding || 0;

  // Overdrawn students
  const studentsNeedingAttention = healthSummary
    .filter(s => s.health_status === 'negative' || (Number(s.current_balance) || 0) < 0)
    .slice(0, 4);

  // Cash account breakdown
  const cashAccounts = [
    {
      id: 'student-pool',
      name: 'Student Pool',
      balance: totalStudentBalance,
      inThisMonth: totalDeposits,
      outThisMonth: totalWithdrawals
    },
    {
      id: 'external-loans',
      name: 'External Loans',
      balance: outstandingLoans,
      inThisMonth: borrowerStats?.totalRecoveries || 0,
      outThisMonth: 0
    },
    {
      id: 'cash-reserve',
      name: 'Central Cashbook',
      balance: totalStudentBalance + outstandingLoans,
      inThisMonth: totalDeposits,
      outThisMonth: totalWithdrawals
    }
  ];

  const formatHeroBalance = (amount: number) => {
    const formatted = Math.abs(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const [whole, decimal] = formatted.split('.');
    return (
      <span className={styles.heroAmount}>
        <span className={styles.currencySymbol}>₹</span>
        <span className={styles.wholeNum}>{whole}</span>
        <span className={styles.decimalNum}>.{decimal}</span>
      </span>
    );
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* 1. ULTRA-MODERN HERO BANNER */}
      {isLoading ? (
        <Skeleton height="160px" borderRadius="20px" className={styles.heroSkeleton} />
      ) : (
        <div className={styles.heroCard}>
          <div className={styles.heroMain}>
            <div className={styles.heroLeft}>
              <div className={styles.heroBadge}>
                <span className={styles.badgeDot} />
                <span>Active Ledger</span>
              </div>
              <div className={styles.heroBalanceWrap}>
                {formatHeroBalance(totalStudentBalance)}
              </div>
            </div>

            <div className={styles.heroActions}>
              <Button 
                variant="lime" 
                size="md"
                icon={<ArrowDownLeft size={16} strokeWidth={2.5} />}
                onClick={() => openDrawer('deposit')}
              >
                Deposit
              </Button>
              <Button 
                variant="hero-outline" 
                size="md"
                icon={<ArrowUpRight size={16} strokeWidth={2} />}
                onClick={() => openDrawer('withdrawal')}
              >
                Withdraw
              </Button>
              <Button 
                variant="hero-outline" 
                size="md"
                icon={<ArrowLeftRight size={16} strokeWidth={2} />}
                onClick={() => openDrawer('internal')}
              >
                Transfer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. FLAT METRICS STRIP (4 COLUMNS) */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Money In</span>
          <span className={clsx(styles.metricValue, styles.credit)}>
            +₹{totalDeposits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Money Out</span>
          <span className={clsx(styles.metricValue, styles.debit)}>
            −₹{totalWithdrawals.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Net Cash Flow</span>
          <span className={clsx(styles.metricValue, netThisMonth >= 0 ? styles.credit : styles.debit)}>
            {netThisMonth >= 0 ? '+' : '−'}₹{Math.abs(netThisMonth).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Accounts</span>
          <div className={styles.metricRow}>
            <span className={styles.metricValue}>{healthSummary.length} Active</span>
            {studentsNeedingAttention.length > 0 && (
              <span className={styles.alertChip}>
                {studentsNeedingAttention.length} overdrawn
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. MAIN SECTION: 2-COLUMN SPLIT */}
      <div className={styles.mainGrid}>
        {/* Left Column: Recent Operations (Span 8) */}
        <Card 
          padding="lg" 
          className={styles.transactionsCard}
          title="Recent Transactions"
          headerAction={
            <Link to="/transactions" className={styles.viewLink}>
              View all →
            </Link>
          }
        >
          {isLoading ? (
            <div className={styles.skeletonList}>
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} height="52px" borderRadius="12px" />)}
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className={styles.emptyWrap}>
              <p>No recent transactions recorded.</p>
              <Button size="sm" variant="secondary" onClick={() => openDrawer('deposit')}>
                Add Deposit
              </Button>
            </div>
          ) : (
            <div className={styles.txList}>
              {recentTransactions.map((tx: any) => (
                <TransactionRow
                  key={tx.id}
                  id={tx.id}
                  type={tx.transaction_type || tx.type || 'deposit'}
                  direction={tx.direction}
                  amount={tx.amount}
                  purpose={tx.purpose}
                  studentName={tx.students?.name || tx.entity_name}
                  accountName={tx.students?.enrolment_no}
                  date={tx.transaction_date || tx.date}
                  onClick={() => navigate('/transactions')}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Right Column: Accounts & Alerts (Span 4) */}
        <div className={styles.sideColumn}>
          {/* Cash Accounts Card */}
          <Card 
            padding="lg" 
            className={styles.accountsCard}
            title="Cash Accounts"
            headerAction={
              <Link to="/operations" className={styles.viewLink}>
                Manage →
              </Link>
            }
          >
            <div className={styles.accountsList}>
              {cashAccounts.map((acc) => (
                <div 
                  key={acc.id} 
                  className={styles.accountRow}
                  onClick={() => navigate('/operations')}
                >
                  <div className={styles.accountIcon}>
                    <Wallet size={15} />
                  </div>
                  <div className={styles.accountInfo}>
                    <span className={styles.accountName}>{acc.name}</span>
                    <span className={styles.accountFlow}>
                      ↑ ₹{acc.inThisMonth.toLocaleString('en-IN')} · ↓ ₹{acc.outThisMonth.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <span className={styles.accountBalance}>
                    ₹{acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Overdrawn Alerts if present */}
          {studentsNeedingAttention.length > 0 && (
            <Card 
              padding="lg" 
              className={styles.alertCard}
              title="Overdrawn Accounts"
              headerAction={
                <Link to="/students" className={styles.viewLink}>
                  Directory →
                </Link>
              }
            >
              <div className={styles.attentionList}>
                {studentsNeedingAttention.map((s) => (
                  <div 
                    key={s.id} 
                    className={styles.attentionItem}
                    onClick={() => navigate(`/students/${s.id}`)}
                  >
                    <div className={styles.attentionInfo}>
                      <span className={styles.attentionName}>{s.name}</span>
                      <span className={styles.attentionEnr}>{s.enrolment_no}</span>
                    </div>
                    <div className={styles.attentionBalance}>
                      <span className={styles.negativeAmount}>
                        −₹{Math.abs(Number(s.current_balance)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <ChevronRight size={14} className={styles.chevron} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
