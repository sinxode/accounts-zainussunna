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
import { StatGrid } from '../../components/ui/StatGrid';
import { PageContainer } from '../../components/ui/PageContainer';
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
      <ReportTabs 
        actions={
          <Button 
            variant="soft" 
            size="sm"
            icon={<Download size={15} />} 
            onClick={handleExport} 
            disabled={isLoading || !summary?.transactions.length}
          >
            Export Monthly Report
          </Button>
        }
      />

      {/* Month/Year Filter */}
      <Card padding="sm" style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={15} style={{ color: 'var(--green-700)' }} />
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-strong)' }}>Accounting Month:</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              value={selectedPeriod.month}
              onChange={(e) => setSelectedPeriod({ ...selectedPeriod, month: Number(e.target.value) })}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-pill, 999px)',
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                fontSize: '12.5px',
                color: 'var(--text-strong)'
              }}
            >
              {months.map((m, idx) => (
                <option key={m} value={idx + 1}>{m}</option>
              ))}
            </select>

            <select
              value={selectedPeriod.year}
              onChange={(e) => setSelectedPeriod({ ...selectedPeriod, year: Number(e.target.value) })}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-pill, 999px)',
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                fontSize: '12.5px',
                color: 'var(--text-strong)'
              }}
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Financial Scope Note */}
      <div style={{
        backgroundColor: 'var(--bg-subtle)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-tile, 12px)',
        padding: '8px 12px',
        marginBottom: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '11.5px',
        color: 'var(--text-body)'
      }}>
        <Info size={15} style={{ color: 'var(--green-700)', flexShrink: 0 }} />
        <span><strong>Classification:</strong> {summary?.clarificationNote} Figures distinguish gross receipts and disbursements from reversals.</span>
      </div>

      {/* Summary Cards */}
      <StatGrid columns={4}>
        <StatCard 
          label="Gross Inflows (Credits)" 
          value={`+₹${(summary?.grossCredits || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          icon={<ArrowDownLeft size={18} />} 
          variant="success" 
        />
        <StatCard 
          label="Gross Outflows (Debits)" 
          value={`-₹${(summary?.grossDebits || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          icon={<ArrowUpRight size={18} />} 
          variant="error" 
        />
        <StatCard 
          label="Compensating Reversals" 
          value={`${summary?.reversalCount || 0} (₹${(summary?.reversalAmount || 0).toLocaleString()})`} 
          icon={<RotateCcw size={18} />} 
          variant="warning" 
        />
        <StatCard 
          label="Net Ledger Movement" 
          value={`${(summary?.netLedgerMovement || 0) >= 0 ? '+' : ''}₹${(summary?.netLedgerMovement || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          icon={<TrendingUp size={18} />} 
          variant={(summary?.netLedgerMovement || 0) >= 0 ? "primary" : "neutral"} 
        />
      </StatGrid>

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
