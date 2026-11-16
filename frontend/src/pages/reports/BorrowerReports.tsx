import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  HandCoins, 
  TrendingDown, 
  AlertCircle, 
  Download, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { StatGrid } from '../../components/ui/StatGrid';
import { DataTable } from '../../components/ui/DataTable';
import { PageContainer } from '../../components/ui/PageContainer';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ReportTabs } from '../../components/reports/ReportTabs';
import { reportingService } from '../../lib/reportingService';

export const BorrowerReports: React.FC = () => {
  const { setExportData, setActiveModal } = useUIStore();

  const { data, isLoading } = useQuery({
    queryKey: ['borrowerExposureReport'],
    queryFn: reportingService.getBorrowerExposureReport
  });

  const handleExport = () => {
    if (!data) return;
    setExportData({
      title: 'Borrower Exposure & Loan Outstanding Report',
      filename: `Borrower_Exposure_${new Date().toISOString().split('T')[0]}`,
      type: 'report',
      columns: ['Borrower Name', 'Loan ID', 'Loan Date', 'Purpose', 'Principal Amount', 'Total Recovered', 'Outstanding Balance', 'Risk Level', 'Status'],
      rows: data.loans.map(l => [
        l.borrower_name,
        l.loan_id,
        l.loan_date ? new Date(l.loan_date).toLocaleDateString() : 'N/A',
        l.purpose || 'None',
        `₹${Number(l.loan_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `₹${Number(l.total_recovered).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `₹${Number(l.outstanding_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        l.risk_level,
        l.status
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
            Export Portfolio
          </Button>
        }
      />

      {/* Historical Loan Reconciliation Notice */}
      {data?.historicalDisclaimer && (
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
          <span><strong>Notice:</strong> {data.historicalDisclaimer}</span>
        </div>
      )}

      {/* Summary Cards */}
      <StatGrid columns={4}>
        <StatCard 
          label="Total Recorded Principal" 
          value={`₹${(data?.totalPrincipal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          subValue={`${data?.loans.length || 0} total loans`}
          icon={<HandCoins size={18} />} 
          variant="primary" 
        />
        <StatCard 
          label="Total Recorded Recoveries" 
          value={`₹${(data?.totalRecovered || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          icon={<CheckCircle2 size={18} />} 
          variant="success" 
        />
        <StatCard 
          label="Outstanding Exposure" 
          value={`₹${(data?.totalOutstanding || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          subValue={`${data?.activeCount || 0} active loans`}
          icon={<TrendingDown size={18} />} 
          variant="danger" 
        />
        <StatCard 
          label="High Risk Loans" 
          value={data?.highRiskCount || 0} 
          icon={<AlertCircle size={18} />} 
          variant="warning" 
        />
      </StatGrid>

      {/* Main Table */}
      <Card padding="md">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="label-sm">Authoritative Borrower Loan Portfolio</h3>
          <span style={{ fontSize: '12px', color: '#64748B' }}>
            {data?.loans.length || 0} loans recorded
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
              accessor: (l) => l.loan_date ? new Date(l.loan_date).toLocaleDateString() : 'N/A'
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
              header: 'Authoritative Outstanding', 
              accessor: (l) => (
                <span style={{ fontWeight: 700, color: Number(l.outstanding_amount) > 0 ? '#E11D48' : '#16A34A' }}>
                  ₹{Number(l.outstanding_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              ),
              align: 'right' 
            },
            { 
              header: 'Status', 
              accessor: (l) => (
                <Badge variant={l.status === 'settled' ? 'success' : 'neutral'} size="sm">
                  {l.status}
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
