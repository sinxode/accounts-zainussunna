import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ShieldAlert, 
  Download, 
  Info, 
  Filter, 
  Clock, 
  UserCheck, 
  FileCheck2
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

export const AuditActivityReport: React.FC = () => {
  const { setActiveModal, setExportData } = useUIStore();
  const [actionFilter, setActionFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: '2026-10-01',
    end: new Date().toISOString().split('T')[0]
  });

  const { data, isLoading } = useQuery({
    queryKey: ['auditActivityReport', actionFilter, dateRange],
    queryFn: () => reportingService.getAuditCorrectionReport({
      startDate: dateRange.start,
      endDate: dateRange.end,
      action: actionFilter
    })
  });

  const handleExport = () => {
    if (!data) return;

    setExportData({
      title: 'Transaction Audit & Correction Activity Report',
      filename: `Audit_Report_${dateRange.start}_to_${dateRange.end}`,
      type: 'audit',
      columns: ['Timestamp', 'Actor ID', 'Action', 'Entity', 'Entity ID', 'Justification / Reason', 'Operation Reference'],
      rows: data.logs.map(l => [
        new Date(l.created_at).toLocaleString(),
        l.user_id || 'System (Security Definer)',
        l.action,
        l.entity,
        l.entity_id || 'N/A',
        l.new_values?.reversal_reason || l.new_values?.notes || l.new_values?.reason || 'System Action Recorded',
        l.new_values?.operation_id || 'Direct'
      ])
    });
    setActiveModal('printExport');
  };

  const reversalCount = data?.logs.filter(l => l.action === 'REVERSE_TRANSACTION').length || 0;
  const periodLockCount = data?.logs.filter(l => l.action.includes('PERIOD')).length || 0;
  const userAdminCount = data?.logs.filter(l => l.action.includes('USER') || l.action.includes('ROLE')).length || 0;

  return (
    <PageContainer>
      <PageHeader
        title="Transaction Audit & Correction Activity Report"
        subtitle="Immutable audit log of all financial modifications, transaction reversals with mandatory reasons, and security events."
        actions={
          <Button 
            variant="soft" 
            icon={<Download size={16} />} 
            onClick={handleExport} 
            disabled={isLoading || !data?.logs.length}
          >
            Export Audit Trail
          </Button>
        }
      />

      <ReportTabs />

      {/* Historical Audit Infrastructure Disclaimer */}
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
          <strong>Audit Infrastructure Scope:</strong> {data?.coverageDisclaimer} All entries below represent cryptographically tied database events written exclusively by trusted PostgreSQL procedures with client direct write protection.
        </div>
      </div>

      {/* Filters Bar */}
      <Card padding="sm" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={15} style={{ color: '#1E3A5F' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Filter Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
            >
              <option value="all">All Audited Actions</option>
              <option value="REVERSE_TRANSACTION">Transaction Reversals</option>
              <option value="CREATE_BULK_TRANSACTIONS">Bulk Operations</option>
              <option value="CREATE_INTERNAL_LOAN">Internal Transfers</option>
              <option value="REPAY_INTERNAL_LOAN">Internal Repayments</option>
              <option value="RECORD_BORROWER_RECOVERY">External Recoveries</option>
              <option value="LOCK_ACCOUNTING_PERIOD">Accounting Period Locks</option>
              <option value="DEACTIVATE_USER">User Security Admin</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64748B' }}>Date Range:</span>
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
        </div>
      </Card>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard 
          label="Total Audited Events" 
          value={data?.logs.length || 0} 
          icon={<ShieldAlert />} 
          variant="primary" 
        />
        <StatCard 
          label="Compensating Reversals" 
          value={reversalCount} 
          subValue="Requires >= 10 char reason"
          icon={<FileCheck2 />} 
          variant="warning" 
        />
        <StatCard 
          label="Period Lock Actions" 
          value={periodLockCount} 
          icon={<Clock />} 
          variant="neutral" 
        />
        <StatCard 
          label="User Access Modifications" 
          value={userAdminCount} 
          icon={<UserCheck />} 
          variant="success" 
        />
      </div>

      {/* Audit Logs Table */}
      <Card padding="md">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="label-sm">System Audit Records</h3>
          <span style={{ fontSize: '12px', color: '#64748B' }}>
            Showing {data?.logs.length || 0} events
          </span>
        </div>

        <DataTable
          columns={[
            {
              header: 'Timestamp',
              accessor: (l) => (
                <span style={{ fontSize: '12px', color: '#334155', whiteSpace: 'nowrap' }}>
                  {new Date(l.created_at).toLocaleString()}
                </span>
              )
            },
            {
              header: 'Action',
              accessor: (l) => (
                <Badge 
                  variant={
                    l.action === 'REVERSE_TRANSACTION' ? 'danger' :
                    l.action.includes('LOCK') ? 'warning' :
                    l.action.includes('USER') ? 'primary' : 'neutral'
                  } 
                  size="sm"
                >
                  {l.action}
                </Badge>
              ),
              align: 'center'
            },
            {
              header: 'Entity / Target',
              accessor: (l) => (
                <span style={{ fontSize: '12px', color: '#475569' }}>
                  {l.entity} ({String(l.entity_id || '').slice(0, 8)}...)
                </span>
              )
            },
            {
              header: 'Reason / Operational Payload',
              accessor: (l) => {
                const reason = l.new_values?.reversal_reason || l.new_values?.notes;
                if (reason) {
                  return (
                    <span style={{ fontSize: '12.5px', color: '#0F172A', fontStyle: 'italic' }}>
                      "{reason}"
                    </span>
                  );
                }
                return (
                  <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#64748B' }}>
                    {JSON.stringify(l.new_values || {}).slice(0, 45)}...
                  </span>
                );
              }
            },
            {
              header: 'Actor Reference',
              accessor: (l) => (
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#64748B' }}>
                  {l.user_id ? String(l.user_id).slice(0, 8) + '...' : 'System'}
                </span>
              ),
              align: 'right'
            }
          ]}
          data={data?.logs || []}
        />
      </Card>
    </PageContainer>
  );
};
