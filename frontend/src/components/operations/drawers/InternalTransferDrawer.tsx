import React, { useState } from 'react';
import { DrawerLayout } from './DrawerLayout';
import { ArrowLeftRight } from 'lucide-react';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { StudentSearch } from '../../ui/StudentSearch';
import summaryStyles from '../../ui/SummaryNote.module.scss';
import toast from 'react-hot-toast';
import { transactionService } from '../../../lib/services';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { clsx } from 'clsx';

export const InternalTransferDrawer: React.FC<{ isOpen?: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [fromStudent, setFromStudent] = useState<any>(null);
  const [toStudent, setToStudent] = useState<any>(null);
  const [amount, setAmount] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
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

  const handleSubmit = (shouldClose: boolean = true) => {
    if (!fromStudent || !toStudent || !amount || parseFloat(amount) <= 0) {
      toast.error('Please select both students and enter a valid amount');
      return;
    }
    if (fromStudent.id === toStudent.id) {
      toast.error('Cannot transfer to the same student');
      return;
    }
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    const transferAmount = parseFloat(amount);
    const operationId = crypto.randomUUID();

    createMutation.mutate({
      from_student_id: fromStudent.id,
      to_student_id: toStudent.id,
      amount: transferAmount,
      purpose: `Transfer: ${purpose || 'Internal Funds'}`,
      operation_id: operationId,
      created_by: user.id
    }, {
      onSuccess: () => {
        toast.success('Transfer processed successfully');
        if (shouldClose) {
          onClose();
        } else {
          handleClear();
        }
      }
    });
  };

  const lenderBalance = fromStudent?.current_balance || 0;
  const borrowerBalance = toStudent?.current_balance || 0;
  const transferAmount = parseFloat(amount) || 0;

  return (
    <DrawerLayout
      title="Internal Transfer"
      subtitle="Transfer funds between two students"
      icon={<ArrowLeftRight className="text-white" />}
      isOpen={isOpen}
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
      <div className="flex flex-col gap-6">
        <StudentSearch key={`lender-${resetKey}`} label="Lender (From)" placeholder="Search student..." onSelect={setFromStudent} />
        <StudentSearch key={`borrower-${resetKey}`} label="Borrower (To)" placeholder="Search student..." onSelect={setToStudent} />
        <Input label="Amount (₹)" placeholder="0.00" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Input label="Purpose" placeholder="e.g. Borrowed for trip" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
        
        <div className={summaryStyles.grid}>
          <div className={summaryStyles.summaryNote}>
            <div className="text-xs font-bold text-muted uppercase mb-2">Lender (From) Impact</div>
            <div className="flex justify-between text-sm mb-1">
              <span>Current</span>
              <span className="font-bold">₹{lenderBalance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-danger mb-1">
              <span>Debit</span>
              <span className="font-bold">-₹{transferAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-border pt-1 mt-1">
              <span>New</span>
              <span className={clsx("font-bold", (lenderBalance - transferAmount) < 0 ? 'text-red-500' : 'text-green-600')}>
                ₹{(lenderBalance - transferAmount).toLocaleString()}
              </span>
            </div>
          </div>

          <div className={summaryStyles.summaryNote}>
            <div className="text-xs font-bold text-muted uppercase mb-2">Borrower (To) Impact</div>
            <div className="flex justify-between text-sm mb-1">
              <span>Current</span>
              <span className="font-bold">₹{borrowerBalance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-success mb-1">
              <span>Credit</span>
              <span className="font-bold">+₹{transferAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-border pt-1 mt-1">
              <span>New</span>
              <span className="font-bold text-green-600">
                ₹{(borrowerBalance + transferAmount).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </DrawerLayout>
  );
};
