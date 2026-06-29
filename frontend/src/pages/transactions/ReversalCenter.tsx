import React from 'react';
import { 
  ArrowLeft,
  User,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/ui/PageContainer';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import styles from './ReversalCenter.module.scss';
import { clsx } from 'clsx';

export const ReversalCenter: React.FC = () => {
  const navigate = useNavigate();

  const reversals = [
    { id: 'TX-45285', date: '10 Jun 2026', student: 'Zaid Amin', amount: 2000, reason: 'Entry Error: Duplicate', reversedBy: 'Admin Sarah', originalType: 'Recovery' },
    { id: 'TX-45210', date: '05 Jun 2026', student: 'Ahmed Khan', amount: 5000, reason: 'Accidental Zero added', reversedBy: 'Manager Joe', originalType: 'Deposit' },
    { id: 'TX-45192', date: '01 Jun 2026', student: 'Ali Mohammed', amount: 150, reason: 'Incorrect Student Selected', reversedBy: 'Admin Sarah', originalType: 'Store Bill' },
  ];

  return (
    <PageContainer>
      <div className={styles.navBar}>
        <Link to="/transactions/explorer" className={styles.backLink}>
          <ArrowLeft size={18} />
          <span>Back to Explorer</span>
        </Link>
      </div>

      <PageHeader 
        title="Reversal Center" 
        subtitle="Immutable log of all corrected financial transactions."
      />

      <div className={styles.container}>
        <Card padding="lg" className={styles.infoCard}>
          <div className={styles.infoContent}>
            <div className={clsx(styles.infoIcon, styles.warning)}>
              <AlertCircle size={24} />
            </div>
            <div className={styles.infoText}>
              <h4>Financial Integrity Notice</h4>
              <p>Zainussunna Academy does not delete financial records. Corrections are made via reversals, which preserve the original entry for audit purposes while neutralizing the ledger impact.</p>
            </div>
          </div>
        </Card>

        <Card padding="none" className={styles.tableCard}>
          <DataTable 
            columns={[
              { 
                header: 'Transaction', 
                accessor: (r) => (
                  <div className={styles.txCell}>
                    <code className={styles.txId}>{r.id}</code>
                    <Badge variant="neutral" size="sm">{r.originalType}</Badge>
                    <span className="mobile-only-inline text-muted text-xs mt-1">
                      Date: {r.date}
                    </span>
                  </div>
                )
              },
              { 
                header: 'Student', 
                accessor: (r) => (
                  <div className="flex flex-col">
                    <span>{r.student}</span>
                    <span className="mobile-only-inline text-muted text-xs mt-1">
                      By: {r.reversedBy}
                    </span>
                  </div>
                )
              },
              { 
                header: 'Amount', 
                accessor: (r) => (
                  <div className="flex flex-col items-end">
                    <span className={styles.amount}>₹{r.amount.toLocaleString()}</span>
                    <span className="mobile-only-inline text-muted text-xs mt-1 text-right">
                      {r.reason}
                    </span>
                  </div>
                ),
                align: 'right'
              },
              { 
                header: 'Reason for Reversal', 
                responsiveHidden: 'mobile',
                accessor: 'reason' 
              },
              { 
                header: 'Reversed By', 
                responsiveHidden: 'mobile',
                accessor: (r) => (
                  <div className={styles.userCell}>
                    <User size={14} />
                    <span>{r.reversedBy}</span>
                  </div>
                )
              },
              { 
                header: 'Date', 
                responsiveHidden: 'mobile',
                accessor: 'date', 
                align: 'right' 
              },
              { 
                header: '', 
                accessor: (r) => (
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/transactions/${r.id}`)}>
                    <ArrowRight size={18} />
                  </Button>
                ),
                align: 'right'
              }
            ]}
            data={reversals}
          />
        </Card>
      </div>
    </PageContainer>
  );
};
