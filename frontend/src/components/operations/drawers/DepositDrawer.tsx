import React, { useState } from 'react';
import { DrawerLayout } from './DrawerLayout';
import { ArrowDownCircle } from 'lucide-react';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { StudentSearch } from '../../ui/StudentSearch';
import styles from './DrawerStyles.module.scss';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { transactionService, studentService, presetService } from '../../../lib/services';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { Zap } from 'lucide-react';
import { formatSmartPurpose } from '../../../lib/utils';

export const DepositDrawer: React.FC<{ onClose: () => void; initialStudentId?: string }> = ({ onClose, initialStudentId }) => {
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [amount, setAmount] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [resetKey, setResetKey] = useState(0);
  
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: presets } = useQuery({
    queryKey: ['presets'],
    queryFn: presetService.list
  });

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
    },
    onError: (error: any) => {
      toast.error(`Failed to process deposit: ${error.message}`);
    }
  });

  const handleClear = () => {
    setSelectedStudent(null);
    setAmount('');
    setPurpose('');
    setNotes('');
    setResetKey(prev => prev + 1);
  };

  const handleSubmit = React.useCallback((shouldClose: boolean = true) => {
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
      transaction_type: 'deposit',
      direction: 'credit',
      amount: parseFloat(amount),
      purpose: purpose || 'Deposit',
      transaction_date: new Date().toISOString(),
      created_by: user.id
    }, {
      onSuccess: () => {
        toast.success('Deposit processed successfully');
        if (shouldClose) {
          onClose();
        } else {
          handleClear();
        }
      }
    });
  }, [selectedStudent, amount, purpose, user, createMutation, onClose]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        const isCmdOrCtrl = e.metaKey || e.ctrlKey;
        handleSubmit(!isCmdOrCtrl); // Enter -> Save & Next (shouldClose: false), cmd/ctrl + Enter -> Save & Close (shouldClose: true)
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit]);

  const currentBalance = selectedStudent?.current_balance || 0;
  const depositAmount = parseFloat(amount) || 0;
  const afterBalance = currentBalance + depositAmount;

  return (
    <DrawerLayout
      title="Deposit"
      subtitle="Add money to a student's account"
      icon={<ArrowDownCircle className="text-success" />}
      onClose={onClose}
      onClear={handleClear}
      footer={
        <div className="flex w-full gap-2">
          <Button 
            variant="secondary" 
            onClick={() => handleSubmit(false)} 
            loading={createMutation.isPending} 
            className="flex-1"
          >
            Save & Next
          </Button>
          <Button 
            variant="primary" 
            onClick={() => handleSubmit(true)} 
            loading={createMutation.isPending} 
            className="flex-1"
          >
            Save & Close
          </Button>
        </div>
      }
    >
      <div className={styles.drawerContent}>
        {presets && presets.length > 0 && (
          <div className={styles.quickPresetBar}>
            <div className={styles.zapIcon}>
              <Zap size={14} />
            </div>
            <span className={styles.presetLabel}>Quick Preset:</span>
            <select
              onChange={(e) => {
                const pr = presets.find(p => p.id === e.target.value);
                if (pr) {
                  const prAmount = pr.configuration?.amount ?? pr.amount;
                  if (prAmount) setAmount(String(prAmount));
                  const prPurpose = formatSmartPurpose(pr.configuration?.purpose || pr.purpose || '');
                  if (prPurpose) setPurpose(prPurpose);
                  toast.success(`Applied preset "${pr.name}"`);
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>Select Preset to Pre-fill...</option>
              {presets.map(p => (
                <option key={p.id} value={p.id}>{p.name} (₹{p.configuration?.amount ?? p.amount ?? 0})</option>
              ))}
            </select>
          </div>
        )}

        <StudentSearch 
          key={resetKey}
          label="Student" 
          placeholder="Search student by name or ID..." 
          onSelect={(student) => setSelectedStudent(student)} 
          initialStudentId={initialStudentId}
        />
        <Input 
          label="Amount (₹)" 
          placeholder="0.00" 
          type="number" 
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus={!!initialStudentId}
        />
        <Input label="Purpose" placeholder="e.g. Zakaath, Monthly Allowance" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
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
            <span className="font-medium">After Deposit</span>
            <span className={clsx(styles.previewValue, afterBalance < 0 ? styles.negative : styles.positive)}>
              ₹{afterBalance.toLocaleString()}
            </span>
          </div>
          <div className={clsx(styles.previewRow, styles.impactRow)}>
            <span className={styles.previewLabelText}>Balance Impact</span>
            <span className={clsx(styles.impactValue, styles.success)}>+₹{depositAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </DrawerLayout>
  );
};
