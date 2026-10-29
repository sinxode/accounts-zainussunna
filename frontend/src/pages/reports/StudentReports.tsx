import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FileText, 
  Download, 
  Printer, 
  ArrowDownLeft,
  ArrowUpRight, 
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Wallet
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
import { studentService } from '../../lib/services';
import { useUIStore } from '../../store/useUIStore';
import { useAuth } from '../../contexts/AuthContext';
import styles from './StudentReports.module.scss';

export const StudentReports: React.FC = () => {
  const { setActiveModal, setExportData } = useUIStore();
  const { role } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const { data: students } = useQuery({
    queryKey: ['studentsSummary'],
    queryFn: studentService.getHealthSummary
  });

  // Auto-select student if parent or if single student available
  useEffect(() => {
    if (!selectedStudent && students && students.length > 0) {
      if (role === 'parent' || students.length === 1) {
        setSelectedStudent(students[0].id);
      }
    }
  }, [students, selectedStudent, role]);

  const { data: report, isLoading } = useQuery({
    queryKey: ['studentReport', selectedStudent, dateRange],
    queryFn: () => reportingService.getStudentStatement(selectedStudent!, dateRange.start, dateRange.end),
    enabled: !!selectedStudent
  });

  const handleExport = (formatType: 'statement' | 'report') => {
    if (!report || !selectedStudent) return;
    
    const student = students?.find(s => s.id === selectedStudent);
    
    setExportData({
      title: `Student Statement: ${student?.name} (${student?.enrolment_no})`,
      filename: `Statement_${student?.enrolment_no}_${dateRange.start}_to_${dateRange.end}`,
      type: formatType,
      columns: ['Date', 'Reference ID', 'Type', 'Direction', 'Purpose', 'Amount', 'Status', 'Running Balance'],
      rows: report.transactions.map(t => [
        new Date(t.transaction_date).toLocaleDateString(),
        t.transaction_id || t.id,
        t.transaction_type,
        t.direction,
        t.purpose,
        `${t.direction === 'credit' ? '+' : '-'}₹${Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        t.is_reversed || t.reversal_of_id ? 'Reversed' : 'Active',
        `₹${Number(t.running_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
      ])
    });
    setActiveModal('printExport');
  };

  return (
    <PageContainer>
      <PageHeader
        title="Student Account Statement"
        subtitle="Itemized student ledger history with verified running balances and baseline audit disclosures."
        actions={
          <div className="flex gap-2">
            <Button 
              variant="soft" 
              icon={<Download size={16} />} 
              onClick={() => handleExport('statement')} 
              disabled={!selectedStudent || isLoading}
            >
              Export Statement
            </Button>
            <Button 
              variant="soft" 
              icon={<Printer size={16} />} 
              onClick={() => handleExport('statement')} 
              disabled={!selectedStudent || isLoading}
            >
              Print PDF
            </Button>
          </div>
        }
      />

      <ReportTabs />

      <div className={styles.filtersRow}>
        <Card className={styles.filterCard} padding="sm">
          <div className={styles.filterGrid}>
            <div className={styles.filterItem}>
              <label>Select Student Account</label>
              <select 
                value={selectedStudent || ''} 
                onChange={(e) => setSelectedStudent(e.target.value)}
                className={styles.select}
                disabled={role === 'parent' && students?.length === 1}
              >
                <option value="">Choose a student...</option>
                {students?.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.enrolment_no})</option>
                ))}
              </select>
            </div>
            <div className={styles.filterItem}>
              <label>Period Start</label>
              <input 
                type="date" 
                value={dateRange.start} 
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className={styles.dateInput}
              />
            </div>
            <div className={styles.filterItem}>
              <label>Period End</label>
              <input 
                type="date" 
                value={dateRange.end} 
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className={styles.dateInput}
              />
            </div>
          </div>
        </Card>
      </div>

      {!selectedStudent ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><FileText size={48} strokeWidth={1.5} /></div>
          <h3>No Student Selected</h3>
          <p>Please select a student account above to generate their authoritative ledger statement.</p>
        </div>
      ) : isLoading ? (
        <div className={styles.loadingWrapper}>
          <div className="glass-effect p-6 text-center text-muted">Retrieving authoritative ledger statement...</div>
        </div>
      ) : (
        <div className={styles.reportContent}>
          {/* Missing Opening Balance Disclosure Banner */}
          <div style={{
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <AlertTriangle size={18} style={{ color: '#D97706', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '12.5px', color: '#92400E', lineHeight: 1.5 }}>
              <strong>Historical Baseline Notice:</strong> {report?.openingBalanceNote} Recorded prior cumulative movement before {dateRange.start} is ₹{(report?.priorRecordedActivity || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}.
            </div>
          </div>

          <div className={styles.statsRow}>
            <StatCard 
              label="Historical Inception Baseline" 
              value="Unverified" 
              icon={<Wallet />} 
              variant="neutral" 
            />
            <StatCard 
              label="Period Deposits" 
              value={`+₹${(report?.totalDeposited || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
              icon={<ArrowDownLeft />} 
              variant="success" 
            />
            <StatCard 
              label="Period Withdrawals" 
              value={`-₹${(report?.totalWithdrawn || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
              icon={<ArrowUpRight />} 
              variant="error" 
            />
            <StatCard 
              label="Period Reversals" 
              value={`${report?.reversalCount || 0} (₹${(report?.totalReversed || 0).toLocaleString()})`} 
              icon={<RotateCcw />} 
              variant="warning" 
            />
            <StatCard 
              label="Authoritative Current Balance" 
              value={`₹${(report?.authoritativeClosingBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
              icon={<TrendingUp />} 
              variant={(report?.authoritativeClosingBalance || 0) < 0 ? "error" : "primary"} 
            />
          </div>

          <Card className={styles.ledgerCard} padding="md">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 className="label-sm">Authoritative Itemized Ledger Entries</h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  Showing {report?.transactions.length || 0} entries between {dateRange.start} and {dateRange.end}
                </span>
              </div>
              <Badge variant="neutral" size="sm">
                Net Period Movement: {(report?.periodNetMovement || 0) >= 0 ? '+' : ''}₹{(report?.periodNetMovement || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Badge>
            </div>

            <DataTable 
              columns={[
                { header: 'Date', accessor: (t) => new Date(t.transaction_date).toLocaleDateString() },
                { 
                  header: 'Reference', 
                  accessor: (t) => (
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#64748B' }}>
                      {(t.transaction_id || t.id).slice(0, 8)}...
                    </span>
                  ) 
                },
                { 
                  header: 'Type', 
                  accessor: (t) => (
                    <Badge variant="neutral" size="sm">
                      {String(t.transaction_type).replace('_', ' ')}
                    </Badge>
                  ),
                  align: 'center'
                },
                { header: 'Purpose / Description', accessor: 'purpose' },
                { 
                  header: 'Amount', 
                  accessor: (t) => (
                    <span className={t.direction === 'credit' ? "text-success font-semibold" : "text-error font-semibold"}>
                      {t.direction === 'credit' ? '+' : '-'}₹{Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  ),
                  align: 'right'
                },
                {
                  header: 'Status',
                  accessor: (t) => (
                    t.is_reversed || t.reversal_of_id ? (
                      <Badge variant="danger" size="sm">Reversed</Badge>
                    ) : (
                      <Badge variant="success" size="sm">Active</Badge>
                    )
                  ),
                  align: 'center'
                },
                { 
                  header: 'Running Balance', 
                  accessor: (t) => (
                    <span style={{ fontWeight: 600, color: Number(t.running_balance) < 0 ? '#E11D48' : '#0F172A' }}>
                      ₹{Number(t.running_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  ), 
                  align: 'right' 
                },
              ]}
              data={report?.transactions.map(t => ({ ...t, id: t.transaction_id || t.id })) || []}
            />
          </Card>
        </div>
      )}
    </PageContainer>
  );
};
