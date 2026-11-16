import React, { useState } from 'react';
import { DrawerLayout } from './DrawerLayout';
import { ArrowDownLeft, ArrowUpRight, Zap } from 'lucide-react';
import { Input } from '../../ui/Input';
import { AmountInput } from '../../ui/AmountInput';
import { Button } from '../../ui/Button';
import { PillTabs } from '../../ui/PillTabs';
import { StudentSearch } from '../../ui/StudentSearch';
import styles from './DrawerStyles.module.scss';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { transactionService, studentService, presetService } from '../../../lib/services';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { formatSmartPurpose } from '../../../lib/utils';

export const DepositDrawer: React.FC<{ 
  onClose: () => void; 
  initialStudentId?: string;
  initialType?: 'deposit' | 'withdrawal';
}> = ({ onClose, initialStudentId, initialType = 'deposit' }) => {
  const [txType, setTxType] = useState<'deposit' | 'withdrawal'>(initialType);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [amount, setAmount] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [txDate, setTxDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [resetKey, setResetKey] = useState(0);
  const idempotencyKeyRef = React.useRef<string>(crypto.randomUUID());
  
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
      queryClient.invalidateQueries({ queryKey: ['studentsSummary'] });
      queryClient.invalidateQueries({ queryKey: ['daily-summary'] });
      queryClient.invalidateQueries({ queryKey: ['recent-transactions-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['student-health-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactionsUnified'] });
      if (selectedStudent?.id) {
        queryClient.invalidateQueries({ queryKey: ['student', selectedStudent.id] });
        queryClient.invalidateQueries({ queryKey: ['studentTransactions', selectedStudent.id] });
      }
    },
    onError: (error: any) => {
      toast.error(`Failed to process ${txType}: ${error.message}`);
    }
  });

  const handleClear = () => {
    setSelectedStudent(null);
    setAmount('');
    setPurpose('');
    setNotes('');
    setResetKey(prev => prev + 1);
    idempotencyKeyRef.current = crypto.randomUUID();
  };

  const isDeposit = txType === 'deposit';
  const parsedAmount = parseFloat(amount) || 0;
  const currentBalance = selectedStudent?.current_balance || 0;
  const afterBalance = isDeposit ? currentBalance + parsedAmount : currentBalance - parsedAmount;

  const handleSubmit = React.useCallback((shouldClose: boolean = true) => {
    if (!selectedStudent) {
      toast.error('Please select a student');
      return;
    }
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error(`Please enter a valid positive ${txType} amount`);
      return;
    }
    if (parsedAmount !== Math.round(parsedAmount * 100) / 100) {
      toast.error('Amount cannot have more than 2 decimal places');
      return;
    }
    if (!purpose.trim()) {
      toast.error(`Please enter a purpose for the ${txType}`);
      return;
    }
    const actorId = user?.id || 'dev-admin-id';

    createMutation.mutate({
      student_id: selectedStudent.id,
      transaction_type: txType,
      direction: isDeposit ? 'credit' : 'debit',
      amount: parsedAmount,
      purpose: purpose.trim() + (notes.trim() ? ` (${notes.trim()})` : ''),
      idempotency_key: idempotencyKeyRef.current,
      created_by: actorId
    }, {
      onSuccess: () => {
        toast.success(`${isDeposit ? 'Deposit' : 'Withdrawal'} of ₹${parsedAmount.toLocaleString('en-IN')} recorded`);
        if (shouldClose) {
          onClose();
        } else {
          handleClear();
        }
      }
    });
  }, [selectedStudent, amount, parsedAmount, purpose, notes, user, createMutation, onClose, txType, isDeposit]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
        if (target && target.tagName === 'INPUT' && (target as HTMLInputElement).placeholder?.toLowerCase().includes('search')) return;
        e.preventDefault();
        handleSubmit(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit]);

  const submitLabel = parsedAmount > 0 
    ? `${isDeposit ? 'Deposit' : 'Withdraw'} ₹${parsedAmount.toLocaleString('en-IN')}`
    : (isDeposit ? 'Deposit' : 'Withdraw');

  return (
    <DrawerLayout
      title={isDeposit ? "Record Deposit" : "Record Withdrawal"}
      icon={isDeposit ? <ArrowDownLeft className="text-success" /> : <ArrowUpRight className="text-danger" />}
      onClose={onClose}
      onClear={handleClear}
      footer={
        <div style={{ display: 'flex', width: '100%', gap: '8px' }}>
          <Button 
            variant="ghost" 
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={() => handleSubmit(true)} 
            loading={createMutation.isPending} 
            disabled={!selectedStudent || parsedAmount <= 0 || !purpose.trim()}
            fullWidth
          >
            {submitLabel}
          </Button>
        </div>
      }
    >
      <div className={styles.drawerContent}>
        {/* Type Switcher (Spec 5.1) */}
        <PillTabs
          variant="lime"
          fullWidth
          value={txType}
          onChange={(val) => setTxType(val as 'deposit' | 'withdrawal')}
          options={[
            { value: 'deposit', label: 'Deposit (Money In)', icon: <ArrowDownLeft size={16} /> },
            { value: 'withdrawal', label: 'Withdraw (Money Out)', icon: <ArrowUpRight size={16} /> },
          ]}
        />

        {/* Hero Amount Input (Spec 5.1) */}
        <AmountInput 
          label={`${isDeposit ? 'Deposit' : 'Withdrawal'} Amount`} 
          placeholder="0" 
          value={amount}
          onChange={(val) => setAmount(val)}
          autoFocus={!!initialStudentId}
        />

        {/* Student Selector */}
        <StudentSearch 
          key={resetKey}
          label="Student Ledger" 
          placeholder="Search student by name or ID..." 
          onSelect={(student) => setSelectedStudent(student)} 
          initialStudentId={initialStudentId}
        />

        {/* Quick Purpose / Presets */}
        {presets && presets.length > 0 && (
          <div className={styles.quickPresetBar}>
            <div className={styles.zapIcon}>
              <Zap size={14} />
            </div>
            <span className={styles.presetLabel}>Quick Presets:</span>
            <div className={styles.presetChips}>
              {presets.slice(0, 4).map(p => (
                <button
                  key={p.id}
                  type="button"
                  className={styles.presetChip}
                  onClick={() => {
                    const prAmount = p.configuration?.amount ?? p.amount;
                    if (prAmount) setAmount(String(prAmount));
                    const prPurpose = formatSmartPurpose(p.configuration?.purpose || p.purpose || '');
                    if (prPurpose) setPurpose(prPurpose);
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <Input 
          label="Purpose" 
          placeholder="e.g. Zakaath, Monthly Allowance, Mess Fee" 
          value={purpose} 
          onChange={(e) => setPurpose(e.target.value)} 
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input 
            label="Transaction Date" 
            type="date"
            value={txDate} 
            onChange={(e) => setTxDate(e.target.value)} 
          />
          <Input 
            label="Optional Note" 
            placeholder="Receipt / Voucher # / Note" 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
          />
        </div>
        
        {/* Live Balance Preview (Spec 5.1) */}
        {selectedStudent && (
          <div className={styles.balancePreview}>
            <div className={styles.previewLabel}>Ledger Impact</div>
            <div className={styles.previewRow}>
              <span className={styles.previewLabelText}>Current Balance</span>
              <span className={clsx(styles.previewValue, currentBalance < 0 ? styles.negative : styles.positive)}>
                ₹{currentBalance.toLocaleString('en-IN')}
              </span>
            </div>
            <div className={clsx(styles.previewRow, styles.afterRow)}>
              <span className="font-medium">Balance After {isDeposit ? 'Deposit' : 'Withdrawal'}</span>
              <span className={clsx(styles.previewValue, afterBalance < 0 ? styles.negative : styles.positive)}>
                ₹{afterBalance.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}
      </div>
    </DrawerLayout>
  );
};
