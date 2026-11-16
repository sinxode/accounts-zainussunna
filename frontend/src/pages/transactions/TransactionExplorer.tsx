import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Printer, 
  RotateCcw,
  Receipt
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PillTabs } from '../../components/ui/PillTabs';
import { Drawer } from '../../components/ui/Drawer';
import { TransactionRow } from '../../components/ui/TransactionRow';
import { ExportMenu } from '../../components/ui/ExportMenu';
import { exportService } from '../../lib/exportService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '../../lib/services';
import { useUIStore } from '../../store/useUIStore';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import styles from './TransactionExplorer.module.scss';
import { clsx } from 'clsx';

const ITEMS_PER_PAGE = 25;

const formatTxDate = (val: any) => {
  if (!val) return '—';
  const d = new Date(val);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const TransactionExplorer: React.FC = () => {
  const { role } = useAuth();
  const { setActiveModal, setExportData } = useUIStore();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<any>(null);

  const [txToReverse, setTxToReverse] = useState<any>(null);
  const [reversalReason, setReversalReason] = useState('');

  const canReverse = role && ['super_admin', 'admin', 'owner', 'manager'].includes(role);

  // Month state for month navigation
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handlePrevMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const monthLabel = selectedDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactionsUnified'],
    queryFn: () => transactionService.listAllUnified(300)
  });

  const reverseMutation = useMutation({
    mutationFn: () => transactionService.reverse(txToReverse.id, reversalReason.trim()),
    onSuccess: () => {
      toast.success('Transaction reversed successfully');
      setTxToReverse(null);
      setReversalReason('');
      setSelectedTx(null);
      queryClient.invalidateQueries({ queryKey: ['transactionsUnified'] });
      queryClient.invalidateQueries({ queryKey: ['daily-summary'] });
      queryClient.invalidateQueries({ queryKey: ['studentsSummary'] });
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

      const matchesType = typeFilter === 'all' || 
        (typeFilter === 'deposit' && (t.type === 'deposit' || t.direction === 'credit')) ||
        (typeFilter === 'withdrawal' && (t.type === 'withdrawal' || t.direction === 'debit')) ||
        (typeFilter === 'transfer' && (t.type === 'transfer' || t.type === 'internal')) ||
        t.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [transactions, searchTerm, typeFilter]);

  // Compute summary strip stats: Total In | Total Out | Net
  const { totalIn, totalOut, netTotal } = useMemo(() => {
    let inAmt = 0;
    let outAmt = 0;
    filteredTransactions.forEach((t: any) => {
      if (t.is_reversed) return;
      if (t.direction === 'credit') inAmt += Number(t.amount) || 0;
      if (t.direction === 'debit') outAmt += Number(t.amount) || 0;
    });
    return {
      totalIn: inAmt,
      totalOut: outAmt,
      netTotal: inAmt - outAmt
    };
  }, [filteredTransactions]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const handleExport = () => {
    setExportData({
      title: 'Global Transaction Ledger',
      filename: `Transactions_Export_${new Date().toISOString().split('T')[0]}`,
      type: 'report',
      columns: ['ID', 'Date', 'Entity', 'Type', 'Direction', 'Amount', 'Status'],
      rows: filteredTransactions.map((t: any) => [
        t.id.slice(0, 8),
        formatTxDate(t.date || t.transaction_date || t.created_at),
        t.entity_name,
        t.type,
        t.direction,
        `${t.direction === 'credit' ? '+' : '-'}₹${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        t.is_reversed ? 'Reversed' : 'Active'
      ])
    });
    setActiveModal('printExport');
  };

  const handleExportCSV = () => {
    const filename = `Transactions_Ledger_${new Date().toISOString().split('T')[0]}`;
    const columns = ['ID', 'Date', 'Entity', 'Type', 'Direction', 'Amount', 'Status'];
    const rows = filteredTransactions.map((t: any) => [
      t.id.slice(0, 8),
      formatTxDate(t.date || t.transaction_date || t.created_at),
      t.entity_name,
      t.type,
      t.direction,
      `${t.direction === 'credit' ? '+' : '-'}₹${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      t.is_reversed ? 'Reversed' : 'Active'
    ]);
    exportService.exportToCSV('Transactions Ledger', columns, rows, filename);
  };

  const handleExportExcel = () => {
    const filename = `Transactions_Ledger_${new Date().toISOString().split('T')[0]}`;
    const columns = ['ID', 'Date', 'Entity', 'Type', 'Direction', 'Amount', 'Status'];
    const rows = filteredTransactions.map((t: any) => [
      t.id.slice(0, 8),
      formatTxDate(t.date || t.transaction_date || t.created_at),
      t.entity_name,
      t.type,
      t.direction,
      `${t.direction === 'credit' ? '+' : '-'}₹${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      t.is_reversed ? 'Reversed' : 'Active'
    ]);
    exportService.exportToExcel('Transactions Ledger', columns, rows, filename);
  };

  const handleExportPDF = () => {
    const filename = `Transactions_Ledger_${new Date().toISOString().split('T')[0]}`;
    const columns = ['ID', 'Date', 'Entity', 'Type', 'Direction', 'Amount', 'Status'];
    const rows = filteredTransactions.map((t: any) => [
      t.id.slice(0, 8),
      formatTxDate(t.date || t.transaction_date || t.created_at),
      t.entity_name,
      t.type,
      t.direction,
      `${t.direction === 'credit' ? '+' : '-'}₹${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      t.is_reversed ? 'Reversed' : 'Active'
    ]);
    exportService.exportToPDF('Transactions Ledger', columns, rows, filename);
  };

  return (
    <div className={styles.container}>
      {/* Top Filter & Navigation Bar */}
      <div className={styles.controlsRow}>
        <div className={styles.navGroup}>
          {/* Month Navigator (Spec 4.2) */}
          <div className={styles.monthNavigator}>
            <button type="button" onClick={handlePrevMonth} className={styles.monthArrow} aria-label="Previous month">
              <ChevronLeft size={16} />
            </button>
            <span className={styles.monthText}>{monthLabel}</span>
            <button type="button" onClick={handleNextMonth} className={styles.monthArrow} aria-label="Next month">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* PillTabs Type Filter (Spec 4.2) */}
          <PillTabs
            value={typeFilter}
            onChange={(val) => { setTypeFilter(val); setCurrentPage(1); }}
            variant="lime"
            size="md"
            options={[
              { value: 'all', label: 'All' },
              { value: 'deposit', label: 'Deposits' },
              { value: 'withdrawal', label: 'Withdrawals' },
              { value: 'transfer', label: 'Transfers' },
            ]}
          />
        </div>

        <div className={styles.actionGroup}>
          <input
            type="text"
            className={styles.inlineSearch}
            placeholder="Search by student, purpose, ID..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />

          <ExportMenu
            onExportCSV={handleExportCSV}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            size="sm"
          />

          <Button variant="ghost" size="sm" icon={<Printer size={15} />} onClick={handleExport}>
            Print
          </Button>
        </div>
      </div>

      {/* Summary Strip (Spec 4.2: Total in | Total out | Net) */}
      <div className={styles.summaryStrip}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total In</span>
          <span className={clsx(styles.summaryValue, styles.credit)}>
            +₹{totalIn.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total Out</span>
          <span className={clsx(styles.summaryValue, styles.debit)}>
            −₹{totalOut.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Net Movement</span>
          <span className={clsx(
            styles.summaryValue, 
            netTotal >= 0 ? styles.credit : styles.debit
          )}>
            {netTotal >= 0 ? '+' : '−'}₹{Math.abs(netTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className={styles.summaryCount}>
          <span>{filteredTransactions.length} records</span>
        </div>
      </div>

      {/* Transaction Cards List Container */}
      <Card padding="none" className={styles.tableCard}>
        {isLoading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading transactions ledger...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No transactions found matching your criteria.
          </div>
        ) : (
          <>
            <div className={styles.txList}>
              {paginatedTransactions.map((t: any) => (
                <TransactionRow
                  key={t.id}
                  id={t.id}
                  type={t.type}
                  direction={t.direction}
                  amount={t.amount}
                  purpose={t.purpose}
                  studentName={t.entity_name}
                  accountName={t.entity_sub}
                  date={t.date}
                  status={t.is_reversed ? 'reversed' : 'active'}
                  onClick={() => setSelectedTx(t)}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            <div className={styles.paginationBar}>
              <span className={styles.pageInfo}>
                Showing {Math.min(filteredTransactions.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} of {filteredTransactions.length}
              </span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  icon={<ChevronLeft size={16} />}
                >
                  Prev
                </Button>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-strong)' }}>
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

      {/* Transaction Detail Drawer (Spec 4.2) */}
      {selectedTx && (
        <Drawer
          isOpen={!!selectedTx}
          onClose={() => setSelectedTx(null)}
          title="Transaction Receipt"
          subtitle={`Reference: ${selectedTx.id.slice(0, 12)}`}
          footer={
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              {canReverse && !selectedTx.is_reversed && selectedTx.student_id && (
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
          <div className={styles.receiptContainer}>
            {/* Big Amount Card */}
            <div className={styles.receiptHeader}>
              <div className={styles.receiptIcon}>
                <Receipt size={28} />
              </div>
              <span className={clsx(
                styles.receiptAmount,
                selectedTx.direction === 'credit' ? styles.credit : styles.debit
              )}>
                {selectedTx.direction === 'credit' ? '+' : '−'}₹{Number(selectedTx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <Badge variant={selectedTx.is_reversed ? 'danger' : 'active'}>
                {selectedTx.is_reversed ? 'Reversed Transaction' : 'Active & Verified'}
              </Badge>
            </div>

            {/* Receipt Key-Value Rows */}
            <div className={styles.receiptDetails}>
              <div className={styles.receiptRow}>
                <span className={styles.rowLabel}>Purpose</span>
                <span className={styles.rowValue}>{selectedTx.purpose || 'None'}</span>
              </div>
              <div className={styles.receiptRow}>
                <span className={styles.rowLabel}>Account / Student</span>
                <span className={styles.rowValue}>{selectedTx.entity_name}</span>
              </div>
              <div className={styles.receiptRow}>
                <span className={styles.rowLabel}>Transaction Type</span>
                <span className={styles.rowValue} style={{ textTransform: 'capitalize' }}>{selectedTx.type}</span>
              </div>
              <div className={styles.receiptRow}>
                <span className={styles.rowLabel}>Date & Time</span>
                <span className={styles.rowValue}>{formatTxDate(selectedTx.date || selectedTx.transaction_date || selectedTx.created_at)}</span>
              </div>
              <div className={styles.receiptRow}>
                <span className={styles.rowLabel}>System ID</span>
                <span className={clsx(styles.rowValue, styles.mono)}>{selectedTx.id}</span>
              </div>
            </div>

            {/* Reversal Confirmation Form if active */}
            {txToReverse && txToReverse.id === selectedTx.id && (
              <div className={styles.reversalForm}>
                <span className={styles.reversalTitle}>Confirm Reversal</span>
                <input
                  type="text"
                  className={styles.reversalInput}
                  placeholder="Reason for reversal (mandatory)..."
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={reverseMutation.isPending}
                    disabled={!reversalReason.trim()}
                    onClick={() => reverseMutation.mutate()}
                  >
                    Confirm Reversal
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTxToReverse(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Drawer>
      )}
    </div>
  );
};
