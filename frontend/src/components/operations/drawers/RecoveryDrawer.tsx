import React, { useState } from 'react';
import { DrawerLayout } from './DrawerLayout';
import { RefreshCcw, Info, Wallet } from 'lucide-react';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { BorrowerSearch } from '../../ui/BorrowerSearch';
import styles from './DrawerStyles.module.scss';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { borrowerService } from '../../../lib/services';
import { useAuth } from '../../../contexts/AuthContext';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

export const RecoveryDrawer: React.FC<{ onClose: () => void; initialBorrowerId?: string }> = ({ onClose, initialBorrowerId }) => {
  const { user } = useAuth();
  const [selectedBorrower, setSelectedBorrower] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [resetKey, setResetKey] = useState(0);
  
  const queryClient = useQueryClient();

  const handleClear = () => {
    setSelectedBorrower(null);
    setAmount('');
    setNotes('');
    setResetKey(prev => prev + 1);
  };

  const totalLoaned = selectedBorrower?.borrower_loans?.reduce((sum: number, l: any) => sum + Number(l.loan_amount), 0) || 0;
  const totalRecovered = selectedBorrower?.borrower_loans?.reduce((sum: number, l: any) => sum + (l.recoveries?.reduce((recSum: number, r: any) => recSum + Number(r.amount), 0) || 0), 0) || 0;
  const outstanding = totalLoaned - totalRecovered;
  
  const recoveryAmount = parseFloat(amount || '0');
  const remaining = Math.max(0, outstanding - recoveryAmount);

  const recoveryMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBorrower || !selectedBorrower.borrower_loans?.[0]) {
        throw new Error('No active loan found for this borrower');
      }
      
      if (!user) throw new Error('User not authenticated');
      
      // For simplicity, we record against the first active loan
      const activeLoan = selectedBorrower.borrower_loans.find((l: any) => l.status === 'active') || selectedBorrower.borrower_loans[0];
      
      const { data, error } = await borrowerService.createRecovery({
        loan_id: activeLoan.id,
        amount: recoveryAmount,
        recovery_date: new Date().toISOString().split('T')[0],
        notes: notes,
        created_by: user.id
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrowers'] });
      queryClient.invalidateQueries({ queryKey: ['borrower'] });
      queryClient.invalidateQueries({ queryKey: ['transferSummary'] });
      queryClient.invalidateQueries({ queryKey: ['recentOperations'] });
      queryClient.invalidateQueries({ queryKey: ['todaySummary'] });
      queryClient.invalidateQueries({ queryKey: ['systemNotifications'] });
      toast.success('Recovery recorded successfully');
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message);
    }
  });

  const handleSubmit = () => {
    if (!selectedBorrower) return toast.error('Please select a borrower');
    if (recoveryAmount <= 0) return toast.error('Please enter a valid recovery amount');
    recoveryMutation.mutate();
  };

  return (
    <DrawerLayout
      title="Loan Recovery"
      subtitle="Record a repayment from an external borrower"
      icon={<RefreshCcw className="text-success" />}
      onClose={onClose}
      onClear={handleClear}
      footer={<Button variant="primary" fullWidth onClick={handleSubmit} loading={recoveryMutation.isPending}>Confirm Recovery</Button>}
    >
      <div className={styles.drawerContent}>
        {/* Step 1: Borrower Selection */}
        <section className="flex flex-col gap-4">
          <div className={styles.stepHeader}>
            <span className={styles.stepCircle}>1</span>
            Select Borrower
          </div>
          
          <BorrowerSearch 
            key={resetKey}
            label="Registered Borrower" 
            placeholder="Search by name or phone..." 
            onSelect={setSelectedBorrower}
            initialBorrowerId={initialBorrowerId}
          />
        </section>

        {/* Step 2: Payment Details */}
        <section className="flex flex-col gap-4">
          <div className={styles.stepHeader}>
            <span className={styles.stepCircle}>2</span>
            Payment Details
          </div>
          
          <div className="flex flex-col gap-5">
            <Input 
              label="Recovery Amount (₹)" 
              placeholder="0.00" 
              type="number" 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              icon={<Wallet size={18} className="text-success" />}
            />
            
            <Input 
              label="Notes (Optional)" 
              placeholder="Any additional remarks..." 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
            />
          </div>
        </section>
        
        {/* Balance Impact */}
        <div className={styles.balancePreview}>
          <div className={styles.previewLabel}>Recovery Impact</div>
          <div className={styles.previewRow}>
            <span className={styles.previewLabelText}>Current Outstanding</span>
            <span className={styles.previewValue}>₹{outstanding.toLocaleString()}</span>
          </div>
          <div className={clsx(styles.previewRow, styles.afterRow, styles.success)}>
            <span className="font-medium">Remaining Liability</span>
            <span className="font-bold">₹{remaining.toLocaleString()}</span>
          </div>
          <div className={clsx(styles.previewRow, styles.impactRow)}>
            <span className={styles.previewLabelText}>Balance Reduction</span>
            <span className={clsx(styles.impactValue, styles.success)}>-₹{recoveryAmount.toLocaleString()}</span>
          </div>
        </div>

        <div className={styles.infoBox}>
          <Info size={16} />
          <p>
            Recording this recovery will update the borrower's outstanding balance and increase the academy's liquid cash.
          </p>
        </div>
      </div>
    </DrawerLayout>
  );
};
