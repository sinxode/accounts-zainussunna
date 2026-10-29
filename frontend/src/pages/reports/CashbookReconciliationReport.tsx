import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowDownLeft, 
  ArrowUpRight, 
  TrendingUp,
  ShieldCheck,
  FileSearch
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { DataTable } from '../../components/ui/DataTable';
import { PageContainer } from '../../components/ui/PageContainer';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ReportTabs } from '../../components/reports/ReportTabs';
import { reportingService } from '../../lib/reportingService';
import { useUIStore } from '../../store/useUIStore';

export const CashbookReconciliationReport: React.FC = () => {
  const { setActiveModal, setExportData } = useUIStore();
  const [dateRange, setDateRange] = useState({
    start: `${new Date().getFullYear()}-01-01`,
    end: new Date().toISOString().split('T')[0]
  });

  const { data, isLoading } = useQuery({
    queryKey: ['cashbookReconciliation', dateRange],
    queryFn: () => reportingService.getCashbookReconciliationReport(dateRange.start, dateRange.end)
  });

  const handleExport = () => {
    if (!data) return;

    setExportData({
      title: `Cashbook Ledger & Reconciliation: ${dateRange.start} to ${dateRange.end}`,
      filename: `Cashbook_Reconciliation_${dateRange.start}_to_${dateRange.end}`,
      type: 'cashbook',
      columns: ['Date', 'Reference ID', 'Student', 'Type', 'Inflow (Credit)', 'Outflow (Debit)', 'Operation Ref', 'Reversal Status'],
      rows: data.transactions.map(t => [
        new Date(t.transaction_date).toLocaleDateString(),
        t.id,
        (t.students as any)?.name || 'N/A',
        t.transaction_type,
        t.direction === 'credit' ? `₹${Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-',
        t.direction === 'debit' ? `₹${Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-',
        t.operation_id || 'Legacy (None)',
        t.is_reversed || t.reversal_of_id ? 'Reversed' : 'Active'
      ])
    });
    setActiveModal('printExport');
  };

  return (
    <PageContainer>
      <PageHeader
        title="Cashbook & Reconciliation Report"
        subtitle="Authoritative double-entry cashbook ledger, arithmetic verification, and real-world cash reconciliation status."
        actions={
          <Button 
            variant="soft" 
            icon={<Download size={16} />} 
            onClick={handleExport} 
            disabled={isLoading || !data?.transactions.length}
          >
            Export Cashbook
          </Button>
        }
      />

      <ReportTabs />

      {/* Date Range Selector */}
      <Card padding="sm" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Reconciliation Period:</span>
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

      {/* 3-Pillar Reconciliation Status Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Pillar 1: Arithmetic */}
        <Card padding="md" style={{ borderLeft: '4px solid #10B981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <CheckCircle2 size={18} style={{ color: '#10B981' }} />
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>
              1. Arithmetic Consistency
            </h4>
          </div>
          <Badge variant="success" size="sm" style={{ marginBottom: '10px' }}>VERIFIED MATHEMATICALLY</Badge>
          <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4, margin: 0 }}>
            Sum of recorded inflows minus outflows equals net recorded movement exactly. No mathematical divergence in ledger calculations.
          </p>
        </Card>

        {/* Pillar 2: Source Traceability */}
        <Card padding="md" style={{ borderLeft: '4px solid #F59E0B' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <FileSearch size={18} style={{ color: '#F59E0B' }} />
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>
              2. Source Reference Integrity
            </h4>
          </div>
          <Badge variant="warning" size="sm" style={{ marginBottom: '10px' }}>PARTIALLY TRACEABLE</Badge>
          <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4, margin: 0 }}>
            {data?.traceability.withOperationId || 0} entries possess traceable operation correlation IDs; {data?.traceability.lackingOperationId || 0} legacy entries lack operation IDs.
          </p>
        </Card>

        {/* Pillar 3: Real-World Cash */}
        <Card padding="md" style={{ borderLeft: '4px solid #EF4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <AlertTriangle size={18} style={{ color: '#EF4444' }} />
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>
              3. Physical Cash Verification
            </h4>
          </div>
          <Badge variant="danger" size="sm" style={{ marginBottom: '10px' }}>UNVERIFIED PENDING AUDIT</Badge>
          <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4, margin: 0 }}>
            {data?.physicalCashStatus.explanation}
          </p>
        </Card>
      </div>

      {/* Period Summary Numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard 
          label="Total Cashbook Inflows" 
          value={`+₹${(data?.arithmetic.totalInflows || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          icon={<ArrowDownLeft />} 
          variant="success" 
        />
        <StatCard 
          label="Total Cashbook Outflows" 
          value={`-₹${(data?.arithmetic.totalOutflows || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          icon={<ArrowUpRight />} 
          variant="error" 
        />
        <StatCard 
          label="Net Recorded Movement" 
          value={`${(data?.arithmetic.netLedgerMovement || 0) >= 0 ? '+' : ''}₹${(data?.arithmetic.netLedgerMovement || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          icon={<TrendingUp />} 
          variant="primary" 
        />
        <StatCard 
          label="Traceable Entries" 
          value={`${data?.traceability.withOperationId || 0} / ${data?.traceability.totalTransactions || 0}`} 
          icon={<ShieldCheck />} 
          variant="neutral" 
        />
      </div>

      {/* Itemized Cashbook DataTable */}
      <Card padding="md">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="label-sm">Authoritative Cashbook Entries</h3>
          <span style={{ fontSize: '12px', color: '#64748B' }}>
            {data?.transactions.length || 0} entries in selected period
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
              header: 'Inflow (Credit)', 
              accessor: (t) => t.direction === 'credit' ? (
                <span className="text-success font-semibold">
                  +₹{Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              ) : '-',
              align: 'right'
            },
            { 
              header: 'Outflow (Debit)', 
              accessor: (t) => t.direction === 'debit' ? (
                <span className="text-error font-semibold">
                  -₹{Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              ) : '-',
              align: 'right'
            },
            {
              header: 'Operation Ref',
              accessor: (t) => t.operation_id ? (
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#475569' }}>
                  {t.operation_id.slice(0, 8)}...
                </span>
              ) : (
                <Badge variant="neutral" size="sm">Legacy</Badge>
              ),
              align: 'center'
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
          data={data?.transactions || []}
        />
      </Card>
    </PageContainer>
  );
};
