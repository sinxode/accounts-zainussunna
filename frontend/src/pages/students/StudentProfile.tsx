import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Phone, 
  MessageCircle,
  Printer,
  RotateCcw,
  User,
  AlertTriangle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { TransactionRow } from '../../components/ui/TransactionRow';
import { Drawer } from '../../components/ui/Drawer';
import { useUIStore } from '../../store/useUIStore';
import { studentService, transactionService } from '../../lib/services';
import { useOperationsDrawer } from '../../components/operations/drawers/OperationsDrawerContext';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import styles from './StudentProfile.module.scss';

export const StudentProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const { openDrawer } = useOperationsDrawer();
  const { setActiveModal, setExportData } = useUIStore();

  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [txToReverse, setTxToReverse] = useState<any>(null);
  const [reversalReason, setReversalReason] = useState('');

  const canMutate = role && ['super_admin', 'admin', 'owner', 'manager'].includes(role);

  const { data: student, isLoading: isLoadingStudent } = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentService.getById(id!),
    enabled: !!id
  });

  const { data: transactions = [], isLoading: isLoadingTx } = useQuery({
    queryKey: ['studentTransactions', id],
    queryFn: () => studentService.getTransactionsByStudentId(id!),
    enabled: !!id
  });

  const reverseMutation = useMutation({
    mutationFn: () => transactionService.reverse(txToReverse.id, reversalReason.trim()),
    onSuccess: () => {
      toast.success('Transaction successfully reversed');
      setTxToReverse(null);
      setReversalReason('');
      setSelectedTx(null);
      queryClient.invalidateQueries({ queryKey: ['student', id] });
      queryClient.invalidateQueries({ queryKey: ['studentTransactions', id] });
      queryClient.invalidateQueries({ queryKey: ['studentsSummary'] });
      queryClient.invalidateQueries({ queryKey: ['daily-summary'] });
      queryClient.invalidateQueries({ queryKey: ['transactionsUnified'] });
    },
    onError: (err: any) => {
      toast.error(`Reversal failed: ${err.message}`);
    }
  });

  if (isLoadingStudent || !student) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading student profile...
      </div>
    );
  }

  const currentBalance = Number(student.current_balance || 0);
  const isNegative = currentBalance < 0;

  const totalDeposited = transactions.filter(t => t.direction === 'credit').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalWithdrawn = transactions.filter(t => t.direction === 'debit').reduce((sum, t) => sum + Number(t.amount), 0);

  const handlePrintStatement = () => {
    setExportData({
      title: `Account Statement: ${student.name}`,
      filename: `Statement_${student.enrolment_no}_${new Date().toISOString().split('T')[0]}`,
      type: 'statement',
      columns: ['Date', 'Purpose', 'Type', 'Amount', 'Status'],
      rows: transactions.map(t => [
        new Date(t.created_at || t.transaction_date).toLocaleDateString(),
        t.purpose,
        t.transaction_type,
        `${t.direction === 'credit' ? '+' : '−'}₹${Number(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        t.is_reversed ? 'Reversed' : 'Active'
      ])
    });
    setActiveModal('printExport');
  };

  return (
    <div className={styles.container}>
      {/* Top Breadcrumb / Nav */}
      <div className={styles.topNav}>
        <Link to="/students" className={styles.backLink}>
          <ArrowLeft size={16} />
          <span>Back to Students</span>
        </Link>
        <Button 
          variant="secondary" 
          size="sm" 
          icon={<Printer size={15} />} 
          onClick={handlePrintStatement}
        >
          Print Statement
        </Button>
      </div>

      {/* 2-Column Layout (Spec 4.5: Span 4 Profile | Span 8 Balance + Transactions) */}
      <div className={styles.profileLayout}>
        {/* LEFT COLUMN: Profile Card (Span 4) */}
        <div className={styles.leftCol}>
          <Card padding="lg" className={styles.profileCard}>
            <div className={styles.profileHeader}>
              <Avatar name={student.name} size="xl" className={styles.avatarLarge} />
              <div className={styles.nameBlock}>
                <h2 className={styles.studentName}>{student.name}</h2>
                <span className={styles.enrolmentNo}>{student.enrolment_no}</span>
              </div>
              <div className={styles.badgeRow}>
                <Badge variant={student.status === 'active' ? 'active' : 'neutral'}>
                  {student.status || 'Active'}
                </Badge>
                {student.category && (
                  <Badge variant={student.category === "da'wa" ? 'da_wa' : 'hifz'}>
                    {student.category}
                  </Badge>
                )}
              </div>
            </div>

            {/* Negative balance banner if applicable */}
            {isNegative && (
              <div className={styles.negativeAlert}>
                <AlertTriangle size={18} className="text-danger flex-shrink-0" />
                <span>Overdrawn balance: recovery required</span>
              </div>
            )}

            {/* Contact Details with tap-to-call / WhatsApp */}
            <div className={styles.contactList}>
              {student.phone && (
                <a href={`tel:${student.phone}`} className={styles.contactRow}>
                  <div className={styles.contactIcon}><Phone size={16} /></div>
                  <div className={styles.contactInfo}>
                    <span className={styles.contactLabel}>Phone</span>
                    <span className={styles.contactValue}>{student.phone}</span>
                  </div>
                </a>
              )}

              {student.parent_phone && (
                <a href={`tel:${student.parent_phone}`} className={styles.contactRow}>
                  <div className={styles.contactIcon}><User size={16} /></div>
                  <div className={styles.contactInfo}>
                    <span className={styles.contactLabel}>Parent Phone</span>
                    <span className={styles.contactValue}>{student.parent_phone}</span>
                  </div>
                </a>
              )}

              <a 
                href={`https://wa.me/${(student.phone || student.parent_phone || '').replace(/[^0-9]/g, '')}`} 
                target="_blank" 
                rel="noreferrer"
                className={styles.contactRow}
              >
                <div className={styles.contactIcon}><MessageCircle size={16} /></div>
                <div className={styles.contactInfo}>
                  <span className={styles.contactLabel}>WhatsApp</span>
                  <span className={styles.contactValue}>Open Chat</span>
                </div>
              </a>
            </div>

            {/* Quick Summary Numbers */}
            <div className={styles.profileSummaryStrip}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Deposits</span>
                <span className={clsx(styles.summaryValue, styles.credit)}>
                  +₹{totalDeposited.toLocaleString('en-IN')}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Withdrawals</span>
                <span className={clsx(styles.summaryValue, styles.debit)}>
                  −₹{totalWithdrawn.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Balance Card & Transactions (Span 8) */}
        <div className={styles.rightCol}>
          {/* Balance Hero Card (Spec 4.5) */}
          <div className={styles.balanceHeroCard}>
            <div className={styles.balanceHeroTop}>
              <div>
                <span className={styles.balanceCaption}>Authoritative Student Balance</span>
                <div className={styles.balanceDisplay}>
                  <span className={styles.currencySymbol}>₹</span>
                  <span className={styles.amountWhole}>
                    {Math.abs(currentBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {canMutate && (
                <div className={styles.heroActionBtns}>
                  <Button
                    variant="lime"
                    size="md"
                    icon={<ArrowDownLeft size={16} strokeWidth={2.5} />}
                    onClick={() => openDrawer('deposit', { studentId: id })}
                  >
                    Deposit
                  </Button>
                  <Button
                    variant="hero-outline"
                    size="md"
                    icon={<ArrowUpRight size={16} strokeWidth={2} />}
                    onClick={() => openDrawer('withdrawal', { studentId: id })}
                  >
                    Withdraw
                  </Button>
                </div>
              )}
            </div>

            <div className={styles.balanceStatusRow}>
              <span className={styles.statusIndicator}>
                {isNegative ? '⚠️ Overdrawn Ledger' : '✓ Verified Ledger'}
              </span>
              <span className={styles.entryCount}>
                {transactions.length} total entries
              </span>
            </div>
          </div>

          {/* Student Transactions List (Spec 4.5) */}
          <Card 
            padding="lg" 
            className={styles.txCard}
            title="Ledger History"
            subtitle="Authoritative transaction entries for this student"
          >
            {isLoadingTx ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading ledger entries...
              </div>
            ) : transactions.length === 0 ? (
              <div className={styles.emptyTx}>
                <p>No transactions recorded yet for this student.</p>
                {canMutate && (
                  <Button size="sm" variant="secondary" onClick={() => openDrawer('deposit', { studentId: id })}>
                    Record First Deposit
                  </Button>
                )}
              </div>
            ) : (
              <div className={styles.txList}>
                {transactions.map((tx: any) => (
                  <TransactionRow
                    key={tx.id}
                    id={tx.id}
                    type={tx.transaction_type || 'deposit'}
                    direction={tx.direction}
                    amount={tx.amount}
                    purpose={tx.purpose}
                    accountName={tx.enrolment_no}
                    date={tx.transaction_date || tx.created_at}
                    status={tx.is_reversed ? 'reversed' : 'active'}
                    onClick={() => setSelectedTx(tx)}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Transaction Detail Drawer */}
      {selectedTx && (
        <Drawer
          isOpen={!!selectedTx}
          onClose={() => setSelectedTx(null)}
          title="Transaction Receipt"
          subtitle={`Student: ${student.name}`}
          footer={
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              {canMutate && !selectedTx.is_reversed && (
                <Button
                  variant="danger"
                  fullWidth
                  icon={<RotateCcw size={16} />}
                  onClick={() => {
                    setTxToReverse(selectedTx);
                    setReversalReason('');
                  }}
                >
                  Reverse Transaction
                </Button>
              )}
              <Button variant="secondary" fullWidth onClick={() => setSelectedTx(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ 
              padding: '20px', 
              borderRadius: '14px', 
              background: 'var(--bg-subtle)', 
              textAlign: 'center' 
            }}>
              <span style={{ 
                fontFamily: 'var(--font-display)', 
                fontSize: '28px', 
                fontWeight: 700,
                color: selectedTx.direction === 'credit' ? 'var(--credit)' : 'var(--debit)'
              }}>
                {selectedTx.direction === 'credit' ? '+' : '−'}₹{Number(selectedTx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <div style={{ marginTop: '8px' }}>
                <Badge variant={selectedTx.is_reversed ? 'danger' : 'active'}>
                  {selectedTx.is_reversed ? 'Reversed' : 'Active'}
                </Badge>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Purpose</span>
                <span style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{selectedTx.purpose}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Date</span>
                <span style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{new Date(selectedTx.created_at || selectedTx.transaction_date).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Type</span>
                <span style={{ fontWeight: 600, color: 'var(--text-strong)', textTransform: 'capitalize' }}>{selectedTx.transaction_type}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>System ID</span>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>{selectedTx.id}</span>
              </div>
            </div>

            {txToReverse && txToReverse.id === selectedTx.id && (
              <div style={{ 
                padding: '14px', 
                background: 'var(--debit-bg)', 
                borderRadius: '12px',
                border: '1px solid rgba(217, 72, 59, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--debit)' }}>Mandatory Reversal Reason</span>
                <input
                  type="text"
                  placeholder="Why is this transaction being reversed?"
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  style={{
                    height: '36px',
                    padding: '0 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    fontSize: '13px'
                  }}
                  autoFocus
                />
                <Button
                  variant="danger"
                  size="sm"
                  loading={reverseMutation.isPending}
                  disabled={!reversalReason.trim()}
                  onClick={() => reverseMutation.mutate()}
                >
                  Confirm Reversal
                </Button>
              </div>
            )}
          </div>
        </Drawer>
      )}
    </div>
  );
};
