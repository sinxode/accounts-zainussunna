import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download,
  Calendar,
  Trash2,
  Eye,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/ui/PageContainer';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import styles from './TransactionExplorer.module.scss';
import { clsx } from 'clsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService, borrowerService } from '../../lib/services';
import { useUIStore } from '../../store/useUIStore';
import toast from 'react-hot-toast';

export const TransactionExplorer: React.FC = () => {
  const navigate = useNavigate();
  const { setActiveModal, setExportData, openConfirmation } = useUIStore();
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactionsUnified'],
    queryFn: () => transactionService.listAllUnified(200)
  });

  const useDeleteTransaction = useMutation({
    mutationFn: (t: any) => {
      if (t.type === 'loan') {
        return borrowerService.deleteLoan(t.id);
      } else if (t.type === 'recovery') {
        return borrowerService.deleteRecovery(t.id);
      } else {
        return transactionService.delete(t.id);
      }
    },
    onSuccess: (_, t) => {
      queryClient.setQueryData(['transactionsUnified'], (oldData: any[]) => 
        oldData.filter(item => item.id !== t.id)
      );
      toast.success('Transaction deleted');
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const handleDelete = (t: any) => {
    openConfirmation({
      title: 'Delete Transaction?',
      message: 'Are you sure you want to delete this transaction? This will permanently delete the entry from the transaction ledger.',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: () => useDeleteTransaction.mutate(t)
    });
  };

  const handleExport = () => {
    setExportData({
      title: 'Global Transaction Ledger',
      filename: `Transactions_Export_${new Date().toISOString().split('T')[0]}`,
      type: 'report',
      columns: ['ID', 'Date', 'Entity', 'Type', 'Amount', 'Status'],
      rows: transactions.map((t: any) => [
        t.id.slice(0, 8),
        new Date(t.date).toLocaleDateString(),
        t.entity_name,
        t.type,
        `${t.direction === 'credit' ? '+' : '-'}₹${t.amount.toLocaleString()}`,
        t.is_reversed ? 'Reversed' : 'Active'
      ])
    });
    setActiveModal('printExport');
  };

  return (
    <PageContainer>
      <PageHeader 
        title="Transaction Explorer" 
        subtitle="The financial investigative center of Zainussunna Academy."
        actions={
          <div className="flex gap-2">
            <Button variant="soft" icon={<Download size={18} />} onClick={handleExport}>Export Statement</Button>
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
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className={styles.filterActions}>
              <Button variant="soft" size="md" icon={<Filter size={18} />}>Filters</Button>
              <div className={styles.datePicker}>
                <Calendar size={18} className="text-muted" />
                <span>Last 30 Days</span>
              </div>
            </div>
          </div>
        </Card>

        <Card padding="none" className={styles.tableCard}>
          <DataTable 
            key={transactions.length}
            columns={[
              { 
                header: 'ID', 
                accessor: (t: any) => (
                  <div className="flex flex-col">
                    <span className={styles.txId}>{t.id.slice(0, 8)}...</span>
                    <span className="mobile-only-inline text-muted text-xs mt-1">
                      {new Date(t.date).toLocaleDateString()}
                    </span>
                  </div>
                ),
                width: '80px'
              },
              { 
                header: 'Date', 
                responsiveHidden: 'mobile',
                align: 'center',
                accessor: (t: any) => new Date(t.date).toLocaleDateString() 
              },
              { 
                header: 'Entity', 
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
                  const isPositive = t.type === 'deposit' || t.type === 'recovery';
                  const isNegative = t.type === 'withdrawal' || t.type === 'loan';
                  return (
                    <div className="flex items-center gap-1.5 justify-center md:justify-start" title={t.type}>
                      {isPositive && <ArrowDownLeft size={16} className="text-success" />}
                      {isNegative && <ArrowUpRight size={16} className="text-danger" />}
                      <span className={clsx(
                        "desktop-only-inline text-xs font-semibold capitalize",
                        isPositive && "text-success",
                        isNegative && "text-danger"
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
                accessor: 'purpose' 
              },
              { 
                header: 'Amount', 
                accessor: (t: any) => (
                  <div className="flex flex-col items-end">
                    <span className={clsx(
                      styles.amount, 
                      t.direction === 'credit' ? "text-success" : "text-danger"
                    )}>
                      {t.direction === 'credit' ? '+' : '-'}₹{t.amount.toLocaleString()}
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
                  const hasProfile = t.student_id || t.borrower_id;
                  const profilePath = t.student_id 
                    ? `/students/${t.student_id}` 
                    : `/borrowers/${t.borrower_id}`;
                  
                  return (
                    <div className="flex justify-end gap-1">
                      {hasProfile && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate(profilePath)}
                          title="View Profile"
                        >
                          <Eye size={18} />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(t)}
                        className="text-danger hover:bg-danger/10"
                        title="Delete Transaction"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  );
                }
              }
            ]}
            data={transactions.filter((t: any) => 
              t.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              t.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
            )}
          />
        </Card>
      </div>
    </PageContainer>
  );
};
