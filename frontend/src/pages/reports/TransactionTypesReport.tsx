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
import { DataTable } from '../../components/ui/DataTable';
import { PageContainer } from '../../components/ui/PageContainer';
import { PageHeader } from '../../components/ui/PageHeader';
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
      <PageHeader
        title="Transaction Type & Direction Matrix"
        subtitle="Cross-tabulated analysis of transaction counts, volumes, and reversals across all operational types."
        actions={
          <Button 
            variant="soft" 
            icon={<Download size={16} />} 
            onClick={handleExport} 
            disabled={isLoading || !data?.matrix.length}
          >
            Export Matrix
          </Button>
        }
      />

      <ReportTabs />

      {/* Historical Type Scope Note */}
      <div style={{
        backgroundColor: '#EFF6FF',
        border: '1px solid #BFDBFE',
        borderRadius: '8px',
        padding: '14px 16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        <Info size={18} style={{ color: '#2563EB', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '12.5px', color: '#1E40AF', lineHeight: 1.5 }}>
          <strong>Historical Classification Notice:</strong> {data?.notes}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard 
          label="Total All-Time Transactions" 
          value={data?.totalTransactions || 0} 
          icon={<Layers />} 
          variant="primary" 
        />
        <StatCard 
          label="Cumulative Ledger Volume" 
          value={`₹${totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          icon={<CheckCircle2 />} 
          variant="success" 
        />
        <StatCard 
          label="Total Reversals Logged" 
          value={totalReversals} 
          icon={<RotateCcw />} 
          variant="warning" 
        />
        <StatCard 
          label="Active Categories Tracked" 
          value={data?.matrix.length || 0} 
          icon={<Layers />} 
          variant="neutral" 
        />
      </div>

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
