import React, { useState } from 'react';
import { DrawerLayout } from './DrawerLayout';
import { Landmark, UserPlus, Users, Phone, Calendar, FileText, Info } from 'lucide-react';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { BorrowerSearch } from '../../ui/BorrowerSearch';
import { Badge } from '../../ui/Badge';
import styles from './DrawerStyles.module.scss';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { borrowerService } from '../../../lib/services';
import toast from 'react-hot-toast';

export const ExternalLoanDrawer: React.FC<{ onClose: () => void; initialBorrowerId?: string }> = ({ onClose, initialBorrowerId }) => {
  const [isNewBorrower, setIsNewBorrower] = useState(false);
  const [selectedBorrower, setSelectedBorrower] = useState<any>(null);
  
  // Form State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [repaymentDate, setRepaymentDate] = useState('');
  const [resetKey, setResetKey] = useState(0);

  const queryClient = useQueryClient();

  const loanMutation = useMutation({
    mutationFn: async () => {
      let borrowerId = selectedBorrower?.id;

      if (isNewBorrower) {
        const newBorrower = await borrowerService.create({
          name: newName,
          phone: newPhone,
          risk_level: riskLevel,
          status: 'active'
        });
        borrowerId = newBorrower.id;
      }

      if (!borrowerId) throw new Error('No borrower selected');

      await borrowerService.createLoan({
        borrower_id: borrowerId,
        loan_amount: parseFloat(amount),
        loan_date: new Date().toISOString().split('T')[0],
        purpose: purpose,
        status: 'active'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrowers'] });
      queryClient.invalidateQueries({ queryKey: ['borrower'] });
      queryClient.invalidateQueries({ queryKey: ['transferSummary'] });
      queryClient.invalidateQueries({ queryKey: ['recentOperations'] });
      queryClient.invalidateQueries({ queryKey: ['todaySummary'] });
      queryClient.invalidateQueries({ queryKey: ['systemNotifications'] });
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const handleClear = () => {
    setIsNewBorrower(false);
    setSelectedBorrower(null);
    setNewName('');
    setNewPhone('');
    setAmount('');
    setPurpose('');
    setResetKey(prev => prev + 1);
  };

  const handleSubmit = React.useCallback((shouldClose: boolean = true) => {
    if (isNewBorrower && !newName) return toast.error('Please enter borrower name');
    if (!isNewBorrower && !selectedBorrower) return toast.error('Please select a borrower');
    if (!amount || parseFloat(amount) <= 0) return toast.error('Please enter a valid amount');
    
    loanMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('External loan recorded successfully');
        if (shouldClose) {
          onClose();
        } else {
          handleClear();
        }
      }
    });
  }, [isNewBorrower, newName, selectedBorrower, amount, loanMutation, onClose]);

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

  return (
    <DrawerLayout
      title="External Loan"
      subtitle="Issue capital to outside borrowers or staff"
      icon={<Landmark className="text-white" />}
      onClose={onClose}
      onClear={handleClear}
      footer={
        <div className="flex w-full gap-2">
          <Button 
            variant="secondary" 
            onClick={() => handleSubmit(false)} 
            loading={loanMutation.isPending} 
            className="flex-1"
          >
            Save & Next
          </Button>
          <Button 
            variant="primary" 
            onClick={() => handleSubmit(true)} 
            loading={loanMutation.isPending} 
            className="flex-1"
          >
            Save & Close
          </Button>
        </div>
      }
    >
      <div className={styles.drawerContent}>
        {/* Step 1: Identity Selection */}
        <section className="flex flex-col gap-4">
          <div className={styles.stepHeader}>
            <span className={styles.stepCircle}>1</span>
            Borrower Identity
          </div>
          
          <div className={styles.statusToggle}>
            <Button 
              onClick={() => setIsNewBorrower(false)}
              variant={!isNewBorrower ? 'primary' : 'ghost'}
              size="sm"
              icon={<Users size={14} />}
            >
              Registered
            </Button>
            <Button 
              onClick={() => setIsNewBorrower(true)}
              variant={isNewBorrower ? 'primary' : 'ghost'}
              size="sm"
              icon={<UserPlus size={14} />}
            >
              New Profile
            </Button>
          </div>

          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            {isNewBorrower ? (
              <div className="flex flex-col gap-4 p-5 rounded-2xl border border-dashed border-primary/30 bg-primary-soft/5">
                <Input label="Borrower Name" placeholder="Full legal name..." value={newName} onChange={e => setNewName(e.target.value)} />
                <Input label="Phone Number" placeholder="+91 ..." value={newPhone} onChange={e => setNewPhone(e.target.value)} icon={<Phone size={16} />} />
                
                <div className={styles.statusGroup}>
                  <label className={styles.statusLabel}>Credit Risk Level</label>
                  <div className={styles.statusToggle}>
                    {['low', 'medium', 'high'].map((level) => (
                      <Button
                        key={level}
                        size="sm"
                        variant={riskLevel === level ? 'primary' : 'ghost'}
                        onClick={() => setRiskLevel(level as any)}
                      >
                        {level.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <BorrowerSearch 
                key={resetKey}
                label="Registered Borrower" 
                placeholder="Search by name..." 
                onSelect={setSelectedBorrower}
                initialBorrowerId={initialBorrowerId}
              />
            )}
          </div>
        </section>

        {/* Step 2: Loan Terms */}
        <section className="flex flex-col gap-4">
          <div className={styles.stepHeader}>
            <span className={styles.stepCircle}>2</span>
            Loan Terms
          </div>
          
          <div className="flex flex-col gap-5">
            <Input 
              label="Loan Amount (₹)" 
              placeholder="0.00" 
              type="number" 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              icon={<Landmark size={18} className="text-primary" />}
              autoFocus={!!initialBorrowerId}
            />
            
            <Input 
              label="Target Repayment Date" 
              type="date" 
              value={repaymentDate} 
              onChange={e => setRepaymentDate(e.target.value)} 
              icon={<Calendar size={16} />}
            />

            <Input 
              label="Purpose / Reference" 
              placeholder="e.g. Travel Advance, Medical..." 
              value={purpose} 
              onChange={e => setPurpose(e.target.value)} 
              icon={<FileText size={16} />}
            />
          </div>
        </section>

        {/* Visual Impact Summary */}
        <div className={styles.loanImpact}>
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <span className={styles.impactLabel}>Issuing Capital</span>
              <div className={styles.impactAmount}>₹{parseFloat(amount || '0').toLocaleString()}</div>
            </div>
            <Landmark size={24} opacity={0.2} />
          </div>
          
          <div className={styles.impactMeta}>
            <div className={styles.metaRow}>
              <span>Recipient</span>
              <strong>{isNewBorrower ? (newName || 'New Profile') : (selectedBorrower?.name || 'Registered')}</strong>
            </div>
            <div className={styles.metaRow}>
              <span>Credit Risk</span>
              <Badge variant={riskLevel === 'high' ? 'danger' : riskLevel === 'medium' ? 'warning' : 'success'} size="sm" className="bg-white/20 border-none text-white">
                {riskLevel.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>

        <div className={styles.infoBox}>
          <Info size={16} />
          <p>
            Recording this loan will decrease the academy's liquid cash reserves and create an active recovery tracking item. Ensure all documentation is signed.
          </p>
        </div>
      </div>
    </DrawerLayout>
  );
};
