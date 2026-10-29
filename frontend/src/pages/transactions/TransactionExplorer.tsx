import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Download,
  Eye,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  FilterX
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/ui/PageContainer';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import styles from './TransactionExplorer.module.scss';
import { clsx } from 'clsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '../../lib/services';
import { useUIStore } from '../../store/useUIStore';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 25;

export const TransactionExplorer: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { setActiveModal, setExportData } = useUIStore();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [txToReverse, setTxToReverse] = useState<any>(null);
  const [reversalReason, setReversalReason] = useState('');

  const canReverse = role && ['super_admin', 'admin', 'owner', 'manager'].includes(role);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactionsUnified'],
    queryFn: () => transactionService.listAllUnified(300)
  });

  const reverseMutation = useMutation({
    mutationFn: () => transactionService.reverse(txToReverse.id, reversalReason.trim()),
    onSuccess: () => {
      toast.success('Transaction successfully reversed');
      setTxToReverse(null);
      setReversalReason('');
      queryClient.invalidateQueries({ queryKey: ['transactionsUnified'] });
      queryClient.invalidateQueries({ queryKey: ['daily-summary'] });
      queryClient.invalidateQueries({ queryKey: ['studentsSummary'] });
      if (txToReverse?.student_id) {
        queryClient.invalidateQueries({ queryKey: ['student', txToReverse.student_id] });
        queryClient.invalidateQueries({ queryKey: ['studentTransactions', txToReverse.student_id] });
      }
    },
    onError: (error: any) => {
      toast.error(`Reversal failed: ${error.message}`);
    }
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t: any) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term || 
        t.entity_name?.toLowerCase().includes(term) ||
        t.purpose?.toLowerCase().includes(term) ||
        t.id?.toLowerCase().includes(term);

      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      const matchesDirection = directionFilter === 'all' || t.direction === directionFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'reversed' && t.is_reversed) || 
        (statusFilter === 'active' && !t.is_reversed);

      return matchesSearch && matchesType && matchesDirection && matchesStatus;
    });
  }, [transactions, searchTerm, typeFilter, directionFilter, statusFilter]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setDirectionFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const handleExport = () => {
    setExportData({
      title: 'Global Transaction Ledger',
      filename: `Transactions_Export_${new Date().toISOString().split('T')[0]}`,
      type: 'report',
      columns: ['ID', 'Date', 'Entity', 'Type', 'Direction', 'Amount', 'Status'],
      rows: filteredTransactions.map((t: any) => [
        t.id.slice(0, 8),
        new Date(t.date).toLocaleDateString(),
        t.entity_name,
        t.type,
        t.direction,
        `${t.direction === 'credit' ? '+' : '-'}₹${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        t.is_reversed ? 'Reversed' : 'Active'
      ])
    });
    setActiveModal('printExport');
  };

  return (
    <PageContainer>
      <PageHeader 
        title="Transaction Explorer" 
        subtitle="Authoritative financial ledger explorer and audit verification center."
        actions={
          <div className="flex gap-2">
            <Button variant="soft" icon={<Download size={18} />} onClick={handleExport}>Export Ledger</Button>
          </div>
        }
      />

      <div className={styles.container}>
        <Card padding="sm" className={styles.filterCard}>
          <div className={styles.filters}>
            <div className={styles.searchBox}>
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search by student, ID, purpose, or amount..." 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <select 
                value={typeFilter} 
                onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                className="p-2 border rounded-lg text-xs bg-white"
              >
                <option value="all">All Types</option>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="adjustment">Adjustment / Transfer</option>
                <option value="loan">External Loan</option>
                <option value="recovery">Recovery</option>
              </select>

              <select 
                value={directionFilter} 
                onChange={(e) => { setDirectionFilter(e.target.value); setCurrentPage(1); }}
                className="p-2 border rounded-lg text-xs bg-white"
              >
                <option value="all">All Directions</option>
                <option value="credit">Credit (+ Inflow)</option>
                <option value="debit">Debit (- Outflow)</option>
              </select>

              <select 
                value={statusFilter} 
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="p-2 border rounded-lg text-xs bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="reversed">Reversed Only</option>
              </select>

              {(searchTerm || typeFilter !== 'all' || directionFilter !== 'all' || statusFilter !== 'all') && (
                <Button variant="ghost" size="sm" icon={<FilterX size={14} />} onClick={handleResetFilters}>
                  Reset
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card padding="none" className={styles.tableCard}>
          {isLoading ? (
            <div className="p-8 text-center text-muted">Loading transactions...</div>
          ) : (
            <>
              <DataTable 
                key={paginatedTransactions.length}
                onRowClick={(t: any) => navigate(`/transactions/${t.id}`)}
                columns={[
                  { 
                    header: 'ID', 
                    accessor: (t: any) => (
                      <div className="flex flex-col">
                        <span className={clsx(styles.txId, "font-mono font-medium")}>{t.id.slice(0, 8)}...</span>
                        <span className="mobile-only-inline text-muted text-xs mt-1">
                          {new Date(t.date).toLocaleDateString()}
                        </span>
                      </div>
                    ),
                    width: '90px'
                  },
                  { 
                    header: 'Date', 
                    responsiveHidden: 'mobile',
                    align: 'center',
                    accessor: (t: any) => new Date(t.date).toLocaleDateString() 
                  },
                  { 
                    header: 'Account / Entity', 
                    accessor: (t: any) => (
                      <div className={styles.studentCell}>
                        <span className={styles.sName}>{t.entity_name}</span>
                        <span className={styles.sEnr}>{t.entity_sub}</span>
                        <span className="mobile-only-inline text-muted text-xs mt-1">
                          {t.purpose}
                        </span>
                      </div>
                    )
                  },
                  { 
                    header: 'Type', 
                    accessor: (t: any) => {
                      const isPositive = t.direction === 'credit';
                      return (
                        <div className="flex items-center gap-1.5 justify-center md:justify-start" title={t.type}>
                          {isPositive ? (
                            <ArrowDownLeft size={16} className="text-success" />
                          ) : (
                            <ArrowUpRight size={16} className="text-danger" />
                          )}
                          <span className={clsx(
                            "desktop-only-inline text-xs font-semibold capitalize",
                            isPositive ? "text-success" : "text-danger"
                          )}>
                            {t.type}
                          </span>
                        </div>
                      );
                    },
                    align: 'center'
                  },
                  { 
                    header: 'Purpose', 
                    responsiveHidden: 'mobile',
                    accessor: (t: any) => (
                      <span className={clsx(t.is_reversed && "line-through text-muted")}>
                        {t.purpose}
                      </span>
                    )
                  },
                  { 
                    header: 'Amount', 
                    accessor: (t: any) => (
                      <div className="flex flex-col items-end">
                        <span className={clsx(
                          styles.amount, 
                          t.direction === 'credit' ? "text-success" : "text-danger",
                          t.is_reversed && "line-through opacity-70"
                        )}>
                          {t.direction === 'credit' ? '+' : '-'}₹{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <div className="mobile-only-flex mt-1">
                          <Badge variant={t.is_reversed ? 'danger' : 'success'} size="sm" pill>
                            {t.is_reversed ? 'Reversed' : 'Active'}
                          </Badge>
                        </div>
                      </div>
                    ),
                    align: 'right'
                  },
                  { 
                    header: 'Status', 
                    responsiveHidden: 'mobile',
                    align: 'center',
                    accessor: (t: any) => (
                      <Badge variant={t.is_reversed ? 'danger' : 'success'} size="sm" pill>
                        {t.is_reversed ? 'Reversed' : 'Active'}
                      </Badge>
                    )
                  },
                  { 
                    header: 'Actions', 
                    align: 'right',
                    accessor: (t: any) => {
                      const isReversible = canReverse && !t.is_reversed && t.student_id;
                      return (
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => navigate(`/transactions/${t.id}`)}
                            title="View Transaction Record"
                          >
                            <Eye size={18} />
                          </Button>
                          {canReverse && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              disabled={!isReversible}
                              onClick={() => {
                                setTxToReverse(t);
                                setReversalReason('');
                              }}
                              className="text-danger hover:bg-danger/10 disabled:opacity-30"
                              title={isReversible ? "Reverse Transaction" : "Cannot be reversed"}
                            >
                              <RotateCcw size={18} />
                            </Button>
                          )}
                        </div>
                      );
                    }
                  }
                ]}
                data={paginatedTransactions}
              />

              {/* Pagination Controls */}
              <div className="flex items-center justify-between p-4 border-t border-border-color text-xs text-muted">
                <div>
                  Showing {filteredTransactions.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} of {filteredTransactions.length} records
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    icon={<ChevronLeft size={16} />}
                  >
                    Previous
                  </Button>
                  <span className="font-medium text-text-primary px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    icon={<ChevronRight size={16} />}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Reversal Modal */}
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
                Reversing transaction <code>{txToReverse.id.slice(0, 8)}...</code> for{' '}
                <strong>{txToReverse.entity_name}</strong> will create a linked compensating{' '}
                <strong>{txToReverse.direction === 'credit' ? 'DEBIT' : 'CREDIT'}</strong> entry of{' '}
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
                placeholder="e.g. Inadvertent duplicate fee posting detected during audit..."
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
