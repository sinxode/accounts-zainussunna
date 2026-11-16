import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '../../components/ui/PageContainer';
import { ChartCard } from '../../components/reports/ChartCard';
import { StatCard } from '../../components/ui/StatCard';
import { StatGrid } from '../../components/ui/StatGrid';
import { 
  Wallet, 
  Scale, 
  Download, 
  BarChart3, 
  Info,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ReportTabs } from '../../components/reports/ReportTabs';
import { useUIStore } from '../../store/useUIStore';
import { reportingService } from '../../lib/reportingService';

export const FinancialSummary: React.FC = () => {
  const { setActiveModal, setExportData } = useUIStore();
  const [dateRange, setDateRange] = useState({
    start: `${new Date().getFullYear()}-01-01`,
    end: new Date().toISOString().split('T')[0]
  });

  const { data: summary, isLoading } = useQuery({
    queryKey: ['financialActivitySummary', dateRange],
    queryFn: () => reportingService.getFinancialActivitySummary(dateRange.start, dateRange.end)
  });

  const handleExport = () => {
    if (!summary) return;
    setExportData({
      title: 'Institutional Financial Activity Summary',
      filename: `Financial_Activity_Summary_${dateRange.start}_to_${dateRange.end}`,
      type: 'report',
      columns: ['Metric', 'Amount', 'Description'],
      rows: [
        ['Total Recorded Student Balances Pool', `₹${summary.totalStudentBalances.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Current net balance of all student accounts'],
        ['Gross Recorded Inflows (Credits)', `₹${summary.grossInflows.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Total deposits and collections in period'],
        ['Gross Recorded Outflows (Debits)', `₹${summary.grossOutflows.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Total withdrawals and distributions in period'],
        ['Compensating Reversals Volume', `₹${summary.reversalVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, `${summary.reversalCount} correction entries in period`],
        ['Net Period Movement', `₹${summary.netLedgerMovement.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Net change in central ledger']
      ]
    });
    setActiveModal('printExport');
  };

  const chartData = summary ? Object.entries(summary.typeVolumes).map(([type, v]) => ({
    name: type.replace('_', ' ').toUpperCase(),
    Inflows: v.credits,
    Outflows: v.debits
  })) : [];

  return (
    <PageContainer>
      <ReportTabs 
        actions={
          <Button variant="soft" size="sm" icon={<Download size={15} />} onClick={handleExport} disabled={isLoading}>
            Export Summary
          </Button>
        }
      />
      
      {/* Date Range Selector */}
      <Card padding="sm" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Reporting Scope:</span>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
          />
          <span style={{ fontSize: '13px', color: '#64748B' }}>to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
          />
        </div>
      </Card>

      {/* Neutral Accounting Disclaimer */}
      <div style={{
        backgroundColor: '#EFF6FF',
        border: '1px solid #BFDBFE',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px'
      }}>
        <Info size={18} style={{ color: '#2563EB', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '12.5px', color: '#1E40AF', lineHeight: 1.5 }}>
          <strong>Classification Note:</strong> {summary?.disclaimer} Figures represent actual recorded double-entry movements; student deposits are tracked as student trust obligations rather than institutional profit.
        </div>
      </div>
      
      {isLoading ? (
        <div className="glass-effect p-8 text-center text-muted">Aggregating Financial Metrics...</div>
      ) : (
        <div>
          {/* Global Stats Strip */}
          <StatGrid columns={5}>
            <StatCard 
              label="Student Balances Pool" 
              value={`₹${(summary?.totalStudentBalances || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
              icon={<Wallet size={18} />} 
              variant="primary" 
            />
            <StatCard 
              label="Gross Inflows (Credits)" 
              value={`+₹${(summary?.grossInflows || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
              icon={<ArrowDownLeft size={18} />} 
              variant="success" 
            />
            <StatCard 
              label="Gross Outflows (Debits)" 
              value={`-₹${(summary?.grossOutflows || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
              icon={<ArrowUpRight size={18} />} 
              variant="danger" 
            />
            <StatCard 
              label="Compensating Reversals" 
              value={`${summary?.reversalCount || 0} (₹${(summary?.reversalVolume || 0).toLocaleString()})`} 
              icon={<RotateCcw size={18} />} 
              variant="warning" 
            />
            <StatCard 
              label="Net Ledger Movement" 
              value={`${(summary?.netLedgerMovement || 0) >= 0 ? '+' : ''}₹${(summary?.netLedgerMovement || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
              icon={<Scale size={18} />} 
              variant="neutral" 
            />
          </StatGrid>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {/* Chart */}
            <ChartCard
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 size={16} style={{ color: '#1E3A5F' }} />
                  <span>Activity Volume by Transaction Type</span>
                </div>
              }
              type="bar"
              data={chartData}
              dataKeys={['Inflows', 'Outflows']}
              colors={['#10B981', '#EF4444']}
            />

            {/* Type Breakdown Card */}
            <Card padding="md">
              <h3 className="label-sm" style={{ marginBottom: '14px' }}>Transaction Volume Distribution</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {summary && Object.entries(summary.typeVolumes).map(([type, stats]) => (
                  <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: '#F8FAFC', borderRadius: '6px' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: '#0F172A' }}>{type.replace('_', ' ').toUpperCase()}</span>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>{stats.count} transactions</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>
                        ₹{(stats.credits + stats.debits).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
