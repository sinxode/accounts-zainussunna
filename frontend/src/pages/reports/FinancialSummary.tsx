import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '../../components/ui/PageContainer';
import { PageHeader } from '../../components/ui/PageHeader';
import { ChartCard } from '../../components/reports/ChartCard';
import styles from './FinancialSummary.module.scss';
import { StatCard } from '../../components/ui/StatCard';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  Download, 
  Filter, 
  PieChart, 
  BarChart3, 
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ReportTabs } from '../../components/reports/ReportTabs';
import { useUIStore } from '../../store/useUIStore';
import { reportingService } from '../../lib/reportingService';
import { clsx } from 'clsx';

export const FinancialSummary: React.FC = () => {
    const { setActiveModal, setExportData } = useUIStore();

    const { data: summary, isLoading } = useQuery({
      queryKey: ['financialSummaryData'],
      queryFn: reportingService.getFinancialSummaryData
    });

    const handleExport = () => {
      if (!summary) return;
      setExportData({
        title: 'Global Financial Health Summary',
        filename: `Financial_Summary_${new Date().toISOString().split('T')[0]}`,
        type: 'report',
        columns: ['Metric', 'Value'],
        rows: [
          ['Total Student Funds', `₹${summary.totalStudentFunds.toLocaleString()}`],
          ['Income (YTD)', `₹${summary.incomeYTD.toLocaleString()}`],
          ['Expenses (YTD)', `₹${summary.expensesYTD.toLocaleString()}`],
          ['Operating Margin', `${summary.operatingMargin.toFixed(1)}%`]
        ]
      });
      setActiveModal('printExport');
    };

    return (
        <PageContainer>
            <PageHeader
                title="Financial Summary"
                subtitle="High-level overview of the academy's financial health and cash flow."
                actions={
                  <div className="flex gap-2">
                    <Button variant="soft" icon={<Filter size={16} />}>Filters</Button>
                    <Button variant="soft" icon={<Download size={16} />} onClick={handleExport} disabled={isLoading}>Export PDF</Button>
                  </div>
                }
            />
            
            <ReportTabs />
            
            {isLoading ? (
              <div className={styles.loadingWrapper}>
                <div className={clsx("glass-effect", styles.loadingBox)}>Aggregating Financial Metrics...</div>
              </div>
            ) : (
              <div className={styles.reportsGrid}>
                  {/* Global Stats Strip */}
                  <div className={styles.statsRow}>
                    <StatCard label="Total Student Funds" value={`₹${(summary?.totalStudentFunds || 0).toLocaleString()}`} icon={<Wallet size={20} />} variant="primary" />
                    <StatCard label="Income (YTD)" value={`₹${(summary?.incomeYTD || 0).toLocaleString()}`} icon={<TrendingUp size={20} />} variant="success" />
                    <StatCard label="Expenses (YTD)" value={`₹${(summary?.expensesYTD || 0).toLocaleString()}`} icon={<TrendingDown size={20} />} variant="danger" />
                    <StatCard label="Operating Margin" value={`${(summary?.operatingMargin || 0).toFixed(1)}%`} icon={<Scale size={20} />} variant="neutral" />
                  </div>

                  <div className={styles.chartsLayout}>
                    {/* Left Column: Primary Charts */}
                    <div className={styles.mainChart}>
                      <ChartCard
                        title={
                          <div className="flex items-center gap-2">
                            <BarChart3 size={16} className="text-primary" />
                            <span>Income vs. Expenses Trend</span>
                          </div>
                        }
                        type="bar"
                        data={summary?.monthlyTrend || []}
                        dataKeys={['income', 'outcome']}
                        colors={['#10b981', '#ef4444']}
                      />

                      <div className="grid grid-cols-2 gap-6">
                        <Card padding="lg" className="flex flex-col gap-2">
                          <span className="text-xs text-muted font-bold uppercase tracking-wider">Top Income Source</span>
                          <div className="flex items-end justify-between">
                            <h4 className="text-xl font-bold">{summary?.topIncomeName || 'None'}</h4>
                            <div className="flex items-center text-success text-xs font-bold gap-0.5">
                              <ArrowUpRight size={14} /> {summary?.topIncomePercentage?.toFixed(1) || '0'}% YTD
                            </div>
                          </div>
                          <div className={styles.progressContainer}>
                            <div className={clsx(styles.progressBar, styles.income)} style={{ width: `${summary?.topIncomePercentage || 0}%` }} />
                          </div>
                        </Card>

                        <Card padding="lg" className="flex flex-col gap-2">
                          <span className="text-xs text-muted font-bold uppercase tracking-wider">Major Expense Stream</span>
                          <div className="flex items-end justify-between">
                            <h4 className="text-xl font-bold">{summary?.topExpenseName || 'None'}</h4>
                            <div className="flex items-center text-danger text-xs font-bold gap-0.5">
                              <ArrowDownRight size={14} /> {summary?.topExpensePercentage?.toFixed(1) || '0'}% YTD
                            </div>
                          </div>
                          <div className={styles.progressContainer}>
                            <div className={clsx(styles.progressBar, styles.expense)} style={{ width: `${summary?.topExpensePercentage || 0}%` }} />
                          </div>
                        </Card>
                      </div>
                    </div>

                    {/* Right Column: Breakdown & Insights */}
                    <div className={styles.sideColumn}>
                      <ChartCard
                        title={
                          <div className="flex items-center gap-2">
                            <PieChart size={16} className="text-warning" />
                            <span>Resource Allocation</span>
                          </div>
                        }
                        type="pie"
                        data={summary?.allocation || []}
                        dataKeys={['value']}
                      />

                      <Card padding="lg">
                        <div className={styles.sectionTitle}>
                          <Zap size={16} className="text-primary" />
                          <span>Financial Insights</span>
                        </div>
                        <div className="flex flex-col gap-4">
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-success-soft flex-center flex-shrink-0">
                              <TrendingUp size={16} className="text-success" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">Surplus Status</p>
                              <p className="text-xs text-secondary mt-0.5">
                                Net surplus of ₹{((summary?.incomeYTD || 0) - (summary?.expensesYTD || 0)).toLocaleString()} for this calendar year.
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-warning-soft flex-center flex-shrink-0">
                              <Scale size={16} className="text-warning" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">Ledger Health</p>
                              <p className="text-xs text-secondary mt-0.5">
                                Operating margin stands at {summary?.operatingMargin.toFixed(1)}%.
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-info-soft flex-center flex-shrink-0">
                              <ArrowUpRight size={16} className="text-info" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">Capital Allocation</p>
                              <p className="text-xs text-secondary mt-0.5">
                                Funds are diversified across {summary?.allocation.length || 0} active transaction channels.
                              </p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
              </div>
            )}
        </PageContainer>
    );
};
