import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  CalendarRange, 
  LineChart, 
  Scale, 
  HandCoins, 
  Clock, 
  ShieldAlert, 
  Layers, 
  ArrowUpRight,
  AlertTriangle
} from 'lucide-react';
import { PageContainer } from '../../components/ui/PageContainer';
import { Badge } from '../../components/ui/Badge';
import { ReportTabs } from '../../components/reports/ReportTabs';
import styles from './ReportsHub.module.scss';

interface ReportCardProps {
  title: string;
  reportNumber: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  audience: string[];
  formats: string[];
}

const ReportCardItem: React.FC<ReportCardProps> = ({
  title,
  reportNumber,
  description,
  path,
  icon,
  audience,
  formats
}) => (
  <Link to={path} className={styles.reportCard}>
    <div className={styles.cardTop}>
      <div className={styles.iconWrapper}>
        <div className={styles.iconCircle}>
          {icon}
        </div>
        <span className={styles.reportNumber}>{reportNumber}</span>
      </div>
      <div className={styles.arrowBtn}>
        <ArrowUpRight size={15} />
      </div>
    </div>

    <div className={styles.cardBody}>
      <h3 className={styles.reportTitle}>{title}</h3>
      <p className={styles.reportDesc}>{description}</p>
    </div>

    <div className={styles.cardFooter}>
      <div className={styles.badgeList}>
        {audience.map(a => (
          <Badge key={a} variant="neutral" size="sm" pill>{a}</Badge>
        ))}
      </div>
      <span className={styles.formatText}>
        {formats.join(' • ')}
      </span>
    </div>
  </Link>
);

export const ReportsHub: React.FC = () => {
  return (
    <PageContainer>
      <ReportTabs />

      <div className={styles.container}>
        {/* Group 1: Student Ledger & Operational Reports */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Student Ledger & Operational Reports</h2>
            <Badge variant="success" size="sm" pill>Core Accounts</Badge>
          </div>
          <div className={styles.cardGrid}>
            <ReportCardItem
              reportNumber="Report 01"
              title="Student Account Statement"
              description="Itemized statement for a selected student with running balances, verified transaction legs, and reversals."
              path="/reports/student-statement"
              icon={<FileText size={18} />}
              audience={['Students', 'Parents', 'Admins']}
              formats={['PDF', 'Excel', 'CSV']}
            />
            <ReportCardItem
              reportNumber="Report 02"
              title="Student Balance Summary"
              description="Complete register of all student accounts showing current authoritative balances and health classification."
              path="/reports/students"
              icon={<Users size={18} />}
              audience={['Faculty', 'Admins']}
              formats={['PDF', 'Excel', 'CSV']}
            />
            <ReportCardItem
              reportNumber="Report 03"
              title="Monthly Transaction Summary"
              description="Periodic breakdown of recorded collections, withdrawals, distributions, and store bills."
              path="/reports/monthly"
              icon={<CalendarRange size={18} />}
              audience={['Faculty', 'Admins']}
              formats={['PDF', 'Excel', 'CSV']}
            />
            <ReportCardItem
              reportNumber="Report 04"
              title="Financial Activity Summary"
              description="High-level overview of total student fund volume, inflows, outflows, and allocation across transaction types."
              path="/reports/summary"
              icon={<LineChart size={18} />}
              audience={['Admins', 'Super Admin']}
              formats={['PDF', 'Excel', 'CSV']}
            />
            <ReportCardItem
              reportNumber="Report 09"
              title="Transaction Type Matrix"
              description="Comprehensive cross-tabulation of transaction counts, gross volumes, reversals, and net movements."
              path="/reports/transaction-types"
              icon={<Layers size={18} />}
              audience={['Admins', 'Super Admin']}
              formats={['PDF', 'Excel', 'CSV']}
            />
          </div>
        </section>

        {/* Group 2: Lending & Exposure Reports */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>External Lending & Exposure Reports</h2>
            <Badge variant="warning" size="sm" pill>Institutional Assets</Badge>
          </div>
          <div className={styles.cardGrid}>
            <ReportCardItem
              reportNumber="Report 06"
              title="Borrower Exposure & Loans"
              description="Portfolio summary of all outside borrower loans, recorded recoveries, authoritative balances, and risk tiering."
              path="/reports/borrowers"
              icon={<HandCoins size={18} />}
              audience={['Managers', 'Admins']}
              formats={['PDF', 'Excel', 'CSV']}
            />
            <ReportCardItem
              reportNumber="Report 07"
              title="Borrower Aging Schedule"
              description="Itemized active loan exposure categorized by calendar days elapsed since recorded disbursement."
              path="/reports/borrower-aging"
              icon={<Clock size={18} />}
              audience={['Managers', 'Admins']}
              formats={['PDF', 'Excel', 'CSV']}
            />
          </div>
        </section>

        {/* Group 3: Reconciliation & Governance */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Reconciliation & Auditor Governance</h2>
            <Badge variant="danger" size="sm" pill>Auditor Oversight</Badge>
          </div>
          <div className={styles.cardGrid}>
            <ReportCardItem
              reportNumber="Report 05"
              title="Cashbook & Reconciliation"
              description="Authoritative transaction cashbook comparing mathematical consistency with physical cash verification."
              path="/reports/cashbook"
              icon={<Scale size={18} />}
              audience={['Admins', 'Auditors']}
              formats={['PDF', 'Excel', 'CSV']}
            />
            <ReportCardItem
              reportNumber="Report 08"
              title="Audit & Correction Activity"
              description="Immutable log of system modifications: transaction reversals with justifications, period locks, and deactivations."
              path="/reports/audit"
              icon={<ShieldAlert size={18} />}
              audience={['Super Admin', 'Auditors']}
              formats={['PDF', 'Excel', 'CSV']}
            />
            <ReportCardItem
              reportNumber="Report 10"
              title="Data-Quality & Exceptions"
              description="Systematic audit of historical anomalies: missing operation IDs, unverified opening balances, and loan recovery gaps."
              path="/reports/reconciliation-exceptions"
              icon={<AlertTriangle size={18} />}
              audience={['Super Admin', 'Auditors']}
              formats={['PDF', 'Excel', 'CSV']}
            />
          </div>
        </section>
      </div>
    </PageContainer>
  );
};
