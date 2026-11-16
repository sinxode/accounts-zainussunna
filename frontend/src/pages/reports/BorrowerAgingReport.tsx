import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Clock, 
  Download, 
  Info, 
  AlertCircle,
  Calendar,
  Layers
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

export const BorrowerAgingReport: React.FC = () => {
  const { setActiveModal, setExportData } = useUIStore();

  const { data, isLoading } = useQuery({
    queryKey: ['borrowerAgingReport'],
    queryFn: reportingService.getBorrowerAgingReport
  });

  const handleExport = () => {
    if (!data) return;

    setExportData({
      title: 'Borrower Loan Aging Schedule',
      filename: `Borrower_Aging_${new Date().toISOString().split('T')[0]}`,
      type: 'aging',
      columns: ['Borrower Name', 'Loan ID', 'Loan Date', 'Days Elapsed', 'Age Bracket', 'Principal', 'Recovered', 'Outstanding Balance', 'Risk Level'],
      rows: data.loans.map(l => [
        l.borrower_name,
        l.loan_id,
        new Date(l.loan_date).toLocaleDateString(),
        l.daysElapsed,
        l.ageBracket,
        `₹${Number(l.loan_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `₹${Number(l.total_recovered).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `₹${Number(l.outstanding_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        l.risk_level
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
            disabled={isLoading || !data?.loans.length}
          >
            Export Aging Schedule
          </Button>
        }
      />

      {/* Policy Limitation Disclaimer */}
      {data?.policyDisclaimer && (
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
          <span><strong>Notice:</strong> {data.policyDisclaimer} Brackets represent elapsed calendar time.</span>
        </div>
      )}

      {/* Aging Bracket Cards */}
      <StatGrid columns={4}>
        <StatCard 
          label="0 – 30 Days (Current)" 
          value={`₹${(data?.agingBuckets.under30Days.outstanding || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          subValue={`${data?.agingBuckets.under30Days.count || 0} loans`}
          icon={<Clock size={18} />} 
          variant="success" 
        />
        <StatCard 
          label="31 – 90 Days (Aging)" 
          value={`₹${(data?.agingBuckets.days31to90.outstanding || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          subValue={`${data?.agingBuckets.days31to90.count || 0} loans`}
          icon={<Calendar size={18} />} 
          variant="neutral" 
        />
        <StatCard 
          label="91 – 180 Days (Extended)" 
          value={`₹${(data?.agingBuckets.days91to180.outstanding || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          subValue={`${data?.agingBuckets.days91to180.count || 0} loans`}
          icon={<AlertCircle size={18} />} 
          variant="warning" 
        />
        <StatCard 
          label="> 180 Days (Historical)" 
          value={`₹${(data?.agingBuckets.over180Days.outstanding || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          subValue={`${data?.agingBuckets.over180Days.count || 0} loans`}
          icon={<Layers size={18} />} 
          variant="danger" 
        />
      </StatGrid>

      {/* Active Aging Loans DataTable */}
      <Card padding="md">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="label-sm">Active Loans by Elapsed Age</h3>
          <span style={{ fontSize: '12px', color: '#64748B' }}>
            {data?.loans.length || 0} active loans with outstanding balances
          </span>
        </div>

        <DataTable 
          columns={[
            { 
              header: 'Borrower', 
              accessor: (l) => (
                <div style={{ fontWeight: 600, color: '#0F172A' }}>
                  {l.borrower_name}
                </div>
              ) 
            },
            {
              header: 'Loan Date',
              accessor: (l) => new Date(l.loan_date).toLocaleDateString()
            },
            {
              header: 'Days Elapsed',
              accessor: (l) => (
                <span style={{ fontWeight: 600, color: '#334155' }}>
                  {l.daysElapsed} days
                </span>
              ),
              align: 'center'
            },
            {
              header: 'Age Bracket',
              accessor: (l) => (
                <Badge 
                  variant={l.daysElapsed > 180 ? 'danger' : l.daysElapsed > 90 ? 'warning' : l.daysElapsed > 30 ? 'neutral' : 'success'} 
                  size="sm"
                >
                  {l.ageBracket}
                </Badge>
              ),
              align: 'center'
            },
            { 
              header: 'Principal', 
              accessor: (l) => `₹${Number(l.loan_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 
              align: 'right' 
            },
            { 
              header: 'Recovered', 
              accessor: (l) => `₹${Number(l.total_recovered).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 
              align: 'right' 
            },
            { 
              header: 'Outstanding Balance', 
              accessor: (l) => (
                <span style={{ fontWeight: 700, color: '#E11D48' }}>
                  ₹{Number(l.outstanding_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              ),
              align: 'right' 
            },
            { 
              header: 'Risk Level', 
              accessor: (l) => (
                <Badge 
                  variant={l.risk_level === 'high' ? 'danger' : l.risk_level === 'medium' ? 'warning' : 'success'} 
                  size="sm"
                >
                  {l.risk_level}
                </Badge>
              ),
              align: 'center'
            },
          ]}
          data={data?.loans.map(l => ({ ...l, id: l.loan_id })) || []}
        />
      </Card>
    </PageContainer>
  );
};
