import React, { useState } from 'react';
import { 
  ArrowLeft, 
  RotateCcw, 
  User, 
  Receipt, 
  ShieldCheck, 
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Info
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '../../lib/services';
import { PageContainer } from '../../components/ui/PageContainer';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import styles from './TransactionDetails.module.scss';
import { clsx } from 'clsx';

export const TransactionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [isReversalModalOpen, setIsReversalModalOpen] = useState(false);
  const [reversalReason, setReversalReason] = useState('');

  const canReverse = role && ['super_admin', 'admin', 'owner', 'manager'].includes(role);

  const { data: tx, isLoading } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => transactionService.getById(id!),
    enabled: !!id
  });

  const reverseMutation = useMutation({
    mutationFn: () => transactionService.reverse(tx.id, reversalReason.trim()),
    onSuccess: () => {
      toast.success('Transaction successfully reversed');
      setIsReversalModalOpen(false);
      setReversalReason('');
      queryClient.invalidateQueries({ queryKey: ['transaction', id] });
      queryClient.invalidateQueries({ queryKey: ['transactionsUnified'] });
      queryClient.invalidateQueries({ queryKey: ['daily-summary'] });
      queryClient.invalidateQueries({ queryKey: ['studentsSummary'] });
      if (tx?.student_id) {
        queryClient.invalidateQueries({ queryKey: ['student', tx.student_id] });
        queryClient.invalidateQueries({ queryKey: ['studentTransactions', tx.student_id] });
      }
    },
    onError: (err: any) => {
      toast.error(`Reversal failed: ${err.message}`);
    }
  });

  const handleCopyId = () => {
    if (!tx?.id) return;
    navigator.clipboard.writeText(tx.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="p-8 text-center text-muted">Loading transaction records...</div>
      </PageContainer>
    );
  }

  if (!tx) {
    return (
      <PageContainer>
        <div className="p-8 text-center">
          <AlertCircle size={48} className="text-danger mx-auto mb-4" />
          <h2 className="text-lg font-bold mb-2">Transaction Not Found</h2>
          <p className="text-muted mb-4">The transaction record you requested does not exist or has been restricted.</p>
          <Link to="/transactions">
            <Button variant="secondary" icon={<ArrowLeft size={16} />}>Back to Transactions</Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const isReversible = canReverse && !tx.is_reversed && !tx.reversal_of_id;

  return (
    <PageContainer>
      <div className={styles.navBar}>
        <Link to="/transactions" className={styles.backLink}>
          <ArrowLeft size={18} />
          <span>Back to Transactions</span>
        </Link>
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
                <h1 className={styles.title}>Transaction Ledger Record</h1>
                <div className={styles.meta}>
                  <button 
                    onClick={handleCopyId}
                    className="flex items-center gap-1 font-mono text-xs text-muted hover:text-primary transition-colors"
                    title="Click to copy full UUID"
                  >
                    <span>{tx.id.slice(0, 8)}...{tx.id.slice(-4)}</span>
                    {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                  </button>
                  <div className={styles.dot} />
                  <Badge variant={tx.is_reversed ? 'danger' : 'success'} size="sm" pill>
                    {tx.is_reversed ? 'Reversed' : 'Active'}
                  </Badge>
                  {tx.reversal_of_id && (
                    <Badge variant="warning" size="sm" pill>
                      Compensating Entry
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className={styles.amountDisplay}>
              <span className={styles.label}>Authoritative Amount</span>
              <div className={clsx(styles.value, tx.direction === 'credit' ? "text-success" : "text-danger")}>
                {tx.direction === 'credit' ? '+' : '-'}₹{Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </section>

          {/* Reversal Banner if reversed */}
          {tx.is_reversed && (
            <Card padding="md" className="border-danger/30 bg-danger/5 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-danger flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-danger text-sm">This transaction has been reversed</h4>
                  <p className="text-xs text-muted mt-1">
                    <strong>Reason:</strong> {tx.reversal_reason || 'Administrative reversal'}
                  </p>
                  {tx.reversed_at && (
                    <p className="text-xs text-muted mt-0.5">
                      <strong>Reversed At:</strong> {new Date(tx.reversed_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Compensating Notice if reversal_of_id exists */}
          {tx.reversal_of_id && (
            <Card padding="md" className="border-warning/30 bg-warning/5 mb-4">
              <div className="flex items-start gap-3">
                <Info size={20} className="text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-warning text-sm">Compensating Reversal Transaction</h4>
                  <p className="text-xs text-muted mt-1">
                    This journal row was automatically generated to offset transaction{' '}
                    <Link to={`/transactions/${tx.reversal_of_id}`} className="text-primary font-mono underline">
                      {tx.reversal_of_id.slice(0, 8)}...
                    </Link>
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Primary Info */}
          <div className={styles.grid}>
            <Card padding="lg" className={styles.infoCard}>
              <h3 className="label-sm mb-4 font-semibold text-xs tracking-wider uppercase text-muted">Account & Purpose</h3>
              <div className={styles.infoList}>
                <div className={styles.infoRow}>
                  <span>Student Account</span>
                  {tx.students ? (
                    <Link to={`/students/${tx.student_id}`} className="flex items-center gap-1.5 font-semibold text-primary hover:underline">
                      <User size={15} />
                      <span>{tx.students.name}</span>
                      <span className="text-xs text-muted">({tx.students.enrolment_no})</span>
                      <ExternalLink size={12} />
                    </Link>
                  ) : (
                    <span>Direct Account</span>
                  )}
                </div>
                <div className={styles.infoRow}>
                  <span>Purpose / Description</span>
                  <strong className="text-right">{tx.purpose}</strong>
                </div>
                <div className={styles.infoRow}>
                  <span>Transaction Type</span>
                  <Badge variant="neutral">{tx.transaction_type}</Badge>
                </div>
                <div className={styles.infoRow}>
                  <span>Ledger Direction</span>
                  <strong className={tx.direction === 'credit' ? "text-success" : "text-danger"}>
                    {tx.direction.toUpperCase()} ({tx.direction === 'credit' ? 'Inflow' : 'Outflow'})
                  </strong>
                </div>
              </div>
            </Card>

            <Card padding="lg" className={styles.infoCard}>
              <h3 className="label-sm mb-4 font-semibold text-xs tracking-wider uppercase text-muted">Audit & Identification</h3>
              <div className={styles.infoList}>
                <div className={styles.infoRow}>
                  <span>Transaction Date</span>
                  <strong>{new Date(tx.transaction_date || tx.created_at).toLocaleString()}</strong>
                </div>
                <div className={styles.infoRow}>
                  <span>Operation Reference</span>
                  <span className="font-mono text-xs">{tx.operation_id ? `${tx.operation_id.slice(0, 8)}...` : 'Standalone'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span>Idempotency Key</span>
                  <span className="font-mono text-xs">{tx.idempotency_key ? `${tx.idempotency_key.slice(0, 8)}...` : 'Standard'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span>Ledger Status</span>
                  <Badge variant={tx.is_reversed ? 'danger' : 'success'}>
                    {tx.is_reversed ? 'Canceled / Reversed' : 'Active Journal Line'}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <Card padding="lg" className={styles.reversalCard}>
            <h3 className="label-sm mb-3 font-semibold text-xs tracking-wider uppercase text-muted">Financial Invariant Controls</h3>
            <div className={styles.integrityBox}>
              <ShieldCheck size={18} className="text-success flex-shrink-0" />
              <p className="text-xs text-muted">
                Posted journal rows are permanent and append-only. Corrections require a linked compensating reversal.
              </p>
            </div>

            {canReverse && (
              <div className="mt-4">
                <Button 
                  fullWidth 
                  variant="danger" 
                  icon={<RotateCcw size={16} />}
                  disabled={!isReversible}
                  onClick={() => setIsReversalModalOpen(true)}
                >
                  {tx.is_reversed ? 'Already Reversed' : tx.reversal_of_id ? 'Cannot Reverse Reversal' : 'Reverse Transaction'}
                </Button>
                {!isReversible && (
                  <p className="text-[11px] text-muted text-center mt-2">
                    {tx.is_reversed 
                      ? 'This transaction is already reversed and cannot be reversed again.'
                      : tx.reversal_of_id 
                        ? 'Compensating reversal records cannot themselves be reversed.'
                        : 'You do not have reversal permissions.'}
                  </p>
                )}
              </div>
            )}
          </Card>
        </aside>
      </div>

      {/* Reversal Confirmation Modal */}
      <Modal 
        isOpen={isReversalModalOpen}
        onClose={() => {
          if (!reverseMutation.isPending) {
            setIsReversalModalOpen(false);
            setReversalReason('');
          }
        }}
        title="Documented Transaction Reversal"
      >
        <div className="p-4 space-y-4">
          <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg text-xs text-warning space-y-1">
            <p className="font-semibold">Authoritative Ledger Correction</p>
            <p>
              Reversing this entry will post an offsetting <strong>{tx.direction === 'credit' ? 'DEBIT' : 'CREDIT'}</strong> of{' '}
              <strong>₹{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> to the student's ledger.
              The original record remains in history for audit compliance.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondary mb-1">
              Documented Reversal Reason (Minimum 10 characters) <span className="text-danger">*</span>
            </label>
            <textarea
              className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              rows={3}
              placeholder="e.g. Accidental duplicate fee receipt reversal during manual check..."
              value={reversalReason}
              onChange={(e) => setReversalReason(e.target.value)}
              disabled={reverseMutation.isPending}
            />
            <div className="flex justify-between text-[11px] text-muted mt-1">
              <span>Must provide an audit explanation.</span>
              <span className={reversalReason.trim().length >= 10 ? "text-success" : "text-danger"}>
                {reversalReason.trim().length}/10 chars
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button 
              variant="ghost" 
              onClick={() => setIsReversalModalOpen(false)}
              disabled={reverseMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              icon={<RotateCcw size={16} />}
              loading={reverseMutation.isPending}
              disabled={reversalReason.trim().length < 10}
              onClick={() => reverseMutation.mutate()}
            >
              Confirm Reversal
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
};
