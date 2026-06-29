import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { IndianRupee, Bell, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import styles from '../../pages/transfers/InternalTransfers.module.scss';
import { useQuery } from '@tanstack/react-query';
import { borrowerService } from '../../lib/services';
import { adminService } from '../../lib/adminService';
import { useOperationsDrawer } from '../operations/drawers/OperationsDrawerContext';
import { useBorrowerStatus } from '../../hooks/useBorrowerStatus';
import toast from 'react-hot-toast';

const BorrowerItem: React.FC<{ borrower: any; onRecordRepayment: () => void }> = ({ borrower, onRecordRepayment }) => {
  const { status } = useBorrowerStatus(borrower);

  return (
    <div className={styles.outstandingItem}>
      <div className={styles.outstandingHeader}>
        <div>
          <div className={styles.borrowerName}>{borrower.name}</div>
        </div>
        <Badge variant="danger" size="sm">
          {status}
        </Badge>
      </div>
      
      <div className={styles.outstandingBody}>
        <span className={styles.amountLabel}>Outstanding Balance</span>
        <div className={clsx(styles.amountValue, styles.overdue)}>
          ₹{Number(borrower.total_outstanding).toLocaleString()}
        </div>
      </div>

      <div className={styles.outstandingActions}>
        <Button 
          variant="ghost" 
          size="sm" 
          icon={<IndianRupee size={14} />} 
          onClick={onRecordRepayment}
          title="Record Repayment"
        />
        <Button 
          variant="ghost" 
          size="sm" 
          icon={<Bell size={14} />} 
          onClick={() => {
            const phone = borrower.phone?.replace(/[^0-9]/g, '') || '';
            const message = `*ZAINUSSUNNA LEDGER SYSTEM*
*LOAN STATEMENT & INVOICE*
━━━━━━━━━━━━━━━━━━━━━━━
*Date:* ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
*Borrower:* ${borrower.name}
${borrower.phone ? `*Phone:* ${borrower.phone}` : ''}

*Financial Standing:*
• Outstanding Balance: *₹${Number(borrower.total_outstanding).toLocaleString('en-IN')}*
• Account Status: *⚠️ OVERDUE / ACTION REQUIRED*

━━━━━━━━━━━━━━━━━━━━━━━
Please arrange to deposit the recovery amount or process your repayment online at:
🌐 https://zls.zainussunna.org/pay

_Thank you for your cooperation!_
━━━━━━━━━━━━━━━━━━━━━━━`;
            
            if (!phone) {
              toast.error('No phone number provided. Opening general WhatsApp share...');
              window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
              return;
            }

            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
          }}
          title="Send WhatsApp Reminder"
        />
      </div>
    </div>
  );
};

export const OutstandingCenter: React.FC = () => {
  const { openDrawer } = useOperationsDrawer();

  const { data: settings = [] } = useQuery({
    queryKey: ['settings'],
    queryFn: adminService.getSettings,
  });

  const { data: borrowers = [] } = useQuery({
    queryKey: ['borrowers'],
    queryFn: borrowerService.list,
  });

  const reversalLimitSetting = settings.find(s => s.key === 'reversal_limit_days');
  const limitDays = reversalLimitSetting ? Number(reversalLimitSetting.value) : 30;

  // Filter borrowers to only include those that are actually overdue
  const overdueBorrowers = borrowers.filter((b: any) => {
    if (b.total_outstanding <= 0) return false;
    
    // Find last recovery date
    let lastRecoveryDate: Date | null = null;
    if (b.last_recovery_at) {
      lastRecoveryDate = new Date(b.last_recovery_at);
    } else {
      const allRecoveries = (b.borrower_loans || []).flatMap((l: any) => l.recoveries || []);
      if (allRecoveries.length > 0) {
        lastRecoveryDate = allRecoveries.reduce((max: Date, r: any) => {
          const d = new Date(r.created_at || r.recovery_date);
          return d > max ? d : max;
        }, new Date(0));
      }
    }

    // Find first loan date
    let firstLoanDate: Date | null = null;
    const activeLoans = (b.borrower_loans || []).filter((l: any) => l.status === 'active');
    if (activeLoans.length > 0) {
      firstLoanDate = activeLoans.reduce((min: Date, l: any) => {
        const d = new Date(l.loan_date);
        return d < min ? d : min;
      }, new Date());
    }

    const countdownStartDate = lastRecoveryDate || firstLoanDate;
    if (!countdownStartDate) return false;

    const diffInDays = (new Date().getTime() - countdownStartDate.getTime()) / (1000 * 3600 * 24);
    return diffInDays > limitDays;
  });

  return (
    <Card padding="lg">
      <div className={styles.sectionHeader}>
        <div className="flex items-center gap-2">
          <AlertCircle size={18} className="text-danger" />
          <h3 className={styles.sectionTitle}>Overdue Accounts</h3>
        </div>
      </div>

      <div className={styles.outstandingGrid}>
        {overdueBorrowers.map(b => (
          <BorrowerItem 
            key={b.id} 
            borrower={b} 
            onRecordRepayment={() => openDrawer('recovery', { studentId: b.id })}
          />
        ))}
        {overdueBorrowers.length === 0 && (
          <div className="text-center p-8 text-muted text-sm w-full">
            No overdue accounts. All borrowers are compliant!
          </div>
        )}
      </div>
    </Card>
  );
};
