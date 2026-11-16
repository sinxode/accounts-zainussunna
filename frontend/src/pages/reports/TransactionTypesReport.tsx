import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Layers, 
  Download, 
  Info, 
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { StatGrid } from '../../components/ui/StatGrid';
import { DataTable } from '../../components/ui/DataTable';
import { PageContainer } from '../../components/ui/PageContainer';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ReportTabs } from '../../components/reports/ReportTabs';
import { reportingService } from '../../lib/reportingService';
import { useUIStore } from '../../store/useUIStore';

export const TransactionTypesReport: React.FC = () => {
  const { setActiveModal, setExportData } = useUIStore();

  const { data, isLoading } = useQuery({
    queryKey: ['transactionTypeSummary'],
    queryFn: reportingService.getTransactionTypeSummary
  });

  const handleExport = () => {
    if (!data) return;

    setExportData({
      title: 'Transaction Type & Direction Matrix',
      filename: `Transaction_Type_Matrix_${new Date().toISOString().split('T')[0]}`,
      type: 'report',
      columns: ['Transaction Type', 'Direction', 'Transaction Count', 'Gross Volume', 'Reversal Count', 'Net Active Volume'],
      rows: data.matrix.map(m => [
        m.type,
        m.direction,
        m.count,
        `₹${m.volume.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        m.reversalsCount,
        `₹${m.netVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
      ])
    });
    setActiveModal('printExport');
  };

  const totalVolume = data?.matrix.reduce((sum, m) => sum + m.volume, 0) || 0;
  const totalReversals = data?.matrix.reduce((sum, m) => sum + m.reversalsCount, 0) || 0;

  return (
    <PageContainer>
      <ReportTabs 
        actions={
          <Button 
            variant="soft" 
            size="sm"
            icon={<Download size={15} />} 
            onClick={handleExport} 
            disabled={isLoading || !data?.matrix.length}
          >
            Export Matrix
          </Button>
        }
      />

      {/* Historical Type Scope Note */}
      {data?.notes && (
        <div style={{
          backgroundColor: 'var(--bg-subtle)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-tile, 14px)',
          padding: '10px 14px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '12px',
          color: 'var(--text-body)'
        }}>
          <Info size={16} style={{ color: 'var(--green-700)', flexShrink: 0 }} />
          <span><strong>Notice:</strong> {data.notes}</span>
        </div>
      )}

      {/* Summary Cards */}
      <StatGrid columns={4}>
        <StatCard 
          label="Total All-Time Transactions" 
          value={data?.totalTransactions || 0} 
          icon={<Layers size={18} />} 
          variant="primary" 
        />
        <StatCard 
          label="Cumulative Ledger Volume" 
          value={`₹${totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          icon={<CheckCircle2 size={18} />} 
          variant="success" 
        />
        <StatCard 
          label="Total Reversals Logged" 
          value={totalReversals} 
          icon={<RotateCcw size={18} />} 
          variant="warning" 
        />
        <StatCard 
          label="Active Categories Tracked" 
          value={data?.matrix.length || 0} 
          icon={<Layers size={18} />} 
          variant="neutral" 
        />
      </StatGrid>

      {/* Matrix DataTable */}
      <Card padding="md">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="label-sm">Transaction Type Matrix</h3>
          <span style={{ fontSize: '12px', color: '#64748B' }}>
            {data?.matrix.length || 0} distinct type/direction combinations
          </span>
        </div>

        <DataTable
          columns={[
            {
              header: 'Transaction Type',
              accessor: (m) => (
                <div style={{ fontWeight: 600, color: '#0F172A' }}>
                  <Badge variant="neutral" size="sm">{m.type.replace('_', ' ').toUpperCase()}</Badge>
                </div>
              )
            },
            {
              header: 'Direction',
              accessor: (m) => (
                <Badge variant={m.direction === 'credit' ? 'success' : 'danger'} size="sm">
                  {m.direction.toUpperCase()}
                </Badge>
              ),
              align: 'center'
            },
            {
              header: 'Recorded Entries',
              accessor: (m) => m.count,
              align: 'center'
            },
            {
              header: 'Gross Volume',
              accessor: (m) => `₹${m.volume.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
              align: 'right'
            },
            {
              header: 'Reversals Count',
              accessor: (m) => (
                <span style={{ color: m.reversalsCount > 0 ? '#D97706' : '#64748B', fontWeight: m.reversalsCount > 0 ? 600 : 400 }}>
                  {m.reversalsCount}
                </span>
              ),
              align: 'center'
            },
            {
              header: 'Net Active Volume',
              accessor: (m) => (
                <span style={{ fontWeight: 700, color: m.direction === 'credit' ? '#16A34A' : '#E11D48' }}>
                  {m.direction === 'credit' ? '+' : '-'}₹{m.netVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              ),
              align: 'right'
            }
          ]}
          data={data?.matrix.map(m => ({ ...m, id: `${m.type}_${m.direction}` })) || []}
        />
      </Card>
    </PageContainer>
  );
};
