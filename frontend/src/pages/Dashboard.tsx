import React from 'react';
import { PageContainer } from '../components/ui/PageContainer';
import { Button } from '../components/ui/Button';
import styles from './Dashboard.module.scss';
import { Card } from '../components/ui/Card';
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
  Package,
  AlertTriangle,
  Activity,
  Wallet,
  ChevronRight,
  Calendar,
  Sparkles,
  Clock
} from 'lucide-react';
import { TodayTasks } from '../components/operations/TodayTasks';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useOperationsDrawer } from '../components/operations/drawers/OperationsDrawerContext';
import { useAuth } from '../contexts/AuthContext';
import { reportingService } from '../lib/reportingService';
import { transactionService, studentService, borrowerService } from '../lib/services';
import { formatCurrency, formatCurrencyCompact, formatRelativeTime } from '../lib/utils';
import { Skeleton } from '../components/ui/Skeleton';

interface DashboardTransaction {
  id: string;
  student_id: string;
  event_id: string | null;
  transaction_type: string;
  direction: 'credit' | 'debit';
  purpose: string;
  amount: number;
  transaction_date: string;
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

  // Queries
  const { data: dailyStats, isLoading: statsLoading } = useQuery({
    queryKey: ['daily-summary'],
    queryFn: () => reportingService.getDailySummary()
  });

  const { data: recentTransactions, isLoading: txLoading } = useQuery({
    queryKey: ['recent-transactions-dashboard'],
    queryFn: () => transactionService.list(5)
  });

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['smart-insights'],
    queryFn: () => reportingService.getSmartInsights()
  });

  const { data: healthSummary, isLoading: healthLoading } = useQuery({
    queryKey: ['student-health-dashboard'],
    queryFn: () => studentService.getHealthSummary()
  });

  const { data: weeklyFlow = [], isLoading: flowLoading } = useQuery({
    queryKey: ['weekly-flow'],
    queryFn: () => reportingService.getWeeklyCapitalFlow()
  });

  const { data: borrowersList, isLoading: borrowersLoading } = useQuery({
    queryKey: ['borrowers-dashboard'],
    queryFn: () => borrowerService.list()
  });

  const criticalStudents = healthSummary?.filter(s => 
    s.health_status === 'negative' || s.health_status === 'low'
  ).slice(0, 5) || [];

  const isLoading = statsLoading || txLoading || insightsLoading || healthLoading || flowLoading;

  // Calculate current date string
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate SVG circular stroke properties
  const utilization = insights?.utilizationRate || 0;
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(utilization, 100) / 100) * circumference;

  // Calculate scale and path properties dynamically for Weekly Capital Flow Trend
  const maxVal = Math.max(
    ...weeklyFlow.map((f: any) => f.credits),
    ...weeklyFlow.map((f: any) => f.debits),
    1000
  );

  const getY = (val: number) => {
    return 160 - (val / maxVal) * 130;
  };

  // Helper for generating smooth curves in SVG paths (spline connection)
  const getCurvePath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const getAreaPath = (linePath: string, points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    return `${linePath} L ${points[points.length - 1].x} 160 L ${points[0].x} 160 Z`;
  };

  const creditPoints = weeklyFlow.length > 0
    ? weeklyFlow.map((f: any, i: number) => ({ x: i * 133.33, y: getY(f.credits) }))
    : [{ x: 0, y: 120 }, { x: 133, y: 80 }, { x: 266, y: 100 }, { x: 533, y: 50 }, { x: 800, y: 30 }];

  const debitPoints = weeklyFlow.length > 0
    ? weeklyFlow.map((f: any, i: number) => ({ x: i * 133.33, y: getY(f.debits) }))
    : [{ x: 0, y: 140 }, { x: 133, y: 110 }, { x: 266, y: 130 }, { x: 533, y: 90 }, { x: 800, y: 70 }];

  const creditsLinePath = getCurvePath(creditPoints);
  const creditsAreaPath = getAreaPath(creditsLinePath, creditPoints);

  const debitsLinePath = getCurvePath(debitPoints);
  const debitsAreaPath = getAreaPath(debitsLinePath, debitPoints);

  return (
    <PageContainer>
      <div className={styles.dashboardGrid}>
        
        {/* Welcome Section */}
        <div className={styles.welcomeBanner}>
          <div className={styles.welcomeText}>
            <h2>Welcome Back, {displayName}</h2>
            <p>Here is your ZLS financial control center overview for today.</p>
          </div>
          <div className={styles.systemBadge}>
            <div className={styles.pulseDot} />
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Calendar size={14} /> {formattedDate}
            </span>
          </div>
        </div>

        {/* Primary Metrics Row */}
        <div className={styles.statsRow}>
          {isLoading ? (
            Array(4).fill(0).map((_, i) => <Skeleton key={i} height="120px" borderRadius="24px" />)
          ) : (
            <>
              {/* Credits Card */}
              <div className={clsx(styles.statCardGlow, styles.success)}>
                <div className={styles.statCardHeader}>
                  <div className={clsx(styles.statIconContainer, styles.success)}>
                    <ArrowDownCircle size={22} />
                  </div>
                  <span className={clsx(styles.statBadgeText, "text-success flex items-center gap-0.5")}>
                    <Sparkles size={12} /> Total Inflow
                  </span>
                </div>
                <div className={styles.statCardContent}>
                  <span className={styles.statLabel}>Total Inflows</span>
                  <h3 className={styles.statValue}>{formatCurrency(dailyStats?.credits || 0)}</h3>
                </div>
              </div>

              {/* Debits Card */}
              <div className={clsx(styles.statCardGlow, styles.danger)}>
                <div className={styles.statCardHeader}>
                  <div className={clsx(styles.statIconContainer, styles.danger)}>
                    <ArrowUpCircle size={22} />
                  </div>
                  <span className={clsx(styles.statBadgeText, "text-danger flex items-center gap-0.5")}>
                    <Clock size={12} /> Total Outflow
                  </span>
                </div>
                <div className={styles.statCardContent}>
                  <span className={styles.statLabel}>Total Outflows</span>
                  <h3 className={styles.statValue}>{formatCurrency(dailyStats?.debits || 0)}</h3>
                </div>
              </div>

              {/* Net Movement Card */}
              <div className={clsx(styles.statCardGlow, styles.primary)}>
                <div className={styles.statCardHeader}>
                  <div className={clsx(styles.statIconContainer, styles.primary)}>
                    <TrendingUp size={22} />
                  </div>
                  <span className={clsx(styles.statBadgeText, "text-primary flex items-center gap-0.5")}>
                    <Activity size={12} /> Ledger Balance Flow
                  </span>
                </div>
                <div className={styles.statCardContent}>
                  <span className={styles.statLabel}>Balance Flow</span>
                  <h3 className={styles.statValue}>
                    {(dailyStats?.netMovement || 0) >= 0 ? '+' : ''}
                    {formatCurrency(dailyStats?.netMovement || 0)}
                  </h3>
                </div>
              </div>

              {/* Active Loans Card (4th Card for Mobile Grid) */}
              <div className={clsx(styles.statCardGlow, styles.warning)}>
                <div className={styles.statCardHeader}>
                  <div className={clsx(styles.statIconContainer, styles.warning)}>
                    <HandCoins size={22} />
                  </div>
                  <span className={clsx(styles.statBadgeText, "text-warning flex items-center gap-0.5")}>
                    <AlertTriangle size={12} /> Exposure Risk
                  </span>
                </div>
                <div className={styles.statCardContent}>
                  <span className={styles.statLabel}>Active Loans</span>
                  <h3 className={styles.statValue}>
                    {dailyStats?.overdueCount || 0}
                  </h3>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Custom SVG Sparkline Ledger Area Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitle}>
              <h3>Ledger Inflow & Outflow Trend</h3>
              <p>Visual visualization of recent daily transactions flow benchmarks</p>
            </div>
            <div className={styles.chartLegend}>
              <div className={styles.legendItem}>
                <div className={clsx(styles.legendDot, styles.credits)} />
                <span>Deposits Trend</span>
              </div>
              <div className={styles.legendItem}>
                <div className={clsx(styles.legendDot, styles.debits)} />
                <span>Withdrawals Trend</span>
              </div>
            </div>
          </div>
          <div className={styles.svgChartContainer}>
            <svg viewBox="0 0 800 200">
              <defs>
                <linearGradient id="creditsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25"/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0"/>
                </linearGradient>
                <linearGradient id="debitsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.20"/>
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0"/>
                </linearGradient>
                <filter id="creditsGlow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#10b981" floodOpacity="0.2" />
                </filter>
                <filter id="debitsGlow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#ef4444" floodOpacity="0.2" />
                </filter>
                <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.15" />
                </filter>
              </defs>
              
              {/* Grid Lines */}
              {Array.from({ length: 7 }).map((_, i) => (
                <line key={`v-grid-${i}`} x1={i * 133.33} y1="0" x2={i * 133.33} y2="160" stroke="#f3f4f6" strokeWidth="0.75" strokeDasharray="3 3" />
              ))}
              <line x1="0" y1="30" x2="800" y2="30" stroke="#f3f4f6" strokeDasharray="4 4" />
              <line x1="0" y1="95" x2="800" y2="95" stroke="#f3f4f6" strokeDasharray="4 4" />
              <line x1="0" y1="160" x2="800" y2="160" stroke="#e5e7eb" strokeWidth="1.5" />
              
              {/* Credit Curve Area & Line */}
              <path d={creditsAreaPath} fill="url(#creditsGrad)" />
              <path d={creditsLinePath} fill="none" stroke="#10b981" strokeWidth="3" filter="url(#creditsGlow)" />

              {/* Debit Curve Area & Line */}
              <path d={debitsAreaPath} fill="url(#debitsGrad)" />
              <path d={debitsLinePath} fill="none" stroke="#ef4444" strokeWidth="3" filter="url(#debitsGlow)" />

              {/* Grid Value Labels */}
              <text x="5" y="25" fill="#9ca3af" fontSize="9" fontWeight="600">{formatCurrencyCompact(maxVal)}</text>
              <text x="5" y="90" fill="#9ca3af" fontSize="9" fontWeight="600">{formatCurrencyCompact(maxVal / 2)}</text>
              <text x="5" y="155" fill="#9ca3af" fontSize="9" fontWeight="600">Rs. 0</text>

              {/* Interactive Node Indicators */}
              {creditPoints.map((p, i) => (
                <circle 
                  key={`c-node-${i}`} 
                  cx={p.x} 
                  cy={p.y} 
                  r="5.5" 
                  fill="#ffffff" 
                  stroke="#10b981" 
                  strokeWidth="3.5" 
                  filter="url(#nodeGlow)"
                  style={{ cursor: 'pointer' }}
                />
              ))}

              {debitPoints.map((p, i) => (
                <circle 
                  key={`d-node-${i}`} 
                  cx={p.x} 
                  cy={p.y} 
                  r="5.5" 
                  fill="#ffffff" 
                  stroke="#ef4444" 
                  strokeWidth="3.5" 
                  filter="url(#nodeGlow)"
                  style={{ cursor: 'pointer' }}
                />
              ))}

              {/* X Axis Text Labels */}
              {weeklyFlow.map((f: any, i: number) => (
                <text
                  key={i}
                  x={i * 133.33 + (i === 0 ? 5 : i === 6 ? -45 : -15)}
                  y="185"
                  fill="#6b7280"
                  fontSize="10"
                  fontWeight="600"
                >
                  {f.name}
                </text>
              ))}
            </svg>
          </div>
        </div>

        {/* Secondary Details Row */}
        <div className={styles.secondaryStatsRow}>
          {isLoading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} height="80px" borderRadius="16px" />)
          ) : (
            <>
              {/* Average Balance */}
              <div className={clsx(styles.statCardGlow)}>
                <div className="flex justify-between items-center">
                  <div className={styles.statCardContent}>
                    <span className={styles.statLabel}>Avg. Student Balance</span>
                    <h4 className={clsx(styles.statValue, "text-primary")}>{formatCurrency(dailyStats?.avgStudentBalance || 0)}</h4>
                  </div>
                  <div className={clsx(styles.statIconContainer, styles.neutral)}>
                    <Wallet size={20} />
                  </div>
                </div>
              </div>

              {/* Bulk Operations */}
              <div className={clsx(styles.statCardGlow)}>
                <div className="flex justify-between items-center">
                  <div className={styles.statCardContent}>
                    <span className={styles.statLabel}>Today's Bulk Operations</span>
                    <h4 className={clsx(styles.statValue, "text-primary")}>{dailyStats?.bulkOpsCount || 0}</h4>
                  </div>
                  <div className={clsx(styles.statIconContainer, styles.neutral)}>
                    <Layers3 size={20} />
                  </div>
                </div>
              </div>

              {/* Overdue Transfers */}
              <div className={clsx(styles.statCardGlow)}>
                <div className="flex justify-between items-center">
                  <div className={styles.statCardContent}>
                    <span className={styles.statLabel}>Active Loans/Exposures</span>
                    <h4 className={clsx(styles.statValue, "text-danger")}>{dailyStats?.overdueCount || 0}</h4>
                  </div>
                  <div className={clsx(styles.statIconContainer, styles.warning)}>
                    <AlertTriangle size={20} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className={styles.mainLayout}>
          {/* Left Column: Quick Actions & Recent Activity */}
          <div className={styles.leftColumn}>
            
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Quick Operations</h3>
              </div>
              <div className={styles.opsGrid}>
                
                <div className={styles.actionCard} onClick={() => openDrawer('deposit')}>
                  <div className={clsx(styles.actionIcon, styles.success)}>
                    <Plus size={22} />
                  </div>
                  <div className={styles.actionInfo}>
                    <h4>Quick Deposit</h4>
                    <p>Add funds to student account</p>
                  </div>
                </div>

                <div className={styles.actionCard} onClick={() => openDrawer('withdrawal')}>
                  <div className={clsx(styles.actionIcon, styles.danger)}>
                    <Minus size={22} />
                  </div>
                  <div className={styles.actionInfo}>
                    <h4>Quick Withdrawal</h4>
                    <p>Record student withdrawal</p>
                  </div>
                </div>

                <div className={styles.actionCard} onClick={() => openDrawer('bulk')}>
                  <div className={clsx(styles.actionIcon, styles.primary)}>
                    <Layers3 size={22} />
                  </div>
                  <div className={styles.actionInfo}>
                    <h4>Bulk Operation</h4>
                    <p>Process multiple entries</p>
                  </div>
                </div>

                <div className={styles.actionCard} onClick={() => openDrawer('internal')}>
                  <div className={clsx(styles.actionIcon, styles.neutral)}>
                    <ArrowLeftRight size={22} />
                  </div>
                  <div className={styles.actionInfo}>
                    <h4>Internal Transfer</h4>
                    <p>Move funds between students</p>
                  </div>
                </div>

                <div className={styles.actionCard} onClick={() => openDrawer('external')}>
                  <div className={clsx(styles.actionIcon, styles.warning)}>
                    <HandCoins size={22} />
                  </div>
                  <div className={styles.actionInfo}>
                    <h4>External Loan</h4>
                    <p>Manage borrower accounts</p>
                  </div>
                </div>

                <div className={styles.actionCard} onClick={() => openDrawer('preset')}>
                  <div className={clsx(styles.actionIcon, styles.primary)}>
                    <Package size={22} />
                  </div>
                  <div className={styles.actionInfo}>
                    <h4>Create Preset</h4>
                    <p>Save reusable templates</p>
                  </div>
                </div>

              </div>
            </section>



            {/* Recent Activity Timeline */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Recent Activity Ledger</h3>
                <Button variant="ghost" size="sm" onClick={() => navigate('/transactions')}>
                  View Full Explorer
                </Button>
              </div>
              
              <Card padding="none">
                <div className={styles.opsList}>
                  {txLoading ? (
                    Array(4).fill(0).map((_, i) => (
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
                    (recentTransactions as unknown as DashboardTransaction[]).map((tx) => (
                      <div key={tx.id} className={styles.opItem}>
                        <div className={clsx(
                          styles.opIconCircle, 
                          tx.event_id ? styles.primary : tx.direction === 'credit' ? styles.success : styles.danger
                        )}>
                          {tx.event_id ? <Layers3 size={18} /> : tx.direction === 'credit' ? <Plus size={18} /> : <Minus size={18} />}
                        </div>
                        <div className={styles.opDetails}>
                          <span className={styles.opStudent}>
                            {tx.students?.name || 'Unknown Student'}
                          </span>
                          <span className={styles.opMeta}>
                            <span>{tx.purpose}</span> • {formatRelativeTime(tx.transaction_date)}
                          </span>
                        </div>
                        <div className={clsx(
                          styles.opAmountBadge, 
                          tx.direction === 'credit' ? styles.credit : styles.debit
                        )}>
                          {tx.direction === 'credit' ? '+' : '-'}{formatCurrencyCompact(tx.amount)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted">No recent ledger activity found.</div>
                  )}
                </div>
              </Card>
            </section>

            {/* Section: Monitored View of Borrowers */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Borrower Risk Monitoring</h3>
                <Button variant="ghost" size="sm" onClick={() => navigate('/borrowers')}>
                  View All
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
                    borrowersList.slice(0, 5).map((borrower) => {
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
                              <span>Risk: {borrower.risk_level?.toUpperCase()}</span> • Last Recovery: {borrower.last_recovery_at 
                                ? new Date(borrower.last_recovery_at).toLocaleDateString([], { month: 'short', day: 'numeric' })
                                : 'Never'
                              }
                            </span>
                          </div>
                          <div className={clsx(styles.opAmountBadge, styles.debit)}>
                            {formatCurrencyCompact(borrower.total_outstanding || 0)}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-muted">No borrower records found.</div>
                  )}
                </div>
              </Card>
            </section>

            {/* Section: Today's Tasks */}
            <section className={styles.section}>
              <TodayTasks />
            </section>
          </div>

          {/* Right Column: Risk Monitoring & Insights */}
          <div className={styles.rightColumn}>
            
            {/* Critical Monitoring Alert Section */}
            <section className={styles.section}>
              <div className={styles.monitorPanel}>
                <div className={styles.monitorHeader}>
                  <div className={styles.monitorTitleSection}>
                    <h3>
                      <AlertTriangle className="text-danger animate-pulse" size={18} /> 
                      Account Alerts
                    </h3>
                    <p>Students requiring immediate balance collections</p>
                  </div>
                </div>

                <div className={styles.monitorStack}>
                  {healthLoading ? (
                    Array(3).fill(0).map((_, i) => <Skeleton key={i} height="70px" borderRadius="16px" />)
                  ) : criticalStudents.length > 0 ? (
                    criticalStudents.map((student) => (
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
                            <div className={clsx(styles.mBalanceValue, "text-danger")}>
                              {formatCurrencyCompact(student.current_balance)}
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-muted" />
                        </div>
                        {/* Health Progress visual meter bar */}
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
                      <p className="text-sm font-semibold">Ledger status stable. All student balances healthy.</p>
                    </div>
                  )}
                  
                  {criticalStudents.length > 0 && (
                    <Button 
                      variant="soft" 
                      size="sm" 
                      fullWidth 
                      className="mt-2" 
                      onClick={() => navigate('/students')}
                    >
                      Review All Accounts
                    </Button>
                  )}
                </div>
              </div>
            </section>

            {/* Smart Intelligent Insights (With SVG Circle gauges) */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Intelligent Insights</h3>
              </div>
              <div className={styles.insightsStack}>
                {insightsLoading ? (
                  Array(3).fill(0).map((_, i) => <Skeleton key={i} height="85px" borderRadius="24px" />)
                ) : (
                  <>
                    {/* Fund Utilization Gauge Card */}
                    <div className={styles.insightVisualCard}>
                      <div className={styles.circularMeter}>
                        <svg viewBox="0 0 54 54">
                          <circle cx="27" cy="27" r={radius} className={styles.circularMeterBg} strokeWidth="5" />
                          <circle 
                            cx="27" 
                            cy="27" 
                            r={radius} 
                            className={styles.circularMeterProgress} 
                            strokeWidth="5" 
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                          />
                        </svg>
                        <span className={styles.circularMeterText}>
                          {utilization.toFixed(0)}%
                        </span>
                      </div>
                      
                      <div className={styles.insightInfo}>
                        <h4>Fund Utilization</h4>
                        <div className={styles.insightDisplay}>
                          <span className={styles.insightValue}>{utilization.toFixed(1)}%</span>
                        </div>
                        <span className={styles.insightDesc}>Student reserve funds in active loans</span>
                      </div>
                    </div>

                    {/* Low Balances Info Card */}
                    <div className={styles.insightVisualCard}>
                      <div className={clsx(styles.insightIconBox, styles.warning)}>
                        <AlertTriangle size={22} />
                      </div>
                      
                      <div className={styles.insightInfo}>
                        <h4>Balance Deficits</h4>
                        <div className={styles.insightDisplay}>
                          <span className={styles.insightValue}>{insights?.lowBalanceCount || 0} Accounts</span>
                        </div>
                        <span className={styles.insightDesc}>Students falling under minimal limits</span>
                      </div>
                    </div>

                    {/* Top Reserves Profile Card */}
                    <div className={styles.insightVisualCard}>
                      <div className={clsx(styles.insightIconBox, styles.success)}>
                        <Wallet size={22} />
                      </div>
                      
                      <div className={styles.insightInfo}>
                        <h4>Highest Capital reserve</h4>
                        <div className={styles.insightDisplay}>
                          <span className={styles.insightValue}>
                            {insights?.highestBalance ? formatCurrencyCompact(insights.highestBalance.current_balance) : '₹0'}
                          </span>
                        </div>
                        <span className={styles.insightDesc}>
                          Primary balance: {insights?.highestBalance?.name || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>

          </div>
        </div>

      </div>
    </PageContainer>
  );
};
