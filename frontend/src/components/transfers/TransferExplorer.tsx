import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { IndianRupee, Download, Archive, Search } from 'lucide-react';
import styles from '../../pages/transfers/InternalTransfers.module.scss';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '../../lib/services';
import { useUIStore } from '../../store/useUIStore';
import { useOperationsDrawer } from '../operations/drawers/OperationsDrawerContext';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

export const TransferExplorer: React.FC = () => {
  const { setActiveModal, setExportData } = useUIStore();
  const { openDrawer } = useOperationsDrawer();
  const queryClient = useQueryClient();

  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ['internalTransfers'],
    queryFn: transactionService.listInternalTransfers,
  });

  const settleMutation = useMutation({
    mutationFn: (operationId: string) => transactionService.settleInternalTransfer(operationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internalTransfers'] });
      queryClient.invalidateQueries({ queryKey: ['transferSummary'] });
      queryClient.invalidateQueries({ queryKey: ['todaySummary'] });
      queryClient.invalidateQueries({ queryKey: ['recentOperations'] });
      queryClient.invalidateQueries({ queryKey: ['borrowers'] });
      queryClient.invalidateQueries({ queryKey: ['borrower'] });
      queryClient.invalidateQueries({ queryKey: ['systemNotifications'] });
      toast.success('Internal transfer marked as settled');
    },
    onError: (err: any) => {
      toast.error(`Settlement failed: ${err.message}`);
    }
  });

  const handleSettle = (id: string) => {
    if (window.confirm('Are you sure you want to mark this internal transfer as settled?')) {
      settleMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'active': return <Badge variant="primary" size="sm">Active</Badge>;
      case 'partially_repaid': return <Badge variant="warning" size="sm">Partially Repaid</Badge>;
      case 'settled': return <Badge variant="success" size="sm">Settled</Badge>;
      case 'overdue': return <Badge variant="danger" size="sm">Overdue</Badge>;
      default: return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  const handleExport = () => {
    setExportData({
      title: 'Internal Transfers Explorer',
      filename: `Transfers_Export_${new Date().toISOString().split('T')[0]}`,
      type: 'report',
      columns: ['ID', 'Lender', 'Borrower', 'Amount', 'Date', 'Status'],
      rows: transfers.map((trf: any) => {
        const lender = trf.participants.find((p: any) => p.direction === 'debit')?.name || 'System';
        const borrower = trf.participants.find((p: any) => p.direction === 'credit')?.name || 'Unknown';
        return [
          trf.id.slice(0, 8),
          lender,
          borrower,
          `₹${trf.amount.toLocaleString()}`,
          new Date(trf.transaction_date).toLocaleDateString(),
          trf.is_reversed ? 'Settled' : 'Active'
        ];
      })
    });
    setActiveModal('printExport');
  };

  return (
    <Card padding="none" className={styles.explorerCard}>
      <div className={styles.explorerHeader}>
        <h3 className={styles.sectionTitle}>Transfer Explorer</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" icon={<Search size={14} />}>Filter</Button>
          <Button variant="soft" size="sm" icon={<Download size={14} />} onClick={handleExport}>Export List</Button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {isLoading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading internal transfers...</div>
        ) : transfers.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No internal transfers recorded.</div>
        ) : (
          <div className={styles.transferCardList}>
            {transfers.map((trf: any) => {
              const lender = trf.participants.find((p: any) => p.direction === 'debit')?.name || 'System';
              const borrower = trf.participants.find((p: any) => p.direction === 'credit')?.name || 'Unknown';
              const borrowerId = trf.participants.find((p: any) => p.direction === 'credit')?.student_id;
              return (
                <div key={trf.id} className={styles.transferCard}>
                  <div className={styles.transferPrimary}>
                    <div className={styles.cardHeader}>
                      <span className={styles.cardDate}>{new Date(trf.transaction_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      <span className={styles.cardId}>ID: {trf.id.slice(0, 8)}</span>
                    </div>
                    <div className={styles.cardParticipants}>
                      <span className={clsx(styles.lenderName)}>{lender}</span>
                      <span className={styles.divider}>→</span>
                      <span className={clsx(styles.borrowerName)}>{borrower}</span>
                    </div>
                  </div>

                  <div className={styles.transferStatus}>
                    {getStatusBadge(trf.is_reversed ? 'settled' : 'active')}
                  </div>

                  <div className={styles.transferAmount}>
                    <span className={styles.amountLabel}>Transfer Amount</span>
                    <strong className={styles.amountValue}>₹{trf.amount.toLocaleString('en-IN')}</strong>
                  </div>

                  <div className={styles.cardActions}>
                    <Button 
                      variant="soft" 
                      size="sm" 
                      icon={<IndianRupee size={14} />} 
                      onClick={() => openDrawer('recovery', { studentId: borrowerId })}
                      disabled={trf.is_reversed}
                    >
                      Repay
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      icon={<Archive size={14} className={trf.is_reversed ? "text-success" : "text-muted"} />} 
                      onClick={() => handleSettle(trf.id)}
                      disabled={trf.is_reversed}
                      title="Mark as Settled"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};
