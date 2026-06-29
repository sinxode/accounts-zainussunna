import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { 
  Download, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ShoppingBag, 
  Package, 
  TrendingUp,
  Printer,
  Share2,
  RefreshCw,
  Receipt
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { PageContainer } from '../../components/ui/PageContainer';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { ReportTabs } from '../../components/reports/ReportTabs';
import { reportingService } from '../../lib/reportingService';
import { useUIStore } from '../../store/useUIStore';
import styles from './MonthlyReports.module.scss';
import { ChartCard } from '../../components/reports/ChartCard';

export const MonthlyReports: React.FC = () => {
  const now = new Date();
  const navigate = useNavigate();
  const { setActiveModal, setExportData } = useUIStore();
  const [selectedPeriod, setSelectedPeriod] = useState({ 
    month: now.getMonth() + 1, 
    year: now.getFullYear() 
  });

  const { data: summary, isLoading, refetch } = useQuery({
    queryKey: ['monthlyReport', selectedPeriod],
    queryFn: () => reportingService.getMonthlySummary(selectedPeriod.year, selectedPeriod.month)
  });

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleExport = () => {
    if (!summary) return;
    
    setExportData({
      title: `Monthly Financial Report: ${months[selectedPeriod.month - 1]} ${selectedPeriod.year}`,
      filename: `Monthly_Report_${selectedPeriod.month}_${selectedPeriod.year}`,
      type: 'report',
      columns: ['Category', 'Amount'],
      rows: [
        ['Collections', `₹${summary.collections.toLocaleString()}`],
        ['Withdrawals', `₹${summary.withdrawals.toLocaleString()}`],
        ['Distributions', `₹${summary.distributions.toLocaleString()}`],
        ['Store Bills', `₹${summary.storeBills.toLocaleString()}`],
        ['Net Movement', `₹${summary.netMovement.toLocaleString()}`]
      ]
    });
    setActiveModal('printExport');
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Monthly report link copied to clipboard!");
  };

  const handlePrint = () => {
    handleExport();
  };

  const handleViewLedger = () => {
    navigate(`/transactions?month=${selectedPeriod.month}&year=${selectedPeriod.year}`);
  };

  const chartData = [
    { name: 'Collections', value: summary?.collections || 0 },
    { name: 'Distributions', value: summary?.distributions || 0 },
    { name: 'Withdrawals', value: summary?.withdrawals || 0 },
    { name: 'Store Bills', value: summary?.storeBills || 0 },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Monthly Management Reports"
        subtitle="High-level financial overview for the academic month."
        actions={
          <div className="flex gap-2 items-center flex-wrap">
            <Button 
              variant="ghost" 
              icon={<RefreshCw size={16} />}
              onClick={handleRefresh}
              title="Sync Ledger Data"
              disabled={isLoading}
            />
            <Button 
              variant="ghost" 
              icon={<Printer size={16} />}
              onClick={handlePrint}
              disabled={isLoading}
            >
              Print
            </Button>
            <Button 
              variant="ghost" 
              icon={<Share2 size={16} />}
              onClick={handleShare}
              disabled={isLoading}
            >
              Share
            </Button>
            <Button 
              variant="soft" 
              icon={<Receipt size={16} />}
              onClick={handleViewLedger}
              disabled={isLoading}
            >
              View Transactions
            </Button>
            <Button 
              variant="primary" 
              icon={<Download size={16} />}
              onClick={handleExport}
              disabled={isLoading}
            >
              Export CSV
            </Button>
          </div>
        }
      />

      <ReportTabs />

      <Card className={styles.periodCard} padding="sm">
        <div className={styles.periodSelectors}>
          <div className={styles.selectorItem}>
            <label>Reporting Month</label>
            <select 
              value={selectedPeriod.month} 
              onChange={(e) => setSelectedPeriod({ ...selectedPeriod, month: parseInt(e.target.value) })}
            >
              {months.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className={styles.selectorItem}>
            <label>Year</label>
            <select 
              value={selectedPeriod.year} 
              onChange={(e) => setSelectedPeriod({ ...selectedPeriod, year: parseInt(e.target.value) })}
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className={styles.loadingWrapper}>
          <div className={clsx("glass-effect", styles.loadingBox)}>Aggregating Monthly Data...</div>
        </div>
      ) : (
        <>
          <div className={styles.statsGrid}>
            <StatCard label="Total Collections" value={`₹${summary?.collections.toLocaleString()}`} icon={<ArrowDownLeft />} variant="success" />
            <StatCard label="Total Distributions" value={`₹${summary?.distributions.toLocaleString()}`} icon={<Package />} variant="primary" />
            <StatCard label="Total Withdrawals" value={`₹${summary?.withdrawals.toLocaleString()}`} icon={<ArrowUpRight />} variant="error" />
            <StatCard label="Store Bill Expenses" value={`₹${summary?.storeBills.toLocaleString()}`} icon={<ShoppingBag />} variant="warning" />
          </div>

          <div className={styles.summaryVisuals}>
            <ChartCard 
              title="Operational Breakdown" 
              type="pie" 
              data={chartData} 
              dataKeys={['value']} 
              colors={['#10b981', '#8b5cf6', '#ef4444', '#f59e0b']}
            />
            <Card className={styles.netCard}>
              <h3 className="label-sm mb-2">Net Cash Movement</h3>
              <div className={styles.netValue}>
                <span className={summary && summary.netMovement >= 0 ? "text-success" : "text-error"}>
                  {summary && summary.netMovement >= 0 ? '+' : ''}₹{summary?.netMovement.toLocaleString()}
                </span>
                <TrendingUp size={24} className={summary && summary.netMovement >= 0 ? "text-success" : "text-error"} />
              </div>
              <p className={styles.netDesc}>
                Total incoming (Collections + Distributions) vs Total outgoing (Withdrawals + Store Bills) for this period.
              </p>
            </Card>
          </div>

          <Card className={styles.highlightsCard}>
            <h3 className="label-sm mb-2">Monthly Highlights</h3>
            <div className={styles.highlightGrid}>
              <div className={styles.hItem}>
                <span className={styles.hLabel}>Most Active Student</span>
                <span className={styles.hValue}>{summary?.highlights?.activeStudentName || 'None'}</span>
                <span className={styles.hMeta}>{summary?.highlights?.activeStudentCount || 0} transactions</span>
              </div>
              <div className={styles.hDivider} />
              <div className={styles.hItem}>
                <span className={styles.hLabel}>Highest Deposit</span>
                <span className={styles.hValue}>₹{Number(summary?.highlights?.highestDepositAmount || 0).toLocaleString()}</span>
                <span className={styles.hMeta}>By {summary?.highlights?.highestDepositStudent || 'N/A'}</span>
              </div>
              <div className={styles.hDivider} />
              <div className={styles.hItem}>
                <span className={styles.hLabel}>Largest Event</span>
                <span className={styles.hValue}>₹{Number(summary?.highlights?.largestEventAmount || 0).toLocaleString()}</span>
                <span className={styles.hMeta}>Event: {summary?.highlights?.largestEventName || 'None'}</span>
              </div>
            </div>
          </Card>
        </>
      )}
    </PageContainer>
  );
};
