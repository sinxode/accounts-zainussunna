import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Receipt, 
  Star, 
  Printer,
  RotateCcw,
  Eye,
  Wallet,
  AlertTriangle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '../../components/ui/PageContainer';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { DataTable } from '../../components/ui/DataTable';
import { useUIStore } from '../../store/useUIStore';
import { studentService, transactionService } from '../../lib/services';
import { useOperationsDrawer } from '../../components/operations/drawers/OperationsDrawerContext';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import styles from './StudentProfile.module.scss';

export const StudentProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const { openDrawer } = useOperationsDrawer();
  const { setActiveModal, setExportData } = useUIStore();

  const [txToReverse, setTxToReverse] = useState<any>(null);
  const [reversalReason, setReversalReason] = useState('');

  const canMutate = role && ['super_admin', 'admin', 'owner', 'manager'].includes(role);
  const canReverse = canMutate;

  const { data: student, isLoading: isLoadingStudent } = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentService.getById(id!),
    enabled: !!id
  });

  const { data: transactions, isLoading: isLoadingTx } = useQuery({
    queryKey: ['studentTransactions', id],
    queryFn: () => studentService.getTransactionsByStudentId(id!),
    enabled: !!id
  });

  const { data: isFavorite, isLoading: isLoadingFav } = useQuery({
    queryKey: ['studentFavorite', user?.id, id],
    queryFn: () => studentService.isFavorite(user!.id, id!),
    enabled: !!user?.id && !!id
  });

  const toggleFavMutation = useMutation({
    mutationFn: () => studentService.toggleFavorite(user!.id, id!, !!isFavorite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentFavorite', user?.id, id] });
      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
    },
    onError: (err: any) => {
      toast.error(err.message);
    }
  });

  const reverseMutation = useMutation({
    mutationFn: () => transactionService.reverse(txToReverse.id, reversalReason.trim()),
    onSuccess: () => {
      toast.success('Transaction successfully reversed');
      setTxToReverse(null);
      setReversalReason('');
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
      <PageContainer>
        <div className="p-8 text-center text-muted">Loading student profile...</div>
      </PageContainer>
    );
  }

  const currentBalance = Number(student.current_balance || 0);
  const isNegative = currentBalance < 0;

  const totalDeposited = transactions?.filter(t => t.direction === 'credit').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const totalWithdrawn = transactions?.filter(t => t.direction === 'debit').reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  const triggerExport = (_type: 'pdf' | 'excel') => {
    if (!student || !transactions) return;
    
    setExportData({
      title: `Account Statement: ${student.name}`,
      filename: `Statement_${student.enrolment_no}_${new Date().toISOString().split('T')[0]}`,
      type: 'statement',
      columns: ['Date', 'Purpose', 'Type', 'Amount', 'Status'],
      rows: transactions.map(t => [
        new Date(t.created_at || t.transaction_date).toLocaleDateString(),
        t.purpose,
        t.transaction_type,
        `${t.direction === 'credit' ? '+' : '-'}₹${Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        t.is_reversed ? 'Reversed' : 'Active'
      ])
    });
    setActiveModal('printExport');
  };

  return (
    <PageContainer>
      {/* Page Navigation */}
      <div className={styles.navBar}>
        <Link to="/students" className={styles.backLink}>
          <ArrowLeft size={18} />
          <span>Back to Students</span>
        </Link>
        <div className={styles.navActions}>
          <Button variant="ghost" size="sm" icon={<Printer size={16} />} onClick={() => triggerExport('pdf')}>Print Statement</Button>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Main Profile Area */}
        <div className={styles.main}>
          {/* Section 1: Student Header */}
          <section className={clsx(styles.headerSection, styles.orderHero)}>
            <div className={styles.profileInfo}>
              <div className={styles.avatar}>{student.name.charAt(0)}</div>
              <div className={styles.details}>
                <h1 className={styles.name}>{student.name}</h1>
                <div className={styles.meta}>
                  <span className={styles.enr}>{student.enrolment_no}</span>
                  <div className={styles.dot} />
                  <Badge variant={student.status === 'active' ? 'success' : 'neutral'} size="sm">{student.status}</Badge>
                  {isNegative && (
                    <Badge variant="danger" size="sm" pill>
                      <AlertTriangle size={12} className="mr-1 inline" /> Negative Balance
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className={styles.heroBalance}>
              <span className={styles.balanceLabel}>Authoritative Ledger Balance</span>
              <div className={clsx(styles.balanceValue, isNegative && "text-danger")}>
                ₹ {currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </section>

          {/* Negative Balance Alert */}
          {isNegative && (
            <Card padding="md" className="border-danger/30 bg-danger/5 mb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle size={20} className="text-danger flex-shrink-0" />
                <p className="text-xs text-danger font-medium">
                  This student account currently has a negative balance of ₹{Math.abs(currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}. 
                  Negative balances are tolerated to prevent disruption of academic services, but prompt recovery is required.
                </p>
              </div>
            </Card>
          )}

          {/* Section 2: Financial Overview */}
          <div className={clsx(styles.overviewGrid, styles.orderBalance)}>
            <div className={styles.mobileOnlyCard}>
              <StatCard 
                label="Authoritative Balance" 
                value={`₹${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
                icon={<Wallet />} 
                variant={isNegative ? "error" : "primary"} 
              />
            </div>
            <StatCard label="Total Inflows (Credits)" value={`₹${totalDeposited.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={<ArrowDownCircle />} variant="success" />
            <StatCard label="Total Outflows (Debits)" value={`₹${totalWithdrawn.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={<ArrowUpCircle />} variant="error" />
            <StatCard label="Total Ledger Entries" value={transactions?.length || 0} icon={<Receipt />} variant="neutral" />
          </div>

          {/* Section 3: Quick Actions (Only for permitted roles) */}
          {canMutate && (
            <section className={clsx(styles.section, styles.orderActions)}>
              <h3 className="label-sm mb-4 font-semibold text-xs tracking-wider uppercase text-muted">Financial Operations</h3>
              <div className={styles.actionsGrid}>
                <Button size="lg" icon={<ArrowDownCircle size={20} />} className={styles.actionBtn} onClick={() => openDrawer('deposit', { studentId: id })}>Deposit</Button>
                <Button size="lg" icon={<ArrowUpCircle size={20} />} variant="soft" className={styles.actionBtn} onClick={() => openDrawer('withdrawal', { studentId: id })}>Withdraw</Button>
                <Button 
                  size="lg" 
                  icon={<Star size={20} className={isFavorite ? "text-warning" : ""} fill={isFavorite ? "currentColor" : "none"} />} 
                  variant="ghost" 
                  className={styles.actionBtn}
                  onClick={() => toggleFavMutation.mutate()}
                  loading={isLoadingFav || toggleFavMutation.isPending}
                >
                  {isFavorite ? 'Favorited' : 'Favorite'}
                </Button>
              </div>
            </section>
          )}

          {/* Section 4: Authoritative Transaction Ledger */}
          <section className={clsx(styles.section, styles.orderLedger)}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="label-sm font-semibold text-xs tracking-wider uppercase text-muted">Authoritative Journal Entries</h3>
              <span className="text-xs text-muted">Chronological order with running balance</span>
            </div>

            {isLoadingTx ? (
              <div className="p-8 text-center text-muted">Loading journal entries...</div>
            ) : (
              <DataTable 
                key={transactions?.length}
                onRowClick={(t: any) => navigate(`/transactions/${t.id}`)}
                columns={[
                  { 
                    header: 'Date', 
                    width: '110px',
                    accessor: (t: any) => (
                      <div className="flex flex-col">
                        <span>{new Date(t.transaction_date || t.created_at).toLocaleDateString()}</span>
                        <span className="text-[11px] text-muted">
                          {new Date(t.transaction_date || t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )
                  },
                  { 
                    header: 'Purpose / Reason', 
                    accessor: (t: any) => (
                      <div className="flex flex-col">
                        <span className={clsx("font-medium", t.is_reversed && "line-through text-muted")}>
                          {t.purpose}
                        </span>
                        {t.is_reversed && (
                          <span className="text-[11px] text-danger">
                            Reversed: {t.reversal_reason || 'Administrative correction'}
                          </span>
                        )}
                        {t.reversal_of_id && (
                          <span className="text-[11px] text-warning">
                            Offsetting compensating entry
                          </span>
                        )}
                      </div>
                    )
                  },
                  { 
                    header: 'Type', 
                    responsiveHidden: 'mobile',
                    align: 'center',
                    accessor: (t: any) => (
                      <Badge variant="neutral" size="sm">
                        {t.transaction_type}
                      </Badge>
                    )
                  },
                  { 
                    header: 'Amount', 
                    align: 'right',
                    accessor: (t: any) => (
                      <div className="flex flex-col items-end">
                        <span className={clsx("font-semibold", t.direction === 'credit' ? "text-success" : "text-danger", t.is_reversed && "line-through opacity-70")}>
                          {t.direction === 'credit' ? '+' : '-'}₹{Math.abs(Number(t.amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-muted uppercase tracking-wider">
                          {t.direction}
                        </span>
                      </div>
                    )
                  },
                  { 
                    header: 'Running Balance', 
                    responsiveHidden: 'mobile',
                    align: 'right',
                    accessor: (t: any) => {
                      const rb = Number(t.running_balance ?? 0);
                      return (
                        <span className={clsx("font-mono font-medium text-xs", rb < 0 ? "text-danger" : "text-primary")}>
                          ₹{rb.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      );
                    }
                  },
                  { 
                    header: 'Status', 
                    align: 'center',
                    accessor: (t: any) => (
                      <Badge variant={t.is_reversed ? 'danger' : 'success'} size="sm" pill>
                        {t.is_reversed ? 'Reversed' : 'Active'}
                      </Badge>
                    )
                  },
                  { 
                    header: '', 
                    width: '80px',
                    align: 'right',
                    accessor: (t: any) => {
                      const isReversible = canReverse && !t.is_reversed && !t.reversal_of_id;
                      return (
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            title="View Transaction Record"
                            onClick={() => navigate(`/transactions/${t.id}`)}
                          >
                            <Eye size={16} />
                          </Button>
                          {canReverse && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              disabled={!isReversible}
                              title={isReversible ? "Reverse Transaction" : "Cannot be reversed"}
                              onClick={() => {
                                setTxToReverse(t);
                                setReversalReason('');
                              }}
                              className="text-danger hover:bg-danger/10 disabled:opacity-30"
                            >
                              <RotateCcw size={16} />
                            </Button>
                          )}
                        </div>
                      );
                    }
                  },
                ]}
                data={transactions || []}
              />
            )}
          </section>
        </div>

        {/* Sidebar / Snapshot area */}
        <aside className={styles.sidebar}>
          <section className={styles.stickySection}>
            <div className={styles.orderHealth}>
              <Card padding="lg" className={styles.snapshotCard}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="label-sm font-semibold text-xs tracking-wider uppercase text-muted">Financial Health</h3>
                  <Badge variant={student.health_status === 'healthy' ? 'success' : isNegative ? 'danger' : 'warning'} pill>
                    {student.health_status}
                  </Badge>
                </div>
                <div className={styles.healthInfo}>
                  <p className={styles.healthDesc}>
                    Account status is classified as <strong>{student.health_status}</strong> based on authoritative balances.
                  </p>
                </div>
                
                <div className={styles.divider} />
                
                <div className={styles.snapMeta}>
                  <div className={styles.mRow}>
                    <span>Last Transaction</span>
                    <strong>{student.last_transaction_date ? new Date(student.last_transaction_date).toLocaleDateString() : 'No activity'}</strong>
                  </div>
                </div>

                {canMutate && (
                  <div className={styles.snapActions}>
                    <Button fullWidth onClick={() => openDrawer('deposit', { studentId: id })}>Quick Deposit</Button>
                    <Button fullWidth variant="soft" onClick={() => openDrawer('withdrawal', { studentId: id })}>Quick Withdraw</Button>
                  </div>
                )}
              </Card>
            </div>
          </section>
        </aside>
      </div>

      {/* Documented Reversal Modal */}
      <Modal 
        isOpen={!!txToReverse}
        onClose={() => {
          if (!reverseMutation.isPending) {
            setTxToReverse(null);
            setReversalReason('');
          }
        }}
        title="Documented Transaction Reversal"
      >
        {txToReverse && (
          <div className="p-4 space-y-4">
            <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg text-xs text-warning space-y-1">
              <p className="font-semibold">Authoritative Ledger Correction</p>
              <p>
                Reversing transaction <code>{txToReverse.id.slice(0, 8)}...</code> ({txToReverse.direction === 'credit' ? 'Inflow' : 'Outflow'} of ₹{Number(txToReverse.amount).toLocaleString()}) 
                will post an offsetting <strong>{txToReverse.direction === 'credit' ? 'DEBIT' : 'CREDIT'}</strong> of{' '}
                <strong>₹{Number(txToReverse.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">
                Documented Reversal Reason (Minimum 10 characters) <span className="text-danger">*</span>
              </label>
              <textarea
                className="w-full p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                rows={3}
                placeholder="e.g. Accidental double entry detected during statement reconciliation..."
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                disabled={reverseMutation.isPending}
              />
              <div className="flex justify-between text-[11px] text-muted mt-1">
                <span>Must document an audit justification.</span>
                <span className={reversalReason.trim().length >= 10 ? "text-success" : "text-danger"}>
                  {reversalReason.trim().length}/10 chars
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button 
                variant="ghost" 
                onClick={() => setTxToReverse(null)}
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
        )}
      </Modal>
    </PageContainer>
  );
};
