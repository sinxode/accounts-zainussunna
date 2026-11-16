import React, { useState } from 'react';
import { DrawerLayout } from './DrawerLayout';
import { ArrowLeftRight, ArrowDownUp } from 'lucide-react';
import { Input } from '../../ui/Input';
import { AmountInput } from '../../ui/AmountInput';
import { Button } from '../../ui/Button';
import { StudentSearch } from '../../ui/StudentSearch';
import toast from 'react-hot-toast';
import { transactionService } from '../../../lib/services';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './DrawerStyles.module.scss';
import { clsx } from 'clsx';

export const InternalTransferDrawer: React.FC<{ isOpen?: boolean; onClose: () => void }> = ({ onClose }) => {
  const [fromStudent, setFromStudent] = useState<any>(null);
  const [toStudent, setToStudent] = useState<any>(null);
  const [amount, setAmount] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [txDate, setTxDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [resetKey, setResetKey] = useState(0);
  
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const createMutation = useMutation({
    mutationFn: transactionService.createInternalTransferAtomic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internalTransfers'] });
      queryClient.invalidateQueries({ queryKey: ['recentOperations'] });
      queryClient.invalidateQueries({ queryKey: ['todaySummary'] });
      queryClient.invalidateQueries({ queryKey: ['studentsSummary'] });
      queryClient.invalidateQueries({ queryKey: ['transactionsUnified'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to process transfer: ${error.message}`);
    }
  });

  const handleClear = () => {
    setFromStudent(null);
    setToStudent(null);
    setAmount('');
    setPurpose('');
    setResetKey(prev => prev + 1);
  };

  const handleSwap = () => {
    const temp = fromStudent;
    setFromStudent(toStudent);
    setToStudent(temp);
  };

  const parsedAmount = parseFloat(amount) || 0;
  const isSameStudent = fromStudent && toStudent && fromStudent.id === toStudent.id;
  const isValid = fromStudent && toStudent && !isSameStudent && parsedAmount > 0;

  const handleSubmit = React.useCallback((shouldClose: boolean = true) => {
    if (!fromStudent || !toStudent || parsedAmount <= 0) {
      toast.error('Please select both student accounts and enter a valid amount');
      return;
    }
    if (fromStudent.id === toStudent.id) {
      toast.error('Cannot transfer to the same student');
      return;
    }

    const operationId = crypto.randomUUID();

    createMutation.mutate({
      from_student_id: fromStudent.id,
      to_student_id: toStudent.id,
      amount: parsedAmount,
      purpose: `Transfer: ${purpose || 'Internal Funds'}`,
      operation_id: operationId
    }, {
      onSuccess: () => {
        toast.success(`Transferred ₹${parsedAmount.toLocaleString('en-IN')} successfully`);
        if (shouldClose) {
          onClose();
        } else {
          handleClear();
        }
      }
    });
  }, [fromStudent, toStudent, parsedAmount, purpose, user, createMutation, onClose]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
        if (target && target.tagName === 'INPUT' && (target as HTMLInputElement).placeholder?.toLowerCase().includes('select')) return;
        e.preventDefault();
        handleSubmit(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit]);

  const fromCurrent = fromStudent?.current_balance || 0;
  const toCurrent = toStudent?.current_balance || 0;
  const fromAfter = fromCurrent - parsedAmount;
  const toAfter = toCurrent + parsedAmount;

  const submitLabel = parsedAmount > 0 
    ? `Transfer ₹${parsedAmount.toLocaleString('en-IN')}`
    : 'Transfer Funds';

  return (
    <DrawerLayout
      title="Internal Transfer"
      icon={<ArrowLeftRight className="text-info" />}
      onClose={onClose}
      onClear={handleClear}
      footer={
        <div style={{ display: 'flex', width: '100%', gap: '8px' }}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={() => handleSubmit(true)} 
            loading={createMutation.isPending} 
            disabled={!isValid}
            fullWidth
          >
            {submitLabel}
          </Button>
        </div>
      }
    >
      <div className={styles.drawerContent}>
        {/* Hero Amount Input */}
        <AmountInput 
          label="Transfer Amount" 
          placeholder="0" 
          value={amount}
          onChange={(val) => setAmount(val)}
          autoFocus
        />

        {/* Transfer From / To Flow with Swap Button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <StudentSearch 
            key={`from-${resetKey}`}
            label="From Account (Debit)" 
            placeholder="Select sender student..." 
            onSelect={(student) => setFromStudent(student)} 
          />

          <div style={{ display: 'flex', justifyContent: 'center', margin: '2px 0' }}>
            <button 
              type="button" 
              onClick={handleSwap}
              disabled={!fromStudent && !toStudent}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                color: 'var(--green-700)',
                cursor: 'pointer'
              }}
              title="Swap accounts"
            >
              <ArrowDownUp size={16} />
            </button>
          </div>

          <StudentSearch 
            key={`to-${resetKey}`}
            label="To Account (Credit)" 
            placeholder="Select receiver student..." 
            onSelect={(student) => setToStudent(student)} 
          />
        </div>

        {isSameStudent && (
          <div style={{ color: 'var(--debit)', fontSize: '12px', fontWeight: 500, textAlign: 'center' }}>
            Source and destination account cannot be the same!
          </div>
        )}

        <Input 
          label="Purpose / Memo" 
          placeholder="e.g. Loan, Fee Settlement, Book adjustment" 
          value={purpose} 
          onChange={(e) => setPurpose(e.target.value)} 
        />

        <Input 
          label="Date" 
          type="date"
          value={txDate} 
          onChange={(e) => setTxDate(e.target.value)} 
        />

        {/* Live Preview (Spec 5.2) */}
        {fromStudent && toStudent && !isSameStudent && (
          <div className={styles.balancePreview}>
            <div className={styles.previewLabel}>Transfer Impact Preview</div>
            <div className={styles.previewRow}>
              <span className={styles.previewLabelText}>{fromStudent.name} (After)</span>
              <span className={clsx(styles.previewValue, fromAfter < 0 ? styles.negative : styles.positive)}>
                ₹{fromAfter.toLocaleString('en-IN')}
              </span>
            </div>
            <div className={clsx(styles.previewRow, styles.afterRow)}>
              <span className={styles.previewLabelText}>{toStudent.name} (After)</span>
              <span className={clsx(styles.previewValue, toAfter < 0 ? styles.negative : styles.positive)}>
                ₹{toAfter.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}
      </div>
    </DrawerLayout>
  );
};
