import React, { useState } from 'react';
import { 
  HandCoins, 
  Users, 
  BadgeIndianRupee, 
  AlertTriangle,
  Search,
  Plus,
  History,
  Target,
  ArrowRight,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/ui/PageContainer';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useOperationsDrawer } from '../../components/operations/drawers/OperationsDrawerContext';
import styles from './BorrowerDashboard.module.scss';
import { clsx } from 'clsx';
import { useBorrowerStatus } from '../../hooks/useBorrowerStatus';
import { OutstandingCenter } from '../../components/transfers/OutstandingCenter';

import { borrowerService } from '../../lib/services';
import { useQuery } from '@tanstack/react-query';

// Helper to determine risk and status badges based on dynamic rules
const BorrowerRiskAndStatusBadge: React.FC<{ borrower: any }> = ({ borrower }) => {
  const { isOverdue, status } = useBorrowerStatus(borrower);
  
  const baseRisk = borrower.risk_level || 'low';
  const dynamicRisk = isOverdue ? 'high' : baseRisk;
  
  const riskLabel = dynamicRisk === 'high' ? 'High Risk' : dynamicRisk === 'medium' ? 'Medium Risk' : 'Low Risk';
  const riskVariant = dynamicRisk === 'high' ? 'danger' : dynamicRisk === 'medium' ? 'warning' : 'success';
  const statusVariant = isOverdue ? 'danger' : 'success';

  return (
    <div className="flex items-center gap-1.5 justify-center">
      <Badge variant={statusVariant} size="sm" pill>
        {status}
      </Badge>
      <Badge variant={riskVariant} size="sm" pill>
        {riskLabel}
      </Badge>
    </div>
  );
};

export const BorrowerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { openDrawer } = useOperationsDrawer();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: borrowers = [] } = useQuery({
    queryKey: ['borrowers'],
    queryFn: borrowerService.list
  });

  const stats = [
    { label: 'Outstanding Amount', value: `₹${borrowers.reduce((acc: number, b: any) => acc + (b.borrower_loans?.reduce((sum: number, l: any) => sum + Number(l.loan_amount), 0) || 0), 0).toLocaleString()}`, icon: <HandCoins size={24} />, variant: 'danger' as const, subtitle: 'Total exposure' },
    { label: 'Active Borrowers', value: borrowers.filter(b => b.status === 'active').length.toString(), icon: <Users size={24} />, variant: 'primary' as const, subtitle: 'Current debtors' },
    { label: 'Recoveries (MTD)', value: `₹${borrowers.reduce((acc: number, b: any) => acc + (b.borrower_loans?.reduce((sum: number, l: any) => sum + (l.recoveries?.reduce((recSum: number, r: any) => recSum + Number(r.amount), 0) || 0), 0) || 0), 0).toLocaleString()}`, icon: <BadgeIndianRupee size={24} />, variant: 'success' as const, subtitle: 'This month' },
    { label: 'Overdue Borrowers', value: borrowers.filter(b => b.status === 'overdue').length.toString(), icon: <AlertTriangle size={24} />, variant: 'warning' as const, subtitle: 'Attention needed' },
  ];

  const insights = [
    { title: 'Largest Exposure', value: borrowers.reduce((prev: any, curr: any) => (prev.borrower_loans?.reduce((s: number, l: any) => s + Number(l.loan_amount), 0) || 0) > (curr.borrower_loans?.reduce((s: number, l: any) => s + Number(l.loan_amount), 0) || 0) ? prev : curr, borrowers[0])?.name || 'N/A', desc: 'Highest total loaned', icon: <Target size={18} />, color: 'danger' },
    { title: 'Most Reliable', value: 'N/A', desc: '100% recovery rate', icon: <CheckCircle2 size={18} />, color: 'success' },
    { title: 'Total Recoveries', value: `₹${borrowers.reduce((acc: number, b: any) => acc + (b.borrower_loans?.reduce((sum: number, l: any) => sum + (l.recoveries?.reduce((recSum: number, r: any) => recSum + Number(r.amount), 0) || 0), 0) || 0), 0).toLocaleString()}`, desc: 'All time', icon: <TrendingUp size={18} />, color: 'primary' },
  ];

  return (
    <PageContainer>
      <PageHeader 
        title="Borrowers Dashboard" 
        subtitle="Manage academy exposure and monitor recovery performance."
        actions={
          <div className="flex gap-2">
            <Button icon={<Plus size={18} />} onClick={() => openDrawer('external')}>New Loan</Button>
            <Button variant="soft" icon={<History size={18} />} onClick={() => openDrawer('recovery')}>Record Recovery</Button>
          </div>
        }
      />

      <div className={styles.grid}>
        <div className={styles.statsRow}>
          {stats.map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
        </div>

        <OutstandingCenter />

        <div className={styles.mainLayout}>
          <div className={styles.leftColumn}>
            <Card padding="none" className={styles.listCard}>
              <div className={clsx("flex-between", styles.listHeader)}>
                <h3 className="label-sm">Borrower Portfolio</h3>
                <div className={styles.searchBox}>
                  <Search size={16} />
                  <input type="text" placeholder="Search borrowers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <DataTable 
                columns={[
                  { 
                    header: 'Borrower', 
                    accessor: (b: any) => (
                      <div className={styles.borrowerInfo}>
                        <div className={styles.avatar}>{b.name.charAt(0)}</div>
                        <span>{b.name}</span>
                      </div>
                    )
                  },
                  { 
                    header: 'Outstanding', 
                    width: '140px',
                    accessor: (b: any) => {
                      const totalLoaned = b.borrower_loans?.reduce((sum: number, l: any) => sum + Number(l.loan_amount), 0) || 0;
                      const totalRecovered = b.borrower_loans?.reduce((sum: number, l: any) => sum + (l.recoveries?.reduce((recSum: number, r: any) => recSum + Number(r.amount), 0) || 0), 0) || 0;
                      return (
                        <div className="flex flex-col items-end">
                          <span>₹{(totalLoaned - totalRecovered).toLocaleString()}</span>
                          <div className="mobile-only-flex mt-1">
                            <BorrowerRiskAndStatusBadge borrower={b} />
                          </div>
                        </div>
                      );
                    },
                    align: 'right'
                  },
                  { 
                    header: 'Risk & Status', 
                    responsiveHidden: 'mobile',
                    accessor: (b: any) => (
                      <BorrowerRiskAndStatusBadge borrower={b} />
                    ),
                    align: 'center'
                  },
                  { 
                    header: 'Actions', 
                    width: '60px',
                    accessor: (b: any) => (
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/borrowers/${b.id}`)}>
                        <ArrowRight size={16} />
                      </Button>
                    ),
                    align: 'right'
                  }
                ]}
                data={borrowers.filter(b => 
                b.name.toLowerCase().includes(searchTerm.toLowerCase())
              )}
              />
            </Card>
          </div>

          <div className={styles.rightColumn}>
            <section className={styles.section}>
              <h3 className="label-sm mb-4">Smart Insights</h3>
              <div className={styles.insightsStack}>
                {insights.map((insight, i) => (
                  <Card key={i} padding="md" className={styles.insightItem}>
                    <div className={clsx(styles.iIcon, styles[insight.color])}>
                      {insight.icon}
                    </div>
                    <div className={styles.iContent}>
                      <span className={styles.iLabel}>{insight.title}</span>
                      <strong className={styles.iValue}>{insight.value}</strong>
                      <p className={styles.iDesc}>{insight.desc}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
