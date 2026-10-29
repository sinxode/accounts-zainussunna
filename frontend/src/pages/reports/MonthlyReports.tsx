import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Download, 
  ArrowDownLeft, 
  ArrowUpRight, 
  TrendingUp,
  RotateCcw,
  Info,
  Calendar
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { PageContainer } from '../../components/ui/PageContainer';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { ReportTabs } from '../../components/reports/ReportTabs';
import { reportingService } from '../../lib/reportingService';
import { useUIStore } from '../../store/useUIStore';

export const MonthlyReports: React.FC = () => {
  const now = new Date();
  const { setActiveModal, setExportData } = useUIStore();
  const [selectedPeriod, setSelectedPeriod] = useState({ 
    month: now.getMonth() + 1, 
    year: now.getFullYear() 
  });

  const { data: summary, isLoading } = useQuery({
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
      title: `Monthly Transaction Summary: ${months[selectedPeriod.month - 1]} ${selectedPeriod.year}`,
      filename: `Monthly_Summary_${selectedPeriod.month}_${selectedPeriod.year}`,
      type: 'report',
      columns: ['Date', 'Reference ID', 'Student', 'Type', 'Direction', 'Purpose', 'Amount', 'Status'],
      rows: summary.transactions.map(t => [
        new Date(t.transaction_date).toLocaleDateString(),
        t.id,
        (t.students as any)?.name || 'N/A',
        t.transaction_type,
        t.direction,
        t.purpose,
        `${t.direction === 'credit' ? '+' : '-'}₹${Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        t.is_reversed || t.reversal_of_id ? 'Reversed' : 'Active'
      ])
    });
    setActiveModal('printExport');
  };

  return (
    <PageContainer>
      <PageHeader
        title="Monthly Transaction Summary"
        subtitle="Gross receipts, disbursements, reversals, and net ledger movements for the selected calendar month."
        actions={
          <Button 
            variant="soft" 
            icon={<Download size={16} />} 
            onClick={handleExport} 
            disabled={isLoading || !summary?.transactions.length}
          >
            Export Monthly Report
          </Button>
        }
      />

      <ReportTabs />

      {/* Month/Year Filter */}
      <Card padding="sm" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={16} style={{ color: '#1E3A5F' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Select Accounting Month:</span>
          </div>

          <select
            value={selectedPeriod.month}
            onChange={(e) => setSelectedPeriod({ ...selectedPeriod, month: Number(e.target.value) })}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
          >
            {months.map((m, idx) => (
              <option key={m} value={idx + 1}>{m}</option>
            ))}
          </select>

          <select
            value={selectedPeriod.year}
            onChange={(e) => setSelectedPeriod({ ...selectedPeriod, year: Number(e.target.value) })}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Financial Scope Note */}
      <div style={{
        backgroundColor: '#EFF6FF',
        border: '1px solid #DBEAFE',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px'
      }}>
        <Info size={18} style={{ color: '#2563EB', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '12.5px', color: '#1E40AF', lineHeight: 1.5 }}>
          <strong>Classification Note:</strong> {summary?.clarificationNote} Figures distinguish gross receipts and disbursements from reversals and net ledger effects.
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard 
          label="Gross Inflows (Credits)" 
          value={`+₹${(summary?.grossCredits || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          icon={<ArrowDownLeft />} 
          variant="success" 
        />
        <StatCard 
          label="Gross Outflows (Debits)" 
          value={`-₹${(summary?.grossDebits || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          icon={<ArrowUpRight />} 
          variant="error" 
        />
        <StatCard 
          label="Compensating Reversals" 
          value={`${summary?.reversalCount || 0} (₹${(summary?.reversalAmount || 0).toLocaleString()})`} 
          icon={<RotateCcw />} 
          variant="warning" 
        />
        <StatCard 
          label="Net Ledger Movement" 
          value={`${(summary?.netLedgerMovement || 0) >= 0 ? '+' : ''}₹${(summary?.netLedgerMovement || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          icon={<TrendingUp />} 
          variant={(summary?.netLedgerMovement || 0) >= 0 ? "primary" : "neutral"} 
        />
      </div>

      {/* Transaction Type Breakdown Matrix */}
      <Card padding="md" style={{ marginBottom: '24px' }}>
        <h3 className="label-sm" style={{ marginBottom: '12px' }}>Activity Breakdown by Transaction Type</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ textAlign: 'left', padding: '10px 14px', color: '#475569' }}>Transaction Type</th>
                <th style={{ textAlign: 'center', padding: '10px 14px', color: '#475569' }}>Entry Count</th>
                <th style={{ textAlign: 'right', padding: '10px 14px', color: '#475569' }}>Recorded Credits</th>
                <th style={{ textAlign: 'right', padding: '10px 14px', color: '#475569' }}>Recorded Debits</th>
                <th style={{ textAlign: 'right', padding: '10px 14px', color: '#475569' }}>Total Volume</th>
              </tr>
            </thead>
            <tbody>
              {summary && Object.entries(summary.typeBreakdown).length > 0 ? (
                Object.entries(summary.typeBreakdown).map(([type, stats]) => (
                  <tr key={type} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0F172A' }}>
                      <Badge variant="neutral" size="sm">{type.replace('_', ' ')}</Badge>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>{stats.count}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#16A34A' }}>
                      ₹{stats.credits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#E11D48' }}>
                      ₹{stats.debits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600 }}>
                      ₹{stats.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#94A3B8' }}>
                    No transactions recorded for {months[selectedPeriod.month - 1]} {selectedPeriod.year}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Itemized Transactions Table */}
      <Card padding="md">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 className="label-sm">Recorded Ledger Entries ({months[selectedPeriod.month - 1]} {selectedPeriod.year})</h3>
          <span style={{ fontSize: '12px', color: '#64748B' }}>
            {summary?.transactions.length || 0} total entries
          </span>
        </div>

        <DataTable
          columns={[
            { header: 'Date', accessor: (t) => new Date(t.transaction_date).toLocaleDateString() },
            { 
              header: 'Student', 
              accessor: (t) => (t.students as any)?.name || 'N/A'
            },
            { 
              header: 'Type', 
              accessor: (t) => <Badge variant="neutral" size="sm">{t.transaction_type.replace('_', ' ')}</Badge>,
              align: 'center'
            },
            { header: 'Purpose', accessor: 'purpose' },
            { 
              header: 'Amount', 
              accessor: (t) => (
                <span className={t.direction === 'credit' ? "text-success font-semibold" : "text-error font-semibold"}>
                  {t.direction === 'credit' ? '+' : '-'}₹{Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              ),
              align: 'right'
            },
            {
              header: 'Status',
              accessor: (t) => (
                t.is_reversed || t.reversal_of_id ? (
                  <Badge variant="danger" size="sm">Reversed</Badge>
                ) : (
                  <Badge variant="success" size="sm">Active</Badge>
                )
              ),
              align: 'center'
            }
          ]}
          data={summary?.transactions || []}
        />
      </Card>
    </PageContainer>
  );
};
