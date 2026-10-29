import React, { useState, useRef, useMemo } from 'react';
import { DrawerLayout } from './DrawerLayout';
import { ArrowLeftRight, CheckCircle2, Info } from 'lucide-react';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import summaryStyles from '../../ui/SummaryNote.module.scss';
import toast from 'react-hot-toast';
import { transactionService } from '../../../lib/services';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '../../../lib/utils';
import { clsx } from 'clsx';

interface InternalRepaymentDrawerProps {
  isOpen?: boolean;
  onClose: () => void;
  initialLoanId?: string;
}

export const InternalRepaymentDrawer: React.FC<InternalRepaymentDrawerProps> = ({ 
  onClose, 
  initialLoanId 
}) => {
  const queryClient = useQueryClient();
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());

  const [selectedLoanId, setSelectedLoanId] = useState<string>(initialLoanId || '');
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('Repayment of internal student loan');

  // Fetch active internal loans
  const { data: loans = [], isLoading: loansLoading } = useQuery({
    queryKey: ['internalLoans'],
    queryFn: () => transactionService.listInternalLoans()
  });

  const activeLoans = useMemo(() => {
    return loans.filter((l: any) => l.status === 'active' && Number(l.outstanding_amount) > 0);
  }, [loans]);

  // Selected loan
  const selectedLoan = useMemo(() => {
    if (selectedLoanId) {
      return loans.find((l: any) => l.id === selectedLoanId) || null;
    }
    if (activeLoans.length === 1) {
      return activeLoans[0];
    }
    return null;
  }, [loans, activeLoans, selectedLoanId]);

  const outstanding = selectedLoan ? Number(selectedLoan.outstanding_amount) : 0;
  const numAmount = parseFloat(amount || '0');
  const remainingAfter = Math.max(0, outstanding - (isNaN(numAmount) ? 0 : numAmount));

  const repaymentMutation = useMutation({
    mutationFn: (args: { loan_id: string; amount: number; notes: string; idempotency_key: string }) =>
      transactionService.repayInternalLoan(args),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internalLoans'] });
      queryClient.invalidateQueries({ queryKey: ['internalTransfers'] });
      queryClient.invalidateQueries({ queryKey: ['transferSummary'] });
      queryClient.invalidateQueries({ queryKey: ['studentsSummary'] });
      queryClient.invalidateQueries({ queryKey: ['student-health-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['todaySummary'] });
      toast.success('Internal loan repayment recorded successfully');
      handleClear();
      onClose();
    },
    onError: (err: any) => {
      toast.error(`Repayment failed: ${err.message}`);
    }
  });

  const handleClear = () => {
    idempotencyKeyRef.current = crypto.randomUUID();
    setAmount('');
    setNotes('Repayment of internal student loan');
    if (!initialLoanId) setSelectedLoanId('');
  };

  const handleFullRepayment = () => {
    if (selectedLoan) {
      setAmount(outstanding.toFixed(2));
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!selectedLoan) {
      toast.error('Please select an active internal loan to repay');
      return;
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid repayment amount greater than zero');
      return;
    }

    const decimalParts = amount.split('.');
    if (decimalParts[1] && decimalParts[1].length > 2) {
      toast.error('Amount cannot have more than 2 decimal places');
      return;
    }

    if (numAmount > outstanding) {
      toast.error(`Repayment amount cannot exceed the outstanding balance of ${formatCurrency(outstanding)}`);
      return;
    }

    repaymentMutation.mutate({
      loan_id: selectedLoan.id,
      amount: numAmount,
      notes: notes.trim(),
      idempotency_key: idempotencyKeyRef.current
    });
  };

  return (
    <DrawerLayout
      title="Record Internal Loan Repayment"
      subtitle="Settle peer-to-peer student loan obligations"
      icon={<ArrowLeftRight className="text-white" size={20} />}
      onClose={onClose}
      onClear={handleClear}
      footer={
        <div className="flex gap-2 w-full">
          <Button 
            variant="ghost" 
            fullWidth 
            onClick={onClose}
            disabled={repaymentMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            fullWidth 
            onClick={() => handleSubmit()}
            disabled={repaymentMutation.isPending || !selectedLoan || numAmount <= 0 || numAmount > outstanding}
          >
            {repaymentMutation.isPending ? 'Processing...' : 'Confirm Repayment'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        {/* Loan Selection */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 block">
            Select Active Internal Loan
          </label>
          {loansLoading ? (
            <div className="text-xs text-gray-400 p-2">Loading active loans...</div>
          ) : activeLoans.length === 0 ? (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm text-gray-500">
              No active internal loans found requiring repayment.
            </div>
          ) : (
            <select
              value={selectedLoanId}
              onChange={(e) => {
                setSelectedLoanId(e.target.value);
                setAmount('');
              }}
              className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]"
            >
              <option value="">-- Choose an active loan --</option>
              {activeLoans.map((l: any) => (
                <option key={l.id} value={l.id}>
                  {l.borrower_name} owes {l.lender_name} ({formatCurrency(Number(l.outstanding_amount))} remaining)
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Selected Loan Details Card */}
        {selectedLoan && (
          <Card padding="md" className="bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Loan Summary</span>
              <Badge variant="warning" size="sm">Active Loan</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs mb-3">
              <div>
                <span className="text-gray-400 block">Lender (Creditor)</span>
                <span className="font-semibold text-gray-900">{selectedLoan.lender_name}</span>
                <span className="text-[11px] text-gray-400 font-mono block">
                  {selectedLoan.lender?.enrolment_no}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block">Borrower (Debtor)</span>
                <span className="font-semibold text-gray-900">{selectedLoan.borrower_name}</span>
                <span className="text-[11px] text-gray-400 font-mono block">
                  {selectedLoan.borrower?.enrolment_no}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-xs">
              <div>
                <span className="text-gray-500">Original Principal:</span>
                <span className="font-mono font-medium ml-1">
                  {formatCurrency(Number(selectedLoan.principal_amount))}
                </span>
              </div>
              <div>
                <span className="text-gray-700 font-semibold">Remaining Due:</span>
                <span className="font-mono font-bold text-amber-700 ml-1">
                  {formatCurrency(outstanding)}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Repayment Amount */}
        {selectedLoan && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Repayment Amount (₹)
              </label>
              <button
                type="button"
                onClick={handleFullRepayment}
                className="text-xs text-[#1E3A5F] hover:underline font-semibold"
              >
                Full Repayment ({formatCurrency(outstanding)})
              </button>
            </div>
            <Input 
              type="number"
              step="0.01"
              min="0.01"
              max={outstanding}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {/* Notes / Settlement Reference */}
        {selectedLoan && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1 block">
              Repayment Notes / Settlement Reference
            </label>
            <Input 
              type="text"
              placeholder="e.g. Settled in cash at campus office"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        )}

        {/* Live Calculation Preview */}
        {selectedLoan && numAmount > 0 && (
          <div className={clsx(summaryStyles.note, remainingAfter === 0 ? summaryStyles.success : summaryStyles.info)}>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>Remaining Balance After Payment:</span>
              <span className="font-mono text-sm">{formatCurrency(remainingAfter)}</span>
            </div>
            {remainingAfter === 0 ? (
              <span className="text-[11px] text-emerald-700 flex items-center gap-1 mt-1">
                <CheckCircle2 size={12} /> Loan will be marked as fully settled.
              </span>
            ) : (
              <span className="text-[11px] text-blue-700 flex items-center gap-1 mt-1">
                <Info size={12} /> Partial repayment: loan remains active for remaining balance.
              </span>
            )}
          </div>
        )}

        {/* Accounting Decision Explanatory Note */}
        <div className="text-[11px] text-gray-400 bg-gray-50 p-2.5 rounded border border-gray-200 mt-2">
          <strong>Ledger Invariant Note:</strong> Repayments are recorded atomically into the audit trail and internal loan sub-ledger without mutating or deleting historical loan transactions.
        </div>

      </form>
    </DrawerLayout>
  );
};
