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
import { DataTable } from '../ui/DataTable';
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

  const columns = [
    {
      header: 'ID',
      accessor: (trf: any) => (
        <div className="flex flex-col">
          <span className="font-bold text-sm text-primary">{trf.id.slice(0, 8)}</span>
          <span className="mobile-only-inline text-muted text-xs mt-1">
            {new Date(trf.transaction_date).toLocaleDateString()}
          </span>
        </div>
      )
    },
    {
      header: 'Participants (Lender → Borrower)',
      accessor: (trf: any) => {
        const lender = trf.participants.find((p: any) => p.direction === 'debit')?.name || 'System';
        const borrower = trf.participants.find((p: any) => p.direction === 'credit')?.name || 'Unknown';
        return (
          <span className="text-sm font-medium">
            <span className="text-danger">{lender}</span>
            <span className="mx-2 text-muted">→</span>
            <span className="text-success">{borrower}</span>
          </span>
        );
      }
    },
    {
      header: 'Amount',
      accessor: (trf: any) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold">₹{trf.amount.toLocaleString()}</span>
          <div className="mobile-only-flex mt-1">
            {getStatusBadge(trf.is_reversed ? 'settled' : 'active')}
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      responsiveHidden: 'mobile',
      accessor: (trf: any) => getStatusBadge(trf.is_reversed ? 'settled' : 'active')
    },
    {
      header: 'Date',
      responsiveHidden: 'mobile',
      accessor: (trf: any) => <span className="text-sm text-muted">{new Date(trf.transaction_date).toLocaleDateString()}</span>
    },
    {
      header: 'Actions',
      accessor: (trf: any) => {
        const borrower = trf.participants.find((p: any) => p.direction === 'credit');
        const borrowerId = borrower?.student_id;
        return (
          <div className="flex gap-1 justify-end">
            <Button 
              variant="ghost" 
              size="sm" 
              icon={<IndianRupee size={14} />} 
              onClick={() => openDrawer('recovery', { studentId: borrowerId })}
              disabled={trf.is_reversed}
              title="Record Repayment"
            />
            <Button 
              variant="ghost" 
              size="sm" 
              icon={<Archive size={14} className={trf.is_reversed ? "text-success" : "text-muted"} />} 
              onClick={() => handleSettle(trf.id)}
              disabled={trf.is_reversed}
              title={trf.is_reversed ? "Settled" : "Settle / Close"}
            />
          </div>
        );
      },
      align: 'right' as const
    }
  ];

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
        <DataTable
          columns={columns}
          data={transfers}
          isLoading={isLoading}
          renderCard={(trf: any) => {
            const lender = trf.participants.find((p: any) => p.direction === 'debit')?.name || 'System';
            const borrower = trf.participants.find((p: any) => p.direction === 'credit')?.name || 'Unknown';
            const borrowerId = trf.participants.find((p: any) => p.direction === 'credit')?.student_id;
            return (
              <div key={trf.id} className={styles.mobileTransferCard}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardId}>{trf.id.slice(0, 8)}</span>
                  <span className={styles.cardDate}>{new Date(trf.transaction_date).toLocaleDateString()}</span>
                </div>
                <div className={styles.cardParticipants}>
                  <div className={styles.participant}>
                    <span className={styles.label}>Lender</span>
                    <span className={clsx(styles.value, "text-danger")}>{lender}</span>
                  </div>
                  <div className={styles.divider}>→</div>
                  <div className={styles.participant}>
                    <span className={styles.label}>Borrower</span>
                    <span className={clsx(styles.value, "text-success")}>{borrower}</span>
                  </div>
                </div>
                <div className={styles.cardDetails}>
                  <div className={styles.detail}>
                    <span className={styles.label}>Amount</span>
                    <span className={styles.value}>₹{trf.amount.toLocaleString()}</span>
                  </div>
                  <div className={styles.detail}>
                    <span className={styles.label}>Status</span>
                    <span>{getStatusBadge(trf.is_reversed ? 'settled' : 'active')}</span>
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    icon={<IndianRupee size={14} />} 
                    onClick={() => openDrawer('recovery', { studentId: borrowerId })}
                    disabled={trf.is_reversed}
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    icon={<Archive size={14} className={trf.is_reversed ? "text-success" : "text-muted"} />} 
                    onClick={() => handleSettle(trf.id)}
                    disabled={trf.is_reversed}
                  />
                </div>
              </div>
            );
          }}
        />
      </div>
    </Card>
  );
};
