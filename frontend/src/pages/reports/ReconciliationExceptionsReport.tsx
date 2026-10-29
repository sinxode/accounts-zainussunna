import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  AlertTriangle, 
  Download, 
  ShieldAlert, 
  CheckCircle2, 
  Info,
  FileSearch
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { PageContainer } from '../../components/ui/PageContainer';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ReportTabs } from '../../components/reports/ReportTabs';
import { reportingService } from '../../lib/reportingService';
import { useUIStore } from '../../store/useUIStore';

export const ReconciliationExceptionsReport: React.FC = () => {
  const { setActiveModal, setExportData } = useUIStore();

  const { data, isLoading } = useQuery({
    queryKey: ['reconciliationExceptionsReport'],
    queryFn: reportingService.getReconciliationExceptionsReport
  });

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
      <PageHeader
        title="Historical Data-Quality & Reconciliation Exceptions"
        subtitle="Authoritative audit register of legacy anomalies, unverified baselines, and pending physical reconciliations."
        actions={
          <Button 
            variant="soft" 
            icon={<Download size={16} />} 
            onClick={handleExport} 
            disabled={isLoading || !data?.exceptions.length}
          >
            Export Exceptions Register
          </Button>
        }
      />

      <ReportTabs />

      {/* Audit Transparency Banner */}
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
          <strong>Financial Integrity Commitment:</strong> The ZLS rebuild preserves all historical transaction artifacts transparently. We never invent clean opening balances or silently omit legacy anomalies. The register below exposes every documented reconciliation exception requiring physical committee review.
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard 
          label="Total Tracked Exceptions" 
          value={data?.exceptions.length || 0} 
          icon={<AlertTriangle />} 
          variant="neutral" 
        />
        <StatCard 
          label="Critical Physical Audits" 
          value={criticalCount} 
          subValue="Borrower loans lacking recoveries"
          icon={<ShieldAlert />} 
          variant="danger" 
        />
        <StatCard 
          label="Historical Artifact Warnings" 
          value={warningCount} 
          subValue="Preserved legacy data structures"
          icon={<FileSearch />} 
          variant="warning" 
        />
        <StatCard 
          label="Reconciliation Status" 
          value="Preserved" 
          icon={<CheckCircle2 />} 
          variant="success" 
        />
      </div>

      {/* Exceptions Item Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {data?.exceptions.map((exc) => (
          <Card key={exc.id} padding="md" style={{ borderLeft: exc.severity === 'critical' ? '4px solid #EF4444' : exc.severity === 'warning' ? '4px solid #F59E0B' : '4px solid #3B82F6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', letterSpacing: '0.05em' }}>
                    {exc.id} • {exc.category.toUpperCase()}
                  </span>
                  <Badge 
                    variant={exc.severity === 'critical' ? 'danger' : exc.severity === 'warning' ? 'warning' : 'primary'} 
                    size="sm"
                  >
                    {exc.severity.toUpperCase()}
                  </Badge>
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', margin: 0 }}>
                  {exc.title}
                </h3>
              </div>
              <Badge variant="neutral" size="sm">{exc.status.replace(/_/g, ' ')}</Badge>
            </div>

            <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5, marginBottom: '12px' }}>
              <strong>Accounting Risk:</strong> {exc.accountingRisk}
            </div>

            <div style={{ 
              backgroundColor: '#F8FAFC', 
              padding: '10px 12px', 
              borderRadius: '6px', 
              fontSize: '12px', 
              color: '#475569',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span><strong>Operational Notes:</strong> {exc.notes}</span>
              {exc.impactAmount && (
                <span style={{ fontWeight: 700, color: '#E11D48', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                  Impact: ₹{exc.impactAmount.toLocaleString()}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
};
