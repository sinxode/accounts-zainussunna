import React from 'react';
import { Clock, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, MoreVertical, FileText, Trash2, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styles from '../../pages/operations/OperationsCenter.module.scss';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Dropdown } from '../ui/Dropdown';
import { clsx } from 'clsx';
import { transactionService, borrowerService } from '../../lib/services';
import { useUIStore } from '../../store/useUIStore';

export const RecentOperations: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const openConfirmation = useUIStore(state => state.openConfirmation);
  
  const { data: operations, isLoading, error } = useQuery({
    queryKey: ['recentOperations'],
    queryFn: () => transactionService.listRecentOperations(15),
  });
// Group transfers if needed (for internal transfers which have operation_id or same date/amount)
const groupedOperations = React.useMemo(() => {
  if (!operations) return [];

  const groups: Record<string, any> = {};
  const finalOps: any[] = [];

  operations.forEach((op: any) => {
    if (op.type === 'adjustment') {
      // Use operation_id if available, otherwise fallback to date + amount grouping
      const dateKey = op.date ? new Date(op.date).toISOString().substring(0, 16) : 'unknown';
      const groupKey = op.operation_id || `legacy_adj_${op.amount}_${dateKey}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          ...op,
          id: groupKey,
          participants: []
        };
        finalOps.push(groups[groupKey]);
      }
      groups[groupKey].participants.push(op);

      // If we grouped a legacy item, try to clean up the purpose
      if (!op.operation_id && groups[groupKey].participants.length > 1) {
        groups[groupKey].purpose = groups[groupKey].purpose.replace(/^Transfer (from|to) [^:]+: /, 'Transfer: ');
      }
    } else {
      finalOps.push({ ...op, participants: [op] });
    }
  });

  return finalOps.slice(0, 7); // Take top 7 logical operations
  }, [operations]);

  const deleteMutation = useMutation({
    mutationFn: (op: any) => {
      if (op.type === 'loan') return borrowerService.deleteLoan(op.id);
      return transactionService.deleteOperation(op.operation_id || op.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentOperations'] });
      toast.success('Operation deleted');
    },
    onError: () => toast.error('Failed to delete operation')
  });

  const handleEdit = (opId: string) => {
    toast.success(`Edit initiated for ${opId}`);
  };

  const handleDelete = (op: any) => {
    openConfirmation({
      title: 'Delete Operation?',
      message: 'Are you sure you want to delete this operation? This will permanently remove the transaction from the ledger.',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: () => deleteMutation.mutate(op)
    });
  };

  const getDropdownItems = (op: any) => [
    { label: 'View Details', icon: <FileText size={16} />, onClick: () => navigate(`/transactions`) },
    { label: 'Edit', icon: <Edit size={16} />, onClick: () => handleEdit(op.id) },
    { label: 'Delete', icon: <Trash2 size={16} />, onClick: () => handleDelete(op), danger: true },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <ArrowDownCircle size={20} />;
      case 'adjustment': return <ArrowLeftRight size={20} />;
      case 'loan': return <ArrowUpCircle size={20} />;
      case 'recovery': return <ArrowDownCircle size={20} />;
      default: return <Clock size={20} />;
    }
  };

  return (
    <Card padding="none">
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>
          <Clock size={20} className="text-primary" />
          Recent Operations
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/transactions')}>View All</Button>
      </div>
      
      {isLoading ? (
        <div className="p-4">Loading...</div>
      ) : error ? (
        <div className="p-4 text-red-500">Error loading operations</div>
      ) : (
        <div className={styles.opsList}>
          {groupedOperations?.map((op: any) => {
            const isTransfer = op.type === 'adjustment';
            const lender = op.participants?.find((p: any) => p.direction === 'debit' || p.raw?.direction === 'debit')?.entity_name || op.participants?.find((p: any) => p.direction === 'debit' || p.raw?.direction === 'debit')?.raw?.students?.name;
            const borrower = op.participants?.find((p: any) => p.direction === 'credit' || p.raw?.direction === 'credit')?.entity_name || op.participants?.find((p: any) => p.direction === 'credit' || p.raw?.direction === 'credit')?.raw?.students?.name;
            
            return (
              <div key={op.id} className={styles.opItem}>
                <div className={styles.opInfo}>
                  <div className={clsx(styles.opIcon, styles[op.type])}>
                    {getIcon(op.type)}
                  </div>
                  <div className={styles.opDetails}>
                    <span className={styles.opTitle}>{op.purpose || (isTransfer ? 'Internal Transfer' : 'Operation')}</span>
                    <span className={styles.opSub}>
                      {isTransfer ? (
                        <span className="flex items-center gap-1">
                          <span className="text-danger">{lender || 'System'}</span>
                          <span>→</span>
                          <span className="text-success">{borrower || 'Unknown'}</span>
                        </span>
                      ) : (
                        op.entity_name
                      )}
                      {` • ${new Date(op.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className={styles.opAmount}>₹{op.amount.toLocaleString()}</span>
                  <Dropdown 
                    trigger={<Button variant="ghost" size="sm" icon={<MoreVertical size={16} />} />}
                    items={getDropdownItems(op)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
