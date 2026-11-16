import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Download, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Scale
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

export const StudentBalanceSummaryReport: React.FC = () => {
  const { setActiveModal, setExportData } = useUIStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['studentBalanceSummary', search, statusFilter, healthFilter],
    queryFn: () => reportingService.getStudentBalanceSummary({
      search,
      status: statusFilter,
      health: healthFilter
    })
  });

  const handleExport = () => {
    if (!data) return;

    setExportData({
      title: 'Student Balance Summary Register',
      filename: `Student_Balances_${new Date().toISOString().split('T')[0]}`,
      type: 'report',
      columns: ['Enrolment No', 'Student Name', 'Status', 'Health Tier', 'Recorded Balance', 'Last Transaction'],
      rows: data.students.map(s => [
        s.enrolment_no,
        s.name,
        s.status,
        s.health_status,
        `₹${Number(s.current_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        s.last_transaction_date ? new Date(s.last_transaction_date).toLocaleDateString() : 'None'
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
            disabled={isLoading || !data?.students.length}
          >
            Export Register
          </Button>
        }
      />

      {/* Summary Cards */}
      <StatGrid columns={4}>
        <StatCard 
          label="Total Student Accounts" 
          value={data?.summary.totalStudents || 0} 
          icon={<Users size={18} />} 
          variant="primary" 
        />
        <StatCard 
          label="Positive Balance Surplus" 
          value={`₹${(data?.summary.positiveTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          subValue={`${data?.summary.positiveCount || 0} accounts`}
          icon={<CheckCircle2 size={18} />} 
          variant="success" 
        />
        <StatCard 
          label="Negative Balances (Deficit)" 
          value={`-₹${Math.abs(data?.summary.negativeTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          subValue={`${data?.summary.negativeCount || 0} requiring recovery`}
          icon={<AlertCircle size={18} />} 
          variant="danger" 
        />
        <StatCard 
          label="Net Recorded Student Balances" 
          value={`₹${(data?.summary.netRecordedBalances || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          icon={<Scale size={18} />} 
          variant="neutral" 
        />
      </StatGrid>

      {/* Search and Filters Bar */}
      <Card padding="sm" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search student or enrolment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 12px 7px 34px',
                borderRadius: 'var(--radius-pill, 999px)',
                border: '1px solid var(--border)',
                background: 'var(--bg-subtle)',
                fontSize: '12.5px',
                color: 'var(--text-strong)'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-pill, 999px)',
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                fontSize: '12.5px',
                color: 'var(--text-strong)'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Accounts</option>
              <option value="archived">Archived Accounts</option>
            </select>

            <select
              value={healthFilter}
              onChange={(e) => setHealthFilter(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-pill, 999px)',
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                fontSize: '12.5px',
                color: 'var(--text-strong)'
              }}
            >
              <option value="all">All Health Tiers</option>
              <option value="healthy">Healthy (Above ₹500)</option>
              <option value="low">Low Balance (0 - ₹500)</option>
              <option value="negative">Negative Deficit (&lt; ₹0)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card padding="md">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="label-sm">Authoritative Student Account Register</h3>
          <span style={{ fontSize: '12px', color: '#64748B' }}>
            Showing {data?.students.length || 0} student accounts
          </span>
        </div>

        <DataTable
          columns={[
            {
              header: 'Enrolment No',
              accessor: 'enrolment_no',
              align: 'left'
            },
            {
              header: 'Student Name',
              accessor: (s) => (
                <div style={{ fontWeight: 600, color: '#0F172A' }}>
                  {s.name}
                </div>
              )
            },
            {
              header: 'Status',
              accessor: (s) => (
                <Badge variant={s.status === 'active' ? 'success' : 'neutral'} size="sm">
                  {s.status}
                </Badge>
              ),
              align: 'center'
            },
            {
              header: 'Health Tier',
              accessor: (s) => (
                <Badge 
                  variant={s.health_status === 'healthy' ? 'success' : s.health_status === 'low' ? 'warning' : 'danger'} 
                  size="sm"
                >
                  {s.health_status}
                </Badge>
              ),
              align: 'center'
            },
            {
              header: 'Recorded Balance',
              accessor: (s) => {
                const bal = Number(s.current_balance);
                return (
                  <span style={{ 
                    fontWeight: 700, 
                    color: bal < 0 ? '#E11D48' : bal === 0 ? '#64748B' : '#0F172A' 
                  }}>
                    {bal < 0 ? '-' : ''}₹{Math.abs(bal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                );
              },
              align: 'right'
            },
            {
              header: 'Last Transaction',
              accessor: (s) => s.last_transaction_date ? new Date(s.last_transaction_date).toLocaleDateString() : 'None',
              align: 'right'
            }
          ]}
          data={data?.students.map(s => ({ ...s, id: s.student_id })) || []}
        />
      </Card>
    </PageContainer>
  );
};
