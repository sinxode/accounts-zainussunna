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
  AlertTriangle,
  ArrowRight,
  Info
} from 'lucide-react';
import { PageContainer } from '../../components/ui/PageContainer';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ReportTabs } from '../../components/reports/ReportTabs';

interface ReportCardProps {
  title: string;
  reportNumber: number;
  description: string;
  path: string;
  icon: React.ReactNode;
  audience: string[];
  formats: string[];
  statusNote?: string;
}

const ReportCardItem: React.FC<ReportCardProps> = ({
  title,
  reportNumber,
  description,
  path,
  icon,
  audience,
  formats,
  statusNote
}) => (
  <Card padding="md" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            borderRadius: '8px', 
            backgroundColor: '#F1F5F9', 
            color: '#1E3A5F', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            {icon}
          </div>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Report {reportNumber}
            </span>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', margin: 0 }}>
              {title}
            </h3>
          </div>
        </div>
      </div>

      <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, marginBottom: '14px' }}>
        {description}
      </p>

      {statusNote && (
        <div style={{ 
          fontSize: '11px', 
          backgroundColor: '#FFFBEB', 
          color: '#B45309', 
          padding: '6px 10px', 
          borderRadius: '6px', 
          marginBottom: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Info size={13} style={{ flexShrink: 0 }} />
          <span>{statusNote}</span>
        </div>
      )}
    </div>

    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #F1F5F9', marginBottom: '14px' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {audience.map(a => (
            <Badge key={a} variant="neutral" size="sm">{a}</Badge>
          ))}
        </div>
        <span style={{ fontSize: '11px', color: '#94A3B8' }}>
          {formats.join(' • ')}
        </span>
      </div>

      <Link 
        to={path}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          width: '100%',
          padding: '8px 14px',
          backgroundColor: '#1E3A5F',
          color: '#FFFFFF',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: 500,
          textDecoration: 'none'
        }}
      >
        <span>Open Report</span>
        <ArrowRight size={14} />
      </Link>
    </div>
  </Card>
);

export const ReportsHub: React.FC = () => {
  return (
    <PageContainer>
      <PageHeader
        title="Financial Reports & Reconciliation Hub"
        subtitle="Authoritative, traceable financial reports, cashbook reconciliation, borrower analytics, and branded exports."
      />

      <ReportTabs />

      {/* Accounting Integrity Disclaimer Banner */}
      <div style={{ 
        backgroundColor: '#EFF6FF', 
        border: '1px solid #BFDBFE', 
        borderRadius: '8px', 
        padding: '14px 16px', 
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        <Info size={18} style={{ color: '#1D4ED8', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '12.5px', color: '#1E40AF', lineHeight: 1.5 }}>
          <strong>ZLS Authoritative Reporting Principles:</strong> All reports derive strictly from verified ledger entries and database views (`student_ledger_view`, `student_balances`, `borrower_loan_balances`, `audit_logs`). Negative student balances are preserved without artificial clamping. Historical starting balances prior to system inception and physical cash drawer counts remain disclosed as unverified pending formal institutional baseline audit.
        </div>
      </div>

      {/* Group 1: Student & Ledger Reports */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1E293B', margin: 0 }}>
            Student Ledger & Operational Reports
          </h2>
          <Badge variant="primary" size="sm">Core Accounts</Badge>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          <ReportCardItem
            reportNumber={1}
            title="Student Account Statement"
            description="Itemized statement for a selected student with running balances, verified transaction legs, reversals, and missing opening balance disclosure."
            path="/reports/student-statement"
            icon={<FileText size={18} />}
            audience={['Students', 'Parents', 'Admins']}
            formats={['PDF', 'Excel', 'CSV']}
            statusNote="Discloses unverified historical inception baseline."
          />
          <ReportCardItem
            reportNumber={2}
            title="Student Balance Summary"
            description="Complete register of all student accounts showing current authoritative balances, health classification, and permitted negative balances."
            path="/reports/students"
            icon={<Users size={18} />}
            audience={['Faculty', 'Admins']}
            formats={['PDF', 'Excel', 'CSV']}
          />
          <ReportCardItem
            reportNumber={3}
            title="Monthly Transaction Summary"
            description="Periodic breakdown of recorded collections, withdrawals, distributions, and store bills with explicit gross vs. net vs. reversal distinction."
            path="/reports/monthly"
            icon={<CalendarRange size={18} />}
            audience={['Faculty', 'Admins']}
            formats={['PDF', 'Excel', 'CSV']}
          />
          <ReportCardItem
            reportNumber={4}
            title="Financial Activity Summary"
            description="High-level overview of total student fund volume, inflows, outflows, and allocation across transaction types without uncertified P&L claims."
            path="/reports/summary"
            icon={<LineChart size={18} />}
            audience={['Admins', 'Super Admin']}
            formats={['PDF', 'Excel', 'CSV']}
          />
          <ReportCardItem
            reportNumber={9}
            title="Transaction Type Matrix"
            description="Comprehensive cross-tabulation of transaction counts, gross volumes, reversals, and net movements grouped by transaction type and direction."
            path="/reports/transaction-types"
            icon={<Layers size={18} />}
            audience={['Admins', 'Super Admin']}
            formats={['PDF', 'Excel', 'CSV']}
          />
        </div>
      </div>

      {/* Group 2: Lending & Receivables */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1E293B', margin: 0 }}>
            External Lending & Exposure Reports
          </h2>
          <Badge variant="warning" size="sm">Institutional Assets</Badge>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          <ReportCardItem
            reportNumber={6}
            title="Borrower Exposure & Loans"
            description="Portfolio summary of all outside borrower loans, recorded recoveries, authoritative outstanding balances, and risk tiering."
            path="/reports/borrowers"
            icon={<HandCoins size={18} />}
            audience={['Money Managers', 'Admins']}
            formats={['PDF', 'Excel', 'CSV']}
            statusNote="Discloses 20 pre-rebuild loans (₹196,562) lacking recovery rows."
          />
          <ReportCardItem
            reportNumber={7}
            title="Borrower Aging Schedule"
            description="Itemized active loan exposure categorized by calendar days elapsed since recorded disbursement, avoiding unsupported default determinations."
            path="/reports/borrower-aging"
            icon={<Clock size={18} />}
            audience={['Money Managers', 'Admins']}
            formats={['PDF', 'Excel', 'CSV']}
            statusNote="Age computed in elapsed days; official loan term policy pending."
          />
        </div>
      </div>

      {/* Group 3: Reconciliation & Governance */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1E293B', margin: 0 }}>
            Reconciliation, Audit & Exception Governance
          </h2>
          <Badge variant="danger" size="sm">Auditor Oversight</Badge>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          <ReportCardItem
            reportNumber={5}
            title="Cashbook & Reconciliation"
            description="Authoritative transaction cashbook comparing mathematical consistency with real-world physical cash verification status."
            path="/reports/cashbook"
            icon={<Scale size={18} />}
            audience={['Admins', 'Super Admin', 'Auditors']}
            formats={['PDF', 'Excel', 'CSV']}
            statusNote="Distinguishes arithmetic consistency from physical cash audits."
          />
          <ReportCardItem
            reportNumber={8}
            title="Audit & Correction Activity"
            description="Immutable log of system modifications: transaction reversals with mandatory justifications, period locks, and user deactivations."
            path="/reports/audit"
            icon={<ShieldAlert size={18} />}
            audience={['Super Admin', 'Auditors']}
            formats={['PDF', 'Excel', 'CSV']}
            statusNote="Discloses that logging commenced October 2026."
          />
          <ReportCardItem
            reportNumber={10}
            title="Data-Quality & Exceptions"
            description="Systematic audit of historical anomalies: missing operation IDs, unverified opening balances, legacy reversal flags, and loan recovery gaps."
            path="/reports/reconciliation-exceptions"
            icon={<AlertTriangle size={18} />}
            audience={['Super Admin', 'Auditors']}
            formats={['PDF', 'Excel', 'CSV']}
            statusNote="Authoritative inventory of 5 known historical exceptions."
          />
        </div>
      </div>
    </PageContainer>
  );
};
