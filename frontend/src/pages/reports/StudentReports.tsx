import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clsx } from 'clsx';
import { 
  FileText, 
  Download, 
  Printer, 
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { DataTable } from '../../components/ui/DataTable';
import { PageContainer } from '../../components/ui/PageContainer';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { ReportTabs } from '../../components/reports/ReportTabs';
import { reportingService } from '../../lib/reportingService';
import { studentService } from '../../lib/services';
import { useUIStore } from '../../store/useUIStore';
import styles from './StudentReports.module.scss';
import { ChartCard } from '../../components/reports/ChartCard';

export const StudentReports: React.FC = () => {
  const { setActiveModal, setExportData } = useUIStore();
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const { data: students } = useQuery({
    queryKey: ['studentsSummary'],
    queryFn: studentService.getHealthSummary
  });

  const { data: report, isLoading } = useQuery({
    queryKey: ['studentReport', selectedStudent, dateRange],
    queryFn: () => reportingService.getStudentStatement(selectedStudent!, dateRange.start, dateRange.end),
    enabled: !!selectedStudent
  });

  const chartData = [
    { name: 'Deposits', value: report?.totalDeposited || 0 },
    { name: 'Withdrawals', value: report?.totalWithdrawn || 0 },
  ];

  const handleExport = () => {
    if (!report || !selectedStudent) return;
    
    const student = students?.find(s => s.id === selectedStudent);
    
    setExportData({
      title: `Student Financial Statement: ${student?.name}`,
      filename: `Statement_${student?.enrolment_no}_${dateRange.start}_to_${dateRange.end}`,
      type: 'statement',
      columns: ['Date', 'Purpose', 'Type', 'Amount', 'Balance'],
      rows: report.transactions.map(t => [
        new Date(t.transaction_date).toLocaleDateString(),
        t.purpose,
        t.transaction_type,
        `${t.direction === 'credit' ? '+' : '-'}₹${t.amount.toLocaleString()}`,
        `₹${t.running_balance.toLocaleString()}`
      ])
    });
    setActiveModal('printExport');
  };

  return (
    <PageContainer>
      <PageHeader
        title="Student Reports"
        subtitle="Generate detailed financial statements and ledger history."
        actions={
          <div className="flex gap-2">
            <Button variant="soft" icon={<Download size={16} />} onClick={handleExport} disabled={!selectedStudent || isLoading}>Export Excel</Button>
            <Button variant="soft" icon={<Printer size={16} />} onClick={handleExport} disabled={!selectedStudent || isLoading}>Print PDF</Button>
          </div>
        }
      />

      <ReportTabs />

      <div className={styles.filtersRow}>
        <Card className={styles.filterCard} padding="sm">
          <div className={styles.filterGrid}>
            <div className={styles.filterItem}>
              <label>Select Student</label>
              <select 
                value={selectedStudent || ''} 
                onChange={(e) => setSelectedStudent(e.target.value)}
                className={styles.select}
              >
                <option value="">Choose a student...</option>
                {students?.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.enrolment_no})</option>
                ))}
              </select>
            </div>
            <div className={styles.filterItem}>
              <label>Start Date</label>
              <input 
                type="date" 
                value={dateRange.start} 
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className={styles.dateInput}
              />
            </div>
            <div className={styles.filterItem}>
              <label>End Date</label>
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
          <p>Please select a student from the dropdown to generate their financial report.</p>
        </div>
      ) : isLoading ? (
        <div className={styles.loadingWrapper}>
          <div className={clsx("glass-effect", styles.loadingBox)}>Generating Report...</div>
        </div>
      ) : (
        <div className={styles.reportContent}>
          <div className={styles.statsRow}>
            <StatCard label="Opening Balance" value={`₹${report?.openingBalance.toLocaleString()}`} icon={<CreditCard />} variant="neutral" />
            <StatCard label="Total Deposited" value={`₹${report?.totalDeposited.toLocaleString()}`} icon={<ArrowDownLeft />} variant="success" />
            <StatCard label="Total Withdrawn" value={`₹${report?.totalWithdrawn.toLocaleString()}`} icon={<ArrowUpRight />} variant="error" />
            <StatCard label="Closing Balance" value={`₹${report?.closingBalance.toLocaleString()}`} icon={<TrendingUp />} variant="primary" />
          </div>

          <div className={styles.visualGrid}>
            <ChartCard 
              title="Cash Flow Breakdown" 
              type="pie" 
              data={chartData} 
              dataKeys={['value']} 
              colors={['#10b981', '#ef4444']} 
              height={220}
            />
            <Card className={styles.summaryCard}>
              <h3 className="label-sm">Report Summary</h3>
              <div className={styles.summaryInfo}>
                <div className={styles.sItem}>
                  <span>Period</span>
                  <strong>{new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}</strong>
                </div>
                <div className={styles.sItem}>
                  <span>Total Transactions</span>
                  <strong>{report?.transactions.length}</strong>
                </div>
                <div className={styles.sItem}>
                  <span>Net Position</span>
                  <strong className={(report?.totalDeposited || 0) > (report?.totalWithdrawn || 0) ? "text-success" : "text-error"}>
                    {(report?.totalDeposited || 0) > (report?.totalWithdrawn || 0) ? '+' : ''}
                    ₹{((report?.totalDeposited || 0) - (report?.totalWithdrawn || 0)).toLocaleString()}
                  </strong>
                </div>
              </div>
            </Card>
          </div>

          <Card className={styles.ledgerCard}>
            <h3 className="label-sm">Full Ledger History</h3>
            <DataTable 
              columns={[
                { header: 'Date', accessor: (t) => new Date(t.transaction_date).toLocaleDateString() },
                { header: 'Purpose', accessor: 'purpose' },
                { header: 'Type', accessor: (t) => t.transaction_type.replace('_', ' '), align: 'center' },
                { 
                  header: 'Amount', 
                  accessor: (t) => (
                    <span className={t.direction === 'credit' ? "text-success" : "text-error"}>
                      {t.direction === 'credit' ? '+' : '-'}₹{t.amount.toLocaleString()}
                    </span>
                  ),
                  align: 'right'
                },
                { 
                  header: 'Running Balance', 
                  accessor: (t) => `₹${t.running_balance.toLocaleString()}`, 
                  align: 'right' 
                },
              ]}
              data={report?.transactions || []}
            />
          </Card>
        </div>
      )}
    </PageContainer>
  );
};
