import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserMinus, TrendingDown, AlertCircle, FileText, Download } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { DataTable } from '../../components/ui/DataTable';
import { PageContainer } from '../../components/ui/PageContainer';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { ReportTabs } from '../../components/reports/ReportTabs';
import { reportingService } from '../../lib/reportingService';
import { borrowerService } from '../../lib/services';
import styles from './BorrowerReports.module.scss';
import { Badge } from '../../components/ui/Badge';

export const BorrowerReports: React.FC = () => {
  const { setExportData, setActiveModal } = useUIStore();
  const { data: breakdown } = useQuery({
    queryKey: ['borrowerRisk'],
    queryFn: reportingService.getBorrowerRiskBreakdown
  });

  const { data: borrowersList } = useQuery({
    queryKey: ['borrowersListReport'],
    queryFn: borrowerService.list
  });

  const handleExport = () => {
    if (!borrowersList) return;
    setExportData({
      title: 'Borrower Risk Portfolio',
      filename: `Borrower_Risk_${new Date().toISOString().split('T')[0]}`,
      type: 'report',
      columns: ['Borrower', 'Risk Level', 'Outstanding', 'Status'],
      rows: borrowersList.map(b => [
        b.name,
        b.risk_level,
        `₹${Number(b.total_outstanding).toLocaleString()}`,
        b.status
      ])
    });
    setActiveModal('printExport');
  };

  return (
    <PageContainer>
      <PageHeader
        title="Borrower Risk Reports"
        subtitle="Monitor external loans and recovery performance."
        actions={
          <Button variant="soft" icon={<Download size={16} />} onClick={handleExport} disabled={!borrowersList || borrowersList.length === 0}>Export List</Button>
        }
      />

      <ReportTabs />

      <div className={styles.statsRow}>
        <StatCard label="Active Borrowers" value={breakdown?.count || 0} icon={<UserMinus />} variant="primary" />
        <StatCard label="Outstanding Amount" value={`₹${Number(breakdown?.totalOutstanding || 0).toLocaleString()}`} icon={<TrendingDown />} variant="danger" />
        <StatCard label="High Risk exposure" value={breakdown?.highRisk || 0} icon={<AlertCircle />} variant="warning" />
        <StatCard label="Recoveries (MTD)" value={`₹${Number(breakdown?.recoveriesMTD || 0).toLocaleString()}`} icon={<FileText />} variant="success" />
      </div>

      <Card className={styles.tableCard}>
        <h3 className="label-sm">Active Loan Portfolio</h3>
        <DataTable 
          columns={[
            { header: 'Borrower', accessor: 'name' },
            { 
              header: 'Risk Level', 
              accessor: (b) => (
                <Badge variant={b.risk_level === 'high' ? 'danger' : b.risk_level === 'medium' ? 'warning' : 'success'} size="sm">
                  {b.risk_level}
                </Badge>
              ) 
            },
            { 
              header: 'Outstanding', 
              accessor: (b) => `₹${Number(b.total_outstanding || 0).toLocaleString()}`, 
              align: 'right' 
            },
            { 
              header: 'Last Payment', 
              accessor: (b) => b.last_recovery_at ? new Date(b.last_recovery_at).toLocaleDateString() : 'Never' 
            },
            { 
              header: 'Status', 
              accessor: (b) => (
                <Badge variant={b.status === 'overdue' ? 'danger' : b.status === 'active' ? 'success' : 'neutral'} size="sm">
                  {b.status}
                </Badge>
              ) 
            },
          ]}
          data={borrowersList || []}
        />
      </Card>
    </PageContainer>
  );
};
