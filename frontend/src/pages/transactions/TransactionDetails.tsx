import React from 'react';
import { 
  ArrowLeft, 
  RotateCcw, 
  User, 
  Receipt,
  FileText,
  ShieldCheck,
  History,
  Plus
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { transactionService } from '../../lib/services';
import { PageContainer } from '../../components/ui/PageContainer';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import styles from './TransactionDetails.module.scss';
import { clsx } from 'clsx';

export const TransactionDetails: React.FC = () => {
  const { id } = useParams();

  const { data: tx, isLoading } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => transactionService.getById(id!),
    enabled: !!id
  });

  if (isLoading || !tx) return <PageContainer>Loading...</PageContainer>;

  const auditTrail = [
    { id: 1, action: 'Transaction Created', user: 'System', time: new Date(tx.created_at).toLocaleString(), icon: <Plus size={14} />, color: 'success' },
  ];

  return (
    <PageContainer>
      <div className={styles.navBar}>
        <Link to="/transactions/explorer" className={styles.backLink}>
          <ArrowLeft size={18} />
          <span>Back to Explorer</span>
        </Link>
        <div className={styles.navActions}>
          <Button variant="ghost" size="sm" icon={<FileText size={16} />}>Receipt</Button>
          <Button variant="ghost" size="sm" icon={<History size={16} />}>Audit Log</Button>
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.main}>
          {/* Header Card */}
          <section className={styles.headerSection}>
            <div className={styles.txInfo}>
              <div className={styles.iconArea}>
                <Receipt size={28} />
              </div>
              <div className={styles.details}>
                <h1 className={styles.title}>Transaction Details</h1>
                <div className={styles.meta}>
                  <code className={styles.idCode}>{tx.id.slice(0, 8)}...</code>
                  <div className={styles.dot} />
                  <Badge variant={tx.is_reversed ? 'danger' : 'success'} size="sm" pill>
                    {tx.is_reversed ? 'Reversed' : 'Active'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className={styles.amountDisplay}>
              <span className={styles.label}>Transaction Amount</span>
              <div className={clsx(styles.value, tx.direction === 'credit' ? "text-success" : "text-danger")}>
                {tx.direction === 'credit' ? '+' : '-'}₹ {Math.abs(tx.amount).toLocaleString()}
              </div>
            </div>
          </section>

          {/* Primary Info */}
          <div className={styles.grid}>
            <Card padding="lg" className={styles.infoCard}>
              <h3 className="label-sm mb-6">General Information</h3>
              <div className={styles.infoList}>
                <div className={styles.infoRow}>
                  <span>Student</span>
                  <div className={styles.sCell}>
                    <User size={16} />
                    <strong>{tx.students?.name || 'N/A'} ({tx.students?.enrolment_no || '-'})</strong>
                  </div>
                </div>
                <div className={styles.infoRow}>
                  <span>Purpose</span>
                  <strong>{tx.purpose}</strong>
                </div>
                <div className={styles.infoRow}>
                  <span>Transaction Type</span>
                  <Badge variant="neutral">{tx.transaction_type}</Badge>
                </div>
                <div className={styles.infoRow}>
                  <span>Impact</span>
                  <strong className={tx.direction === 'credit' ? "text-success" : "text-danger"}>
                    {tx.direction.toUpperCase()}
                  </strong>
                </div>
              </div>
            </Card>

            <Card padding="lg" className={styles.infoCard}>
              <h3 className="label-sm mb-6">Source & Origin</h3>
              <div className={styles.infoList}>
                <div className={styles.infoRow}>
                  <span>Source System</span>
                  <strong>{tx.transaction_type}</strong>
                </div>
                <div className={styles.infoRow}>
                  <span>Timestamp</span>
                  <strong>{new Date(tx.created_at).toLocaleString()}</strong>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <Card padding="lg" className={styles.reversalCard}>
            <h3 className="label-sm mb-4">Account Integrity</h3>
            <div className={styles.integrityBox}>
              <ShieldCheck size={18} />
              <p>This transaction is fully recorded in the ledger and verified. Only Owners or Managers can reverse verified transactions.</p>
            </div>
            <Button fullWidth variant="danger" className="mt-6" icon={<RotateCcw size={18} />}>
              Reverse Transaction
            </Button>
          </Card>

          <h3 className="label-sm mt-8 mb-4">Immutable Audit Trail</h3>
          <div className={styles.timeline}>
            {auditTrail.map((item, i) => (
              <div key={item.id} className={styles.tlItem}>
                <div className={clsx(styles.tlIcon, styles[item.color])}>{item.icon}</div>
                <div className={styles.tlContent}>
                  <span className={styles.tlAction}>{item.action}</span>
                  <div className={styles.tlMeta}>
                    <span>{item.user}</span>
                    <div className={styles.tlDot} />
                    <span>{item.time}</span>
                  </div>
                </div>
                {i < auditTrail.length - 1 && <div className={styles.tlLine} />}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </PageContainer>
  );
};
