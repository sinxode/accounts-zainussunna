import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  AlertTriangle, 
  Download, 
  ShieldAlert, 
  CheckCircle2, 
  Info,
  FileSearch,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { StatGrid } from '../../components/ui/StatGrid';
import { PageContainer } from '../../components/ui/PageContainer';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ReportTabs } from '../../components/reports/ReportTabs';
import { reportingService } from '../../lib/reportingService';
import { useUIStore } from '../../store/useUIStore';

const formatStatusLabel = (status: string) => {
  switch (status) {
    case 'UNRESOLVED_PENDING_COMMITTEE_AUDIT': return 'Pending Audit';
    case 'PRESERVED_HISTORICAL_ARTIFACT': return 'Preserved';
    case 'RESOLVED': return 'Resolved';
    default: return status.replace(/_/g, ' ');
  }
};

export const ReconciliationExceptionsReport: React.FC = () => {
  const { setActiveModal, setExportData } = useUIStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['reconciliationExceptionsReport'],
    queryFn: reportingService.getReconciliationExceptionsReport
  });

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const handleExport = () => {
    if (!data) return;

    setExportData({
      title: 'Historical Data-Quality & Reconciliation Exceptions Register',
      filename: `Reconciliation_Exceptions_${new Date().toISOString().split('T')[0]}`,
      type: 'report',
      columns: ['Exception ID', 'Category', 'Condition Title', 'Count / Volume', 'Severity', 'Accounting Risk Assessment', 'Status'],
      rows: data.exceptions.map(e => [
        e.id,
        e.category,
        e.title,
        e.impactAmount ? `₹${e.impactAmount.toLocaleString()}` : `${e.count} records`,
        e.severity.toUpperCase(),
        e.accountingRisk,
        e.status
      ])
    });
    setActiveModal('printExport');
  };

  const criticalCount = data?.exceptions.filter(e => e.severity === 'critical').length || 0;
  const warningCount = data?.exceptions.filter(e => e.severity === 'warning').length || 0;

  return (
    <PageContainer>
      <ReportTabs 
        actions={
          <Button 
            variant="soft" 
            size="sm"
            icon={<Download size={15} />} 
            onClick={handleExport} 
            disabled={isLoading || !data?.exceptions.length}
          >
            Export Exceptions Register
          </Button>
        }
      />

      {/* Audit Transparency Banner */}
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
        <span><strong>Notice:</strong> The register below itemizes historical anomalies and unverified balances requiring physical audit review.</span>
      </div>

      {/* Summary Cards */}
      <StatGrid columns={4}>
        <StatCard 
          label="Total Tracked Exceptions" 
          value={data?.exceptions.length || 0} 
          icon={<AlertTriangle size={18} />} 
          variant="neutral" 
        />
        <StatCard 
          label="Critical Physical Audits" 
          value={criticalCount} 
          subValue="Borrower loans lacking recoveries"
          icon={<ShieldAlert size={18} />} 
          variant="danger" 
        />
        <StatCard 
          label="Historical Artifact Warnings" 
          value={warningCount} 
          subValue="Preserved legacy data structures"
          icon={<FileSearch size={18} />} 
          variant="warning" 
        />
        <StatCard 
          label="Reconciliation Status" 
          value="Preserved" 
          icon={<CheckCircle2 size={18} />} 
          variant="success" 
        />
      </StatGrid>

      {/* Exceptions Item Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {data?.exceptions.map((exc) => {
          const isExpanded = expandedId === exc.id;
          const borderColor = exc.severity === 'critical' ? 'var(--debit)' : exc.severity === 'warning' ? 'var(--warn)' : 'var(--info)';

          return (
            <Card 
              key={exc.id} 
              padding="sm" 
              style={{ 
                borderLeft: `4px solid ${borderColor}`,
                cursor: 'pointer',
                transition: 'all 180ms ease'
              }}
              onClick={() => toggleExpand(exc.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                      {exc.id} • {exc.category.toUpperCase()}
                    </span>
                    <Badge 
                      variant={exc.severity === 'critical' ? 'danger' : exc.severity === 'warning' ? 'warning' : 'primary'} 
                      size="sm"
                    >
                      {exc.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <h3 style={{ 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    color: 'var(--text-strong)', 
                    margin: 0,
                    whiteSpace: isExpanded ? 'normal' : 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {exc.title}
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <Badge variant="neutral" size="sm">{formatStatusLabel(exc.status)}</Badge>
                  {isExpanded ? (
                    <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} />
                  ) : (
                    <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>
              </div>

              {/* Collapsed short hint or expanded full assessment */}
              {!isExpanded ? (
                <div style={{ 
                  fontSize: '11.5px', 
                  color: 'var(--text-muted)', 
                  marginTop: '4px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {exc.accountingRisk}
                </div>
              ) : (
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-body)', lineHeight: 1.5, marginBottom: '8px' }}>
                    <strong>Accounting Risk:</strong> {exc.accountingRisk}
                  </div>

                  <div style={{ 
                    backgroundColor: 'var(--bg-subtle)', 
                    padding: '8px 12px', 
                    borderRadius: 'var(--radius-tile, 10px)', 
                    fontSize: '11.5px', 
                    color: 'var(--text-body)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '6px'
                  }}>
                    <span><strong>Operational Notes:</strong> {exc.notes}</span>
                    {exc.impactAmount && (
                      <span style={{ fontWeight: 700, color: 'var(--debit)', whiteSpace: 'nowrap' }}>
                        Impact: ₹{exc.impactAmount.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
};
