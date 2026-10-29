import React from 'react';
import { PageContainer } from '../components/ui/PageContainer';
import { Button } from '../components/ui/Button';
import styles from './Dashboard.module.scss';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { clsx } from 'clsx';
import { 
  Plus, 
  Minus, 
  Layers3, 
  ArrowLeftRight, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  TrendingUp, 
  HandCoins, 
  AlertTriangle, 
  Activity, 
  Wallet, 
  ChevronRight, 
  Calendar, 
  Sparkles, 
  Clock,
  Users,
  Undo2,
  ShieldAlert,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useOperationsDrawer } from '../components/operations/drawers/OperationsDrawerContext';
import { useAuth } from '../contexts/AuthContext';
import { studentService, borrowerService, transactionService } from '../lib/services';
import { reportingService } from '../lib/reportingService';
import { formatCurrency, formatCurrencyCompact, formatRelativeTime } from '../lib/utils';
import { Skeleton } from '../components/ui/Skeleton';

interface DashboardTx {
  id: string;
  student_id: string;
  event_id: string | null;
  transaction_type: string;
  direction: 'credit' | 'debit';
  purpose: string;
  amount: number;
  transaction_date: string;
  is_reversed?: boolean;
  reversal_of_id?: string | null;
  students: {
    name: string;
    enrolment_no: string;
  } | null;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { openDrawer } = useOperationsDrawer();
  const { profile, user } = useAuth();
  
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Administrator';
  const userRole = profile?.role || 'admin';
  const canManageMoney = ['super_admin', 'admin', 'owner', 'manager'].includes(userRole);

  // Authoritative Queries from Database Views
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

  const { data: borrowersList = [], isLoading: borrowersLoading } = useQuery({
    queryKey: ['borrowers-dashboard'],
    queryFn: () => borrowerService.list()
  });

  const { data: dailyStats, isLoading: statsLoading } = useQuery({
    queryKey: ['daily-summary'],
    queryFn: () => reportingService.getDailySummary()
  });

  // Calculate Authoritative Figures from database views
  const totalStudentsCount = healthSummary.length;
  const activeStudentsCount = healthSummary.filter(s => s.status === 'active').length;
  const totalStudentBalance = healthSummary.reduce((sum, s) => sum + (Number(s.current_balance) || 0), 0);
  const totalDeposits = dailyStats?.credits || 0;
  const totalWithdrawals = dailyStats?.debits || 0;
  const outstandingLoans = borrowerStats?.outstanding || 0;

  // Filter accounts needing attention
  const negativeStudents = healthSummary.filter(
    s => s.health_status === 'negative' || (Number(s.current_balance) || 0) < 0
  );
  const lowBalanceStudents = healthSummary.filter(s => s.health_status === 'low');

  const isLoading = healthLoading || borrowerLoading || txLoading || statsLoading;

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <PageContainer>
      <div className={styles.dashboardGrid}>
        
        {/* Welcome Section */}
        <div className={styles.welcomeBanner}>
          <div className={styles.welcomeText}>
            <h2>Welcome, {displayName}</h2>
            <p>Zainussunna Academy Financial Ledger & Control Center</p>
          </div>
          <div className={styles.systemBadge}>
            <div className={styles.pulseDot} />
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Calendar size={14} /> {formattedDate}
            </span>
          </div>
        </div>

        {/* Negative Balance Alert Banner (Authoritative from student_health) */}
        {negativeStudents.length > 0 && (
          <div className={styles.negativeAlertBanner}>
            <div className={styles.negativeAlertHeader}>
              <div className={styles.negativeAlertTitle}>
                <ShieldAlert className="text-danger animate-pulse" size={24} />
                <div>
                  <h3>Action Required: Negative Ledger Balances ({negativeStudents.length})</h3>
                  <p className={styles.negativeAlertText}>
                    The following accounts have negative balances (overdrawn funds) that require immediate deposit reconciliation:
                  </p>
                </div>
              </div>
              <Button 
                variant="danger" 
                size="sm" 
                onClick={() => navigate('/students')}
              >
                View Student Directory
              </Button>
            </div>

            <div className={styles.negativeStudentsGrid}>
              {negativeStudents.slice(0, 4).map((student) => (
                <div 
                  key={student.id} 
                  className={styles.negativeStudentCard}
                  onClick={() => navigate(`/students/${student.id}`)}
                >
                  <div>
                    <div className="font-bold text-sm text-gray-900">{student.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{student.enrolment_no}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-red-600 font-mono">
                      {formatCurrency(student.current_balance)}
                    </div>
                    <span className="text-[11px] text-red-500 flex items-center justify-end gap-0.5">
                      Review <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Authoritative Primary Financial Metrics Row */}
        <div className={styles.statsRow}>
          {isLoading ? (
            Array(4).fill(0).map((_, i) => <Skeleton key={i} height="130px" borderRadius="20px" />)
          ) : (
            <>
              {/* Total Student Balances (Liability Pool) */}
              <div className={clsx(styles.statCardGlow, styles.primary)}>
                <div className={styles.statCardHeader}>
                  <div className={clsx(styles.statIconContainer, styles.primary)}>
                    <Wallet size={22} />
                  </div>
                  <span className={clsx(styles.statBadgeText, "text-primary flex items-center gap-0.5")}>
                    <Sparkles size={12} /> Liability Pool
                  </span>
                </div>
                <div className={styles.statCardContent}>
                  <span className={styles.statLabel}>Total Student Balances</span>
                  <h3 className={styles.statValue}>{formatCurrency(totalStudentBalance)}</h3>
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    Funds held in trust (not academy revenue)
                  </span>
                </div>
              </div>

              {/* Active Students */}
              <div className={clsx(styles.statCardGlow, styles.primary)}>
                <div className={styles.statCardHeader}>
                  <div className={clsx(styles.statIconContainer, styles.primary)}>
                    <Users size={22} />
                  </div>
                  <span className={clsx(styles.statBadgeText, "text-primary flex items-center gap-0.5")}>
                    <Activity size={12} /> Enrolments
                  </span>
                </div>
                <div className={styles.statCardContent}>
                  <span className={styles.statLabel}>Active Students</span>
                  <h3 className={styles.statValue}>{activeStudentsCount}</h3>
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    Out of {totalStudentsCount} registered accounts
                  </span>
                </div>
              </div>

              {/* Total Inflow (Deposits) */}
              <div className={clsx(styles.statCardGlow, styles.success)}>
                <div className={styles.statCardHeader}>
                  <div className={clsx(styles.statIconContainer, styles.success)}>
                    <ArrowDownCircle size={22} />
                  </div>
                  <span className={clsx(styles.statBadgeText, "text-success flex items-center gap-0.5")}>
                    <TrendingUp size={12} /> Cumulative Inflow
                  </span>
                </div>
                <div className={styles.statCardContent}>
                  <span className={styles.statLabel}>Cumulative Deposits</span>
                  <h3 className={styles.statValue}>{formatCurrency(totalDeposits)}</h3>
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    Verified deposits to student accounts
                  </span>
                </div>
              </div>

              {/* Total Outflow (Withdrawals) */}
              <div className={clsx(styles.statCardGlow, styles.danger)}>
                <div className={styles.statCardHeader}>
                  <div className={clsx(styles.statIconContainer, styles.danger)}>
                    <ArrowUpCircle size={22} />
                  </div>
                  <span className={clsx(styles.statBadgeText, "text-danger flex items-center gap-0.5")}>
                    <Clock size={12} /> Cumulative Outflow
                  </span>
                </div>
                <div className={styles.statCardContent}>
                  <span className={styles.statLabel}>Cumulative Withdrawals</span>
                  <h3 className={styles.statValue}>{formatCurrency(totalWithdrawals)}</h3>
                  <span className="text-[11px] text-gray-500 mt-1 block">
                    Disbursed from student accounts
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Secondary Authoritative Details Row */}
        <div className={styles.secondaryStatsRow}>
          {isLoading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} height="85px" borderRadius="16px" />)
          ) : (
            <>
              {/* External Borrower Exposure */}
              <div className={clsx(styles.statCardGlow)}>
                <div className="flex justify-between items-center">
                  <div className={styles.statCardContent}>
                    <span className={styles.statLabel}>Borrower Loan Exposure</span>
                    <h4 className={clsx(styles.statValue, "text-warning")}>
                      {formatCurrency(outstandingLoans)}
                    </h4>
                    <span className="text-[11px] text-gray-500">
                      Across {borrowerStats?.activeBorrowers || 0} active external borrower(s)
                    </span>
                  </div>
                  <div className={clsx(styles.statIconContainer, styles.warning)}>
                    <HandCoins size={20} />
                  </div>
                </div>
              </div>

              {/* Accounts in Good Standing */}
              <div className={clsx(styles.statCardGlow)}>
                <div className="flex justify-between items-center">
                  <div className={styles.statCardContent}>
                    <span className={styles.statLabel}>Healthy Accounts</span>
                    <h4 className={clsx(styles.statValue, "text-success")}>
                      {healthSummary.filter(s => s.health_status === 'healthy').length}
                    </h4>
                    <span className="text-[11px] text-gray-500">
                      Balance exceeding safe threshold (≥ ₹500)
                    </span>
                  </div>
                  <div className={clsx(styles.statIconContainer, styles.success)}>
                    <Activity size={20} />
                  </div>
                </div>
              </div>

              {/* Low / Critical Accounts */}
              <div className={clsx(styles.statCardGlow)}>
                <div className="flex justify-between items-center">
                  <div className={styles.statCardContent}>
                    <span className={styles.statLabel}>Low / Empty Balances</span>
                    <h4 className={clsx(styles.statValue, "text-danger")}>
                      {lowBalanceStudents.length + healthSummary.filter(s => s.health_status === 'empty').length}
                    </h4>
                    <span className="text-[11px] text-gray-500">
                      Accounts requiring top-up
                    </span>
                  </div>
                  <div className={clsx(styles.statIconContainer, styles.danger)}>
                    <AlertTriangle size={20} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Main Content Layout */}
        <div className={styles.mainLayout}>
          {/* Left Column: Quick Actions & Recent Activity */}
          <div className={styles.leftColumn}>
            
            {/* Quick Operations Section (Permission Checked) */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Quick Operations</h3>
              </div>

              {canManageMoney ? (
                <div className={styles.opsGrid}>
                  <div className={styles.actionCard} onClick={() => openDrawer('deposit')}>
                    <div className={clsx(styles.actionIcon, styles.success)}>
                      <Plus size={22} />
                    </div>
                    <div className={styles.actionInfo}>
                      <h4>Deposit</h4>
                      <p>Credit funds to student account</p>
                    </div>
                  </div>

                  <div className={styles.actionCard} onClick={() => openDrawer('withdrawal')}>
                    <div className={clsx(styles.actionIcon, styles.danger)}>
                      <Minus size={22} />
                    </div>
                    <div className={styles.actionInfo}>
                      <h4>Withdrawal</h4>
                      <p>Record student disbursement</p>
                    </div>
                  </div>

                  <div className={styles.actionCard} onClick={() => openDrawer('bulk')}>
                    <div className={clsx(styles.actionIcon, styles.primary)}>
                      <Layers3 size={22} />
                    </div>
                    <div className={styles.actionInfo}>
                      <h4>Bulk Operations</h4>
                      <p>Process batch distributions & collections</p>
                    </div>
                  </div>

                  <div className={styles.actionCard} onClick={() => openDrawer('internal')}>
                    <div className={clsx(styles.actionIcon, styles.neutral)}>
                      <ArrowLeftRight size={22} />
                    </div>
                    <div className={styles.actionInfo}>
                      <h4>Internal Transfer</h4>
                      <p>Peer-to-peer student loan or transfer</p>
                    </div>
                  </div>

                  <div className={styles.actionCard} onClick={() => openDrawer('external')}>
                    <div className={clsx(styles.actionIcon, styles.warning)}>
                      <HandCoins size={22} />
                    </div>
                    <div className={styles.actionInfo}>
                      <h4>External Loan</h4>
                      <p>Record loan to third-party borrower</p>
                    </div>
                  </div>

                  <div className={styles.actionCard} onClick={() => navigate('/students')}>
                    <div className={clsx(styles.actionIcon, styles.primary)}>
                      <Users size={22} />
                    </div>
                    <div className={styles.actionInfo}>
                      <h4>Student Directory</h4>
                      <p>Manage 79 registered academy accounts</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.readOnlyNotice}>
                  <Info size={20} className="text-primary flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-gray-900 block">Read-Only Financial Access</span>
                    You are signed in with the <strong>{userRole}</strong> role. Direct ledger operations (deposits, withdrawals, and transfers) are restricted to Academy Financial Administrators. You have view permissions for student ledgers and reports.
                  </div>
                </div>
              )}
            </section>

            {/* Recent Activity Ledger (With Status Badges & Direct Details Link) */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h3 className={styles.sectionTitle}>Recent Ledger Activity</h3>
                  <p className="text-xs text-gray-500">Most recent chronological journal entries</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/transactions')}>
                  View Full Explorer →
                </Button>
              </div>
              
              <Card padding="none">
                <div className={styles.opsList}>
                  {txLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <div key={i} className={styles.opItem}>
                        <Skeleton circle width="38px" height="38px" />
                        <div className={styles.opDetails}>
                          <Skeleton width="50%" height="0.9rem" mb="0.25rem" />
                          <Skeleton width="30%" height="0.7rem" />
                        </div>
                        <Skeleton width="80px" height="1.5rem" borderRadius="8px" />
                      </div>
                    ))
                  ) : recentTransactions && recentTransactions.length > 0 ? (
                    (recentTransactions as unknown as DashboardTx[]).map((tx) => {
                      const isCompensating = !!tx.reversal_of_id;
                      const isReversed = !!tx.is_reversed;

                      return (
                        <div 
                          key={tx.id} 
                          className={styles.opItem}
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/transactions/${tx.id}`)}
                          title="Click to view full transaction ledger entry"
                        >
                          <div className={clsx(
                            styles.opIconCircle, 
                            isReversed ? styles.neutral :
                            isCompensating ? styles.warning :
                            tx.direction === 'credit' ? styles.success : styles.danger
                          )}>
                            {isReversed ? (
                              <Undo2 size={18} />
                            ) : isCompensating ? (
                              <ArrowLeftRight size={18} />
                            ) : tx.direction === 'credit' ? (
                              <Plus size={18} />
                            ) : (
                              <Minus size={18} />
                            )}
                          </div>

                          <div className={styles.opDetails}>
                            <div className="flex items-center gap-2">
                              <span className={clsx(styles.opStudent, isReversed && "line-through text-gray-400")}>
                                {tx.students?.name || 'Academy Ledger'}
                              </span>
                              {tx.students?.enrolment_no && (
                                <span className="text-[11px] text-gray-400 font-mono">
                                  {tx.students.enrolment_no}
                                </span>
                              )}
                              {/* Status Badge */}
                              {isReversed ? (
                                <Badge variant="neutral" size="sm">Reversed</Badge>
                              ) : isCompensating ? (
                                <Badge variant="warning" size="sm">Compensating Reversal</Badge>
                              ) : (
                                <Badge variant="success" size="sm">Active</Badge>
                              )}
                            </div>

                            <span className={styles.opMeta}>
                              <span>{tx.purpose}</span> • {formatRelativeTime(tx.transaction_date)}
                            </span>
                          </div>

                          <div className={clsx(
                            styles.opAmountBadge, 
                            isReversed ? styles.neutral :
                            tx.direction === 'credit' ? styles.credit : styles.debit
                          )}>
                            {tx.direction === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-muted">No recent ledger activity recorded.</div>
                  )}
                </div>
              </Card>
            </section>

          </div>

          {/* Right Column: Account Health & Borrower Monitoring */}
          <div className={styles.rightColumn}>
            
            {/* Critical Monitoring Alert Section */}
            <section className={styles.section}>
              <div className={styles.monitorPanel}>
                <div className={styles.monitorHeader}>
                  <div className={styles.monitorTitleSection}>
                    <h3>
                      <AlertTriangle className="text-warning" size={18} /> 
                      Account Health Watchlist
                    </h3>
                    <p>Accounts with negative or low balances</p>
                  </div>
                </div>

                <div className={styles.monitorStack}>
                  {healthLoading ? (
                    Array(3).fill(0).map((_, i) => <Skeleton key={i} height="70px" borderRadius="16px" />)
                  ) : [...negativeStudents, ...lowBalanceStudents].length > 0 ? (
                    [...negativeStudents, ...lowBalanceStudents].slice(0, 5).map((student) => (
                      <div 
                        key={student.id} 
                        className={styles.monitorCard} 
                        onClick={() => navigate(`/students/${student.id}`)}
                      >
                        <div className={styles.monitorCardTop}>
                          <div className={styles.mLetterAvatar}>
                            {student.name.charAt(0)}
                          </div>
                          <div className={styles.mStudentInfo}>
                            <div className={styles.mName}>{student.name}</div>
                            <div className={styles.mEnrolment}>{student.enrolment_no}</div>
                          </div>
                          <div className={styles.mBalance}>
                            <div className={clsx(
                              styles.mBalanceValue, 
                              student.health_status === 'negative' ? "text-danger font-bold" : "text-warning"
                            )}>
                              {formatCurrencyCompact(student.current_balance)}
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-muted" />
                        </div>
                        <div className={styles.mHealthMeter}>
                          <div className={clsx(
                            styles.mHealthFill,
                            student.health_status === 'negative' ? styles.negative : styles.low
                          )} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-muted">
                      <Activity className="mx-auto mb-2 text-success opacity-50" size={36} />
                      <p className="text-sm font-semibold">Ledger status healthy. No deficit accounts.</p>
                    </div>
                  )}
                  
                  <Button 
                    variant="soft" 
                    size="sm" 
                    fullWidth 
                    className="mt-2" 
                    onClick={() => navigate('/students')}
                  >
                    View All 79 Students
                  </Button>
                </div>
              </div>
            </section>

            {/* Borrower Monitoring Panel (Admins Only) */}
            {canManageMoney && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>External Borrower Accounts</h3>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/borrowers')}>
                    Manage →
                  </Button>
                </div>
                
                <Card padding="none">
                  <div className={styles.opsList}>
                    {borrowersLoading ? (
                      Array(3).fill(0).map((_, i) => (
                        <div key={i} className={styles.opItem}>
                          <Skeleton circle width="38px" height="38px" />
                          <div className={styles.opDetails}>
                            <Skeleton width="50%" height="0.9rem" mb="0.25rem" />
                            <Skeleton width="30%" height="0.7rem" />
                          </div>
                          <Skeleton width="80px" height="1.5rem" borderRadius="8px" />
                        </div>
                      ))
                    ) : borrowersList && borrowersList.length > 0 ? (
                      borrowersList.slice(0, 4).map((borrower) => {
                        const riskVariant = 
                          borrower.risk_level === 'high' ? styles.danger :
                          borrower.risk_level === 'medium' ? styles.warning :
                          styles.success;

                        return (
                          <div 
                            key={borrower.id} 
                            className={styles.opItem}
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/borrowers/${borrower.id}`)}
                          >
                            <div className={clsx(styles.opIconCircle, riskVariant)}>
                              <HandCoins size={18} />
                            </div>
                            <div className={styles.opDetails}>
                              <span className={styles.opStudent}>
                                {borrower.name}
                              </span>
                              <span className={styles.opMeta}>
                                <span>Risk: {borrower.risk_level?.toUpperCase()}</span>
                              </span>
                            </div>
                            <div className={clsx(styles.opAmountBadge, styles.debit)}>
                              {formatCurrency(borrower.total_outstanding || 0)}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-muted">No external borrowers registered.</div>
                    )}
                  </div>
                </Card>
              </section>
            )}

          </div>
        </div>

      </div>
    </PageContainer>
  );
};
