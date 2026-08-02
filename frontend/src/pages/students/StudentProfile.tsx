import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Receipt, 
  Star, 
  Printer,
  Trash2,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '../../components/ui/PageContainer';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { openDrawer } = useOperationsDrawer();
  const { setActiveModal, setExportData, openConfirmation } = useUIStore();

  const { data: student, isLoading: isLoadingStudent } = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentService.getById(id!),
    enabled: !!id
  });

  const { data: transactions } = useQuery({
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

  const deleteMutation = useMutation({
    mutationFn: (t: any) => {
      if (t.transaction_type === 'adjustment') {
        return transactionService.deleteOperation(t.id);
      } else {
        return transactionService.delete(t.id);
      }
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['studentTransactions', id] });
      await queryClient.refetchQueries({ queryKey: ['student', id] });
      toast.success('Transaction deleted');
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const handleDeleteTransaction = (t: any) => {
    openConfirmation({
      title: 'Delete Transaction?',
      message: 'Are you sure you want to delete this transaction? This will permanently delete the entry from the student\'s ledger statement.',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: () => deleteMutation.mutate(t)
    });
  };

  if (isLoadingStudent || !student) return <PageContainer>Loading...</PageContainer>;

  const totalDeposited = transactions?.filter(t => t.direction === 'credit').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const totalWithdrawn = transactions?.filter(t => t.direction === 'debit').reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  const triggerExport = (_type: 'pdf' | 'excel') => {
    if (!student || !transactions) return;
    
    setExportData({
      title: `Account Statement: ${student.name}`,
      filename: `Statement_${student.enrolment_no}_${new Date().toISOString().split('T')[0]}`,
      type: 'statement',
      columns: ['Date', 'Purpose', 'Type', 'Amount'],
      rows: transactions.map(t => [
        new Date(t.created_at).toLocaleDateString(),
        t.purpose,
        t.transaction_type,
        `${t.direction === 'credit' ? '+' : '-'}₹${Number(t.amount).toLocaleString()}`
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
                </div>
              </div>
            </div>
            <div className={styles.heroBalance}>
              <span className={styles.balanceLabel}>Current Balance</span>
              <div className={styles.balanceValue}>₹ {Number(student.current_balance).toLocaleString()}</div>
            </div>
          </section>

          {/* Section 2: Financial Overview */}
          <div className={clsx(styles.overviewGrid, styles.orderBalance)}>
            <div className={styles.mobileOnlyCard}>
              <StatCard label="Current Balance" value={`₹${Number(student.current_balance).toLocaleString()}`} icon={<Wallet />} variant="primary" />
            </div>
            <StatCard label="Total Deposited" value={`₹${totalDeposited.toLocaleString()}`} icon={<ArrowDownCircle />} variant="success" />
            <StatCard label="Total Withdrawn" value={`₹${totalWithdrawn.toLocaleString()}`} icon={<ArrowUpCircle />} variant="error" />
            <StatCard label="Total Transactions" value={transactions?.length || 0} icon={<Receipt />} variant="neutral" />
          </div>

          {/* Section 3: Quick Actions */}
          <section className={clsx(styles.section, styles.orderActions)}>
            <h3 className="label-sm mb-4">Quick Actions</h3>
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

          {/* Section 6: Transaction Ledger */}
          <section className={clsx(styles.section, styles.orderLedger)}>
            <div className="flex-between mb-4">
              <h3 className="label-sm">Transaction Ledger</h3>
            </div>
            <DataTable 
              key={transactions?.length}
              columns={[
                { 
                  header: 'Date', 
                  width: '100px',
                  accessor: (t: any) => (
                    <div className="flex flex-col">
                      <span>{new Date(t.created_at).toLocaleDateString()}</span>
                      <div className="mobile-only-flex items-center gap-1 mt-1 text-muted text-xs">
                        {t.transaction_type === 'deposit' ? (
                          <ArrowDownLeft size={12} className="text-success" />
                        ) : (
                          <ArrowUpRight size={12} className="text-danger" />
                        )}
                        <span className="capitalize">{t.transaction_type}</span>
                      </div>
                    </div>
                  )
                },
                { 
                  header: 'Purpose', 
                  responsiveHidden: 'mobile',
                  accessor: 'purpose' 
                },
                { 
                  header: 'Type', 
                  responsiveHidden: 'mobile',
                  accessor: (t: any) => {
                    const isDeposit = t.transaction_type === 'deposit';
                    return (
                      <div className="flex items-center gap-1.5 justify-center" title={t.transaction_type}>
                        {isDeposit ? (
                          <ArrowDownLeft size={16} className="text-success" />
                        ) : (
                          <ArrowUpRight size={16} className="text-danger" />
                        )}
                        <span className={clsx(
                          "desktop-only-inline text-xs font-semibold capitalize",
                          isDeposit ? "text-success" : "text-danger"
                        )}>
                          {t.transaction_type}
                        </span>
                      </div>
                    );
                  },
                  align: 'center' 
                },
                { 
                  header: 'Amount', 
                  accessor: (t: any) => (
                    <div className="flex flex-col items-end">
                      <span className={`${t.direction === 'credit' ? "text-success" : "text-danger"} ${styles.amountVal}`}>
                        {t.direction === 'credit' ? '+' : '-'}₹{Math.abs(Number(t.amount)).toLocaleString()}
                      </span>
                      <span className="mobile-only-inline text-muted text-xs mt-1 text-right">
                        {t.purpose}
                      </span>
                    </div>
                  ),
                  align: 'right'
                },
                { 
                  header: '', 
                  width: '60px',
                  accessor: (t: any) => (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteTransaction(t)}
                      className="text-danger hover:bg-danger/10"
                    >
                      <Trash2 size={16} />
                    </Button>
                  ),
                  align: 'right'
                },
              ]}
              data={transactions || []}
            />
          </section>
        </div>
        {/* Sidebar / Snapshot area */}
        <aside className={styles.sidebar}>
          {/* Section 4: Financial Health */}
          <section className={styles.stickySection}>
            <div className={styles.orderHealth}>
              <Card padding="lg" className={styles.snapshotCard}>
                <div className="flex-between mb-6">
                  <h3 className="label-sm">Financial Health</h3>
                  <Badge variant={student.health_status === 'healthy' ? 'success' : 'warning'} pill>{student.health_status}</Badge>
                </div>
                <div className={styles.healthInfo}>
                  <p className={styles.healthDesc}>
                    Account status is currently {student.health_status}.
                  </p>
                </div>
                
                <div className={styles.divider} />
                
                <div className={styles.snapMeta}>
                  <div className={styles.mRow}>
                    <span>Last Transaction</span>
                    <strong>{student.last_transaction_date ? new Date(student.last_transaction_date).toLocaleDateString() : 'N/A'}</strong>
                  </div>
                </div>

                <div className={styles.snapActions}>
                  <Button fullWidth onClick={() => openDrawer('deposit')}>Quick Deposit</Button>
                  <Button fullWidth variant="soft" onClick={() => openDrawer('withdrawal')}>Quick Withdraw</Button>
                </div>
              </Card>
            </div>

            {/* Section 5: Activity Timeline (Restored) */}
            <div className={styles.orderHistory}>
              <h3 className="label-sm mt-8 mb-4">Activity Timeline</h3>
              <div className={styles.timeline}>
                {/* Simplified version for now */}
                {transactions?.slice(0, 5).map((t: any) => (
                  <div key={t.id} className={styles.tlItem}>
                    <div className={styles.tlContent}>
                      <div className={styles.tlHeader}>
                        <span className={styles.tlTitle}>{t.purpose}</span>
                      </div>
                      <span className={clsx(styles.tlAmount, t.direction === 'credit' ? "text-success" : "text-danger")}>
                        {t.direction === 'credit' ? '+' : '-'}₹{Math.abs(Number(t.amount)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 9: Smart Insights (Restored Placeholder) */}
            <div className={styles.orderInsights}>
              <h3 className="label-sm mt-8 mb-4">Smart Insights</h3>
              <div className={styles.insights}>
                <Card padding="md" className={styles.insightItem}>
                  <div className={styles.iContent}>
                    <span className={styles.iLabel}>Status</span>
                    <strong>{student.health_status}</strong>
                  </div>
                </Card>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </PageContainer>
  );
};
