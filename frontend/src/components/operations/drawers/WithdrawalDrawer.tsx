import React, { useState } from 'react';
import { DrawerLayout } from './DrawerLayout';
import { ArrowUpCircle } from 'lucide-react';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { StudentSearch } from '../../ui/StudentSearch';
import styles from './DrawerStyles.module.scss';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { transactionService, studentService } from '../../../lib/services';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';

export const WithdrawalDrawer: React.FC<{ onClose: () => void; initialStudentId?: string }> = ({ onClose, initialStudentId }) => {
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [amount, setAmount] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [resetKey, setResetKey] = useState(0);
  
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Pre-fetch student if initialStudentId is provided
  const { data: fetchedStudent } = useQuery({
    queryKey: ['student', initialStudentId],
    queryFn: () => studentService.getById(initialStudentId!),
    enabled: !!initialStudentId
  });

  React.useEffect(() => {
    if (fetchedStudent) {
      setSelectedStudent(fetchedStudent);
    }
  }, [fetchedStudent]);

  const createMutation = useMutation({
    mutationFn: transactionService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentOperations'] });
      queryClient.invalidateQueries({ queryKey: ['todaySummary'] });
      toast.success('Withdrawal processed successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(`Failed to process withdrawal: ${error.message}`);
    }
  });

  const handleClear = () => {
    setSelectedStudent(null);
    setAmount('');
    setPurpose('');
    setNotes('');
    setResetKey(prev => prev + 1);
  };

  const handleSubmit = () => {
    if (!selectedStudent || !amount || parseFloat(amount) <= 0) {
      toast.error('Please select a student and enter a valid amount');
      return;
    }
    if (!user) {
      toast.error('You must be logged in to perform this action');
      return;
    }

    createMutation.mutate({
      student_id: selectedStudent.id,
      transaction_type: 'withdrawal',
      direction: 'debit',
      amount: parseFloat(amount),
      purpose: purpose || 'Withdrawal',
      transaction_date: new Date().toISOString(),
      created_by: user.id
    });
  };

  const currentBalance = selectedStudent?.current_balance || 0;
  const withdrawalAmount = parseFloat(amount) || 0;
  const afterBalance = currentBalance - withdrawalAmount;

  return (
    <DrawerLayout
      title="Withdrawal"
      subtitle="Deduct money from a student's account"
      icon={<ArrowUpCircle className="text-danger" />}
      onClose={onClose}
      onClear={handleClear}
      footer={<Button variant="primary" onClick={handleSubmit} loading={createMutation.isPending} fullWidth>Process Withdrawal</Button>}
    >
      <div className={styles.drawerContent}>
        {initialStudentId ? (
          <div className={styles.selectedStudent}>
            <div className={styles.avatar}>{selectedStudent?.name?.charAt(0) || '?'}</div>
            <div className={styles.info}>
              <span className={styles.name}>{selectedStudent?.name || 'Loading...'}</span>
              <span className={styles.enr}>{selectedStudent?.enrolment_no}</span>
            </div>
          </div>
        ) : (
          <StudentSearch 
            key={resetKey}
            label="Student" 
            placeholder="Search student by name or ID..." 
            onSelect={(student) => setSelectedStudent(student)} 
          />
        )}
        <Input 
          label="Amount (₹)" 
          placeholder="0.00" 
          type="number" 
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Input label="Purpose" placeholder="e.g. Books, Food, Personal" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
        <Input label="Notes (Optional)" placeholder="Any additional remarks..." value={notes} onChange={(e) => setNotes(e.target.value)} />
        
        <div className={styles.balancePreview}>
          <div className={styles.previewLabel}>Balance Preview</div>
          <div className={styles.previewRow}>
            <span className={styles.previewLabelText}>Current Balance</span>
            <span className={clsx(styles.previewValue, currentBalance < 0 ? styles.negative : styles.positive)}>
              ₹{currentBalance.toLocaleString()}
            </span>
          </div>
          <div className={clsx(styles.previewRow, styles.afterRow)}>
            <span className="font-medium">After Withdrawal</span>
            <span className={clsx(styles.previewValue, afterBalance < 0 ? styles.negative : styles.positive)}>
              ₹{afterBalance.toLocaleString()}
            </span>
          </div>
          <div className={clsx(styles.previewRow, styles.impactRow)}>
            <span className={styles.previewLabelText}>Balance Impact</span>
            <span className={clsx(styles.impactValue, styles.danger)}>
              -{withdrawalAmount > 0 ? `₹${withdrawalAmount.toLocaleString()}` : '₹0'}
            </span>
          </div>
        </div>
      </div>
    </DrawerLayout>
  );
};
