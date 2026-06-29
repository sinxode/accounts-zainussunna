import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../lib/adminService';

export const useBorrowerStatus = (borrower: any) => {
  const { data: settings = [] } = useQuery({
    queryKey: ['settings'],
    queryFn: adminService.getSettings,
  });

  // Calculate last recovery date across borrower's loans
  const lastRecoveryDate = useMemo(() => {
    if (!borrower) return null;
    if (borrower.last_recovery_at) {
      return new Date(borrower.last_recovery_at);
    }
    
    const loans = borrower.borrower_loans || [];
    const allRecoveries = loans.flatMap((l: any) => l.recoveries || []);
    if (allRecoveries.length > 0) {
      return allRecoveries.reduce((max: Date, r: any) => {
        const d = new Date(r.created_at || r.recovery_date);
        return d > max ? d : max;
      }, new Date(0));
    }
    
    return null;
  }, [borrower]);

  // Calculate first loan date across borrower's loans
  const firstLoanDate = useMemo(() => {
    if (!borrower) return null;
    const loans = borrower.borrower_loans || [];
    const activeLoans = loans.filter((l: any) => l.status === 'active');
    if (activeLoans.length > 0) {
      return activeLoans.reduce((min: Date, l: any) => {
        const d = new Date(l.loan_date);
        return d < min ? d : min;
      }, new Date());
    }
    return null;
  }, [borrower]);

  return useMemo(() => {
    const reversalLimitSetting = settings.find(s => s.key === 'reversal_limit_days');
    const limitDays = reversalLimitSetting ? Number(reversalLimitSetting.value) : 30; // Default 30 days
    
    if (!borrower) {
      return { isOverdue: false, status: 'Compliant', lastRecoveryDays: 0, limitDays, isCountdownFromRecovery: false, hasLoans: false };
    }

    // Determine outstanding balance
    const loans = borrower.borrower_loans || [];
    if (loans.length === 0) {
      return { isOverdue: false, status: 'Compliant', lastRecoveryDays: 0, limitDays, isCountdownFromRecovery: false, hasLoans: false };
    }

    const totalLoaned = loans.reduce((sum: number, l: any) => sum + Number(l.loan_amount), 0);
    const allRecoveries = loans.flatMap((l: any) => l.recoveries || []);
    const totalRecovered = allRecoveries.reduce((sum: number, r: any) => sum + Number(r.amount), 0);
    const outstanding = totalLoaned - totalRecovered;

    // If no outstanding balance, they are automatically compliant
    if (outstanding <= 0) {
      return { isOverdue: false, status: 'Compliant', lastRecoveryDays: 0, limitDays, isCountdownFromRecovery: false, hasLoans: true };
    }

    // Determine target countdown start date
    let countdownStartDate: Date | null = null;
    let isCountdownFromRecovery = false;

    if (lastRecoveryDate) {
      countdownStartDate = lastRecoveryDate;
      isCountdownFromRecovery = true;
    } else if (firstLoanDate) {
      countdownStartDate = firstLoanDate;
      isCountdownFromRecovery = false;
    }

    if (!countdownStartDate) {
      return { isOverdue: false, status: 'Compliant', lastRecoveryDays: 0, limitDays, isCountdownFromRecovery: false, hasLoans: true };
    }

    const now = new Date();
    const diffInDays = (now.getTime() - countdownStartDate.getTime()) / (1000 * 3600 * 24);
    const isOverdue = diffInDays > limitDays;

    return {
      isOverdue,
      status: isOverdue ? 'Overdue' : 'Compliant',
      lastRecoveryDays: Math.floor(diffInDays),
      limitDays,
      isCountdownFromRecovery,
      hasLoans: true
    };
  }, [borrower, settings, lastRecoveryDate, firstLoanDate]);
};
