import React from 'react';
import { Card } from '../ui/Card';
import { Link2, ArrowRight } from 'lucide-react';
import styles from '../../pages/transfers/InternalTransfers.module.scss';
import { Badge } from '../ui/Badge';
import { Link } from 'react-router-dom';

export const LinkedTransactions: React.FC = () => {
  const transactions = [
    { id: 'TXN-9021', type: 'Debit', desc: 'Transfer Outflow (System Fund)', amount: '₹5,000', status: 'completed' },
    { id: 'TXN-9022', type: 'Credit', desc: 'Transfer Inflow (Imran Khan)', amount: '₹5,000', status: 'completed' },
    { id: 'TXN-9055', type: 'Repayment', desc: 'Repayment Processing', amount: '₹500', status: 'completed' },
  ];

  return (
    <Card padding="lg" className={styles.sectionCard}>
      <h3 className={styles.sectionTitle}><Link2 size={16} className="text-muted inline mr-2" /> Linked Transactions</h3>
      
      <div className={styles.linkedTxList}>
        {transactions.map(txn => (
          <Link key={txn.id} to={`/transactions/${txn.id}`} className={styles.linkedTxItem}>
            <div className="flex-1">
              <div className="font-bold text-sm text-primary">{txn.id}</div>
              <div className="text-xs text-muted mt-1">{txn.desc}</div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={txn.type === 'Debit' ? 'danger' : txn.type === 'Credit' ? 'success' : 'primary'} size="sm">
                {txn.type}
              </Badge>
              <div className="font-bold text-sm">{txn.amount}</div>
              <ArrowRight size={14} className="text-muted" />
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
};
