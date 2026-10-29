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
import { DataTable } from '../../components/ui/DataTable';
import { PageContainer } from '../../components/ui/PageContainer';
import { PageHeader } from '../../components/ui/PageHeader';
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
      <PageHeader
        title="Student Balance Summary"
        subtitle="Authoritative register of student account balances, health tiers, and permitted negative balances."
        actions={
          <Button 
            variant="soft" 
            icon={<Download size={16} />} 
            onClick={handleExport} 
            disabled={isLoading || !data?.students.length}
          >
            Export Register
          </Button>
        }
      />

      <ReportTabs />

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <StatCard 
          label="Total Student Accounts" 
          value={data?.summary.totalStudents || 0} 
          icon={<Users />} 
          variant="primary" 
        />
        <StatCard 
          label="Positive Balance Surplus" 
          value={`₹${(data?.summary.positiveTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          subValue={`${data?.summary.positiveCount || 0} accounts`}
          icon={<CheckCircle2 />} 
          variant="success" 
        />
        <StatCard 
          label="Negative Balances (Deficit)" 
          value={`-₹${Math.abs(data?.summary.negativeTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          subValue={`${data?.summary.negativeCount || 0} accounts requiring recovery`}
          icon={<AlertCircle />} 
          variant="danger" 
        />
        <StatCard 
          label="Net Recorded Student Balances" 
          value={`₹${(data?.summary.netRecordedBalances || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          icon={<Scale />} 
          variant="neutral" 
        />
      </div>

      {/* Search and Filters Bar */}
      <Card padding="sm" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search by student name or enrolment no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '13px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Accounts</option>
              <option value="archived">Archived Accounts</option>
            </select>

            <select
              value={healthFilter}
              onChange={(e) => setHealthFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
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
