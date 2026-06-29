import { QueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';

export const queryClient = new QueryClient();

export interface StudentHealthSummary {
  id: string;
  name: string;
  enrolment_no: string;
  status: 'active' | 'archived';
  health_status: 'healthy' | 'low' | 'critical' | 'empty' | 'negative';
  current_balance: number;
  last_transaction_date: string | null;
}

export const borrowerService = {
  list: async () => {
    const { data, error } = await supabase
      .from('borrowers')
      .select(`
        *, 
        borrower_loans(
          *, 
          recoveries(
            amount, 
            created_at
          )
        )
      `);
    if (error) throw error;
    
    // Process data to calculate last recovery date per borrower (aggregate across all loans)
    return (data || []).map(b => {
        const allRecoveries = (b.borrower_loans || []).flatMap((loan: any) => loan.recoveries || []);
        const lastRecovery = allRecoveries.length > 0
            ? allRecoveries.reduce((latest: any, current: any) => {
                const latestDate = new Date(latest.created_at);
                const currentDate = new Date(current.created_at);
                return currentDate > latestDate ? current : latest;
            }, allRecoveries[0]).created_at
            : null;
        
        return { 
            ...b, 
            last_recovery_at: lastRecovery,
            total_outstanding: (b.borrower_loans || []).reduce((sum: number, l: any) => sum + Number(l.loan_amount), 0) - (allRecoveries.reduce((sum: number, r: any) => sum + Number(r.amount), 0) || 0)
        };
    });
  },
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('borrowers')
      .select('*, borrower_loans(*, recoveries(*))')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },
  getDashboardStats: async () => {
    const { data, error } = await supabase
      .from('borrower_loan_balances')
      .select('*');
    if (error) throw error;
    
    const stats = {
      outstanding: data.reduce((sum, b) => sum + Number(b.outstanding_amount), 0),
      totalRecoveries: 0,
      activeBorrowers: new Set(data.map(b => b.borrower_id)).size,
    };
    return stats;
  },
  create: async (borrower: any) => {
    const { data, error } = await supabase
      .from('borrowers')
      .insert([borrower])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  createLoan: async (loan: any) => {
    const { data, error } = await supabase
      .from('borrower_loans')
      .insert([loan])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  createRecovery: async (recovery: any) => {
    const { data, error } = await supabase
      .from('recoveries')
      .insert([recovery])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  deleteLoan: async (id: string) => {
    // Delete any associated recovery repayments first to avoid foreign key violations
    const { error: recoveryError } = await supabase
      .from('recoveries')
      .delete()
      .eq('loan_id', id);
    if (recoveryError) throw recoveryError;

    const { error } = await supabase
      .from('borrower_loans')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
  deleteRecovery: async (id: string) => {
    const { error } = await supabase
      .from('recoveries')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

export const studentService = {
  getHealthSummary: async (): Promise<StudentHealthSummary[]> => {
    const { data, error } = await supabase
      .from('student_health')
      .select('*');
    if (error) throw error;
    return (data as unknown as StudentHealthSummary[]) || [];
  },
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('student_health')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },
  getTransactionsByStudentId: async (studentId: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    console.log('Backend Service: Fetched transactions:', data);
    return data || [];
  },
  isFavorite: async (userId: string, studentId: string) => {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('student_id', studentId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },
  toggleFavorite: async (userId: string, studentId: string, isFav: boolean) => {
    if (isFav) {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('student_id', studentId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('user_favorites')
        .insert({ user_id: userId, student_id: studentId });
      if (error) throw error;
    }
  },
  delete: async (id: string) => {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
  listByBatch: async (batchId: string) => {
    const { data, error } = await supabase
      .from('batch_members')
      .select('student_id, students(*)')
      .eq('batch_id', batchId);
    if (error) throw error;
    return data?.map(item => item.students) || [];
  }
};

export const transactionService = {
  list: async (limit = 50) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, students(name, enrolment_no)')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },
  listAllUnified: async (limit = 200): Promise<any[]> => {
    // 1. Fetch Standard Transactions
    const { data: txs, error: txError } = await supabase
      .from('transactions')
      .select('*, students(name, enrolment_no)')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (txError) throw txError;

    // 2. Fetch Borrower Loans
    const { data: loans, error: loanError } = await supabase
      .from('borrower_loans')
      .select('*, borrowers(name)')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (loanError) throw loanError;

    // 3. Fetch Recoveries
    const { data: recoveries, error: recoveryError } = await supabase
      .from('recoveries')
      .select('*, borrower_loans(borrower_id, borrowers(name))')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (recoveryError) throw recoveryError;

    // 4. Unify and Normalize
    const unified: any[] = [
      ...(txs || []).map(t => ({
        id: t.id,
        operation_id: t.operation_id,
        type: t.transaction_type,
        amount: Number(t.amount),
        date: t.transaction_date || t.created_at,
        purpose: t.purpose,
        entity_name: t.students?.name || 'Unknown',
        entity_sub: t.students?.enrolment_no || '-',
        direction: t.direction,
        is_reversed: t.is_reversed,
        student_id: t.student_id,
        raw: t
      })),
      ...(loans || []).map(l => ({
        id: l.id,
        type: 'loan',
        amount: Number(l.loan_amount),
        date: l.created_at,
        purpose: l.purpose || 'External Loan',
        entity_name: l.borrowers?.name || 'External Borrower',
        entity_sub: 'External',
        direction: 'debit',
        is_reversed: false,
        borrower_id: l.borrower_id,
        raw: l
      })),
      ...(recoveries || []).map(r => ({
        id: r.id,
        type: 'recovery',
        amount: Number(r.amount),
        date: r.created_at,
        purpose: r.notes || 'Loan Recovery',
        entity_name: r.borrower_loans?.borrowers?.name || 'External Borrower',
        entity_sub: 'External',
        direction: 'credit',
        is_reversed: false,
        borrower_id: r.borrower_loans?.borrower_id,
        raw: r
      }))
    ];

    return unified
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  },
  listRecentOperations: async (limit = 10): Promise<any[]> => {
    // 1. Fetch Standard Transactions
    const { data: txs, error: txError } = await supabase
      .from('transactions')
      .select('*, students(name, enrolment_no)')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (txError) throw txError;

    // 2. Fetch Borrower Loans
    const { data: loans, error: loanError } = await supabase
      .from('borrower_loans')
      .select('*, borrowers(name)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (loanError) throw loanError;

    // 3. Fetch Recoveries
    const { data: recoveries, error: recoveryError } = await supabase
      .from('recoveries')
      .select('*, borrower_loans(borrower_id, borrowers(name))')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (recoveryError) throw recoveryError;

    // 4. Unify and Normalize
    const unified: any[] = [
      ...(txs || []).map(t => ({
        id: t.id,
        operation_id: t.operation_id,
        type: t.transaction_type,
        amount: Number(t.amount),
        date: t.transaction_date || t.created_at,
        purpose: t.purpose,
        entity_name: t.students?.name || 'Unknown',
        direction: t.direction,
        is_reversed: t.is_reversed,
        raw: t
      })),
      ...(loans || []).map(l => ({
        id: l.id,
        type: 'loan',
        amount: Number(l.loan_amount),
        date: l.created_at,
        purpose: l.purpose || 'External Loan',
        entity_name: l.borrowers?.name || 'External Borrower',
        direction: 'debit',
        is_reversed: false,
        raw: l
      })),
      ...(recoveries || []).map(r => ({
        id: r.id,
        type: 'recovery',
        amount: Number(r.amount),
        date: r.created_at,
        purpose: r.notes || 'Loan Recovery',
        entity_name: r.borrower_loans?.borrowers?.name || 'External Borrower',
        direction: 'credit',
        is_reversed: false,
        raw: r
      }))
    ];

    // 5. Sort and Limit
    return unified
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  },
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, students(name, enrolment_no)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },
  getTodaySummary: async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Fetch Standard Transactions
    const { data: txs, error: txError } = await supabase
      .from('transactions')
      .select('amount, transaction_type')
      .gte('created_at', today);
    if (txError) throw txError;

    // 2. Fetch Today's Loans (Money Out)
    const { data: loans, error: loanError } = await supabase
      .from('borrower_loans')
      .select('loan_amount')
      .gte('created_at', today);
    if (loanError) throw loanError;

    // 3. Fetch Today's Recoveries (Money In)
    const { data: recoveries, error: recoveryError } = await supabase
      .from('recoveries')
      .select('amount')
      .gte('created_at', today);
    if (recoveryError) throw recoveryError;

    const summary = (txs || []).reduce((acc, curr) => {
      if (curr.transaction_type === 'deposit') {
        acc.moneyIn += Number(curr.amount);
        acc.countIn += 1;
      } else if (curr.transaction_type === 'withdrawal') {
        acc.moneyOut += Number(curr.amount);
        acc.countOut += 1;
      }
      return acc;
    }, { moneyIn: 0, countIn: 0, moneyOut: 0, countOut: 0 });

    // Add Loans to Money Out
    (loans || []).forEach(l => {
      summary.moneyOut += Number(l.loan_amount);
      summary.countOut += 1;
    });

    // Add Recoveries to Money In
    (recoveries || []).forEach(r => {
      summary.moneyIn += Number(r.amount);
      summary.countIn += 1;
    });

    return summary;
  },
  getTransferSummary: async () => {
    // Fetch settings to know limit days
    const { data: settings } = await supabase
      .from('settings')
      .select('key, value');
    
    const reversalLimitSetting = settings?.find(s => s.key === 'reversal_limit_days');
    const limitDays = reversalLimitSetting ? Number(reversalLimitSetting.value) : 30;

    // Fetch borrowers and their loans/recoveries
    const { data: borrowers, error } = await supabase
      .from('borrowers')
      .select(`
        id,
        borrower_loans(
          loan_amount,
          created_at,
          recoveries(
            amount
          )
        )
      `);
      
    if (error) throw error;

    let totalOutstanding = 0;
    let activeTransfers = 0;
    let overdueTransfers = 0;
    const now = new Date();

    borrowers?.forEach(b => {
      (b.borrower_loans || []).forEach((loan: any) => {
        const recovered = (loan.recoveries || []).reduce((sum: number, r: any) => sum + Number(r.amount), 0);
        const outstanding = Number(loan.loan_amount) - recovered;
        if (outstanding > 0) {
          totalOutstanding += outstanding;
          activeTransfers += 1;

          // Check if overdue
          const createdDate = new Date(loan.created_at);
          const ageInDays = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
          if (ageInDays > limitDays) {
            overdueTransfers += 1;
          }
        }
      });
    });

    // Fetch repayments this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthRecoveries } = await supabase
      .from('recoveries')
      .select('amount')
      .gte('created_at', startOfMonth.toISOString());
      
    const repaymentsThisMonth = monthRecoveries?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;

    return { 
      totalOutstanding, 
      activeTransfers, 
      overdueTransfers, 
      repaymentsThisMonth 
    };
  },
  settleInternalTransfer: async (operationId: string) => {
    const { error } = await supabase
      .from('transactions')
      .update({ is_reversed: true })
      .or(`id.eq.${operationId},operation_id.eq.${operationId}`);
    if (error) throw error;
    return { success: true };
  },
  listInternalTransfers: async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, students(name)')
      .eq('transaction_type', 'adjustment')
      .order('transaction_date', { ascending: false });
    
    if (error) throw error;
    if (!data) return [];

    const groups: Record<string, any> = {};
    data.forEach((trf: any) => {
      const dateKey = trf.transaction_date ? trf.transaction_date.substring(0, 16) : 'unknown';
      const opId = trf.operation_id || `${trf.amount}_${dateKey}`;
      
      if (!groups[opId]) {
        groups[opId] = {
          id: trf.operation_id || trf.id,
          amount: trf.amount,
          transaction_date: trf.transaction_date,
          purpose: trf.purpose,
          is_reversed: trf.is_reversed,
          participants: []
        };
      }
      
      const participant = {
        student_id: trf.student_id,
        name: trf.students?.name,
        direction: trf.direction,
        amount: trf.amount
      };
      
      if (!groups[opId].participants.find((p: any) => p.student_id === trf.student_id && p.direction === trf.direction)) {
        groups[opId].participants.push(participant);
      }
    });

    return Object.values(groups);
  },
  getInternalTransferById: async (id: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, students(name)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },
  create: async (transaction: any) => {
    const { data, error } = await supabase
      .from('transactions')
      .insert([transaction])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  createInternalTransferAtomic: async (params: { 
    from_student_id: string; 
    to_student_id: string; 
    amount: number; 
    purpose: string; 
    operation_id: string; 
    created_by: string; 
  }) => {
    const timestamp = new Date().toISOString();
    
    // Debit Lender
    const { error: debitError } = await supabase
      .from('transactions')
      .insert({
        student_id: params.from_student_id,
        operation_id: params.operation_id,
        transaction_type: 'adjustment',
        direction: 'debit',
        amount: params.amount,
        purpose: `Lender: ${params.purpose}`,
        transaction_date: timestamp,
        created_by: params.created_by
      });
      
    if (debitError) throw debitError;

    // Credit Borrower
    const { error: creditError } = await supabase
      .from('transactions')
      .insert({
        student_id: params.to_student_id,
        operation_id: params.operation_id,
        transaction_type: 'adjustment',
        direction: 'credit',
        amount: params.amount,
        purpose: `Borrower: ${params.purpose}`,
        transaction_date: timestamp,
        created_by: params.created_by
      });

    if (creditError) throw creditError;
    return { success: true };
  },
  delete: async (id: string) => {
    console.log('Backend Service: Attempting to delete transaction with ID:', id);
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Backend Service: Delete error:', error);
      throw error;
    }
    console.log('Backend Service: Successfully deleted transaction with ID:', id);
  },
  deleteOperation: async (operationId: string) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .or(`id.eq.${operationId},operation_id.eq.${operationId}`);
    if (error) throw error;
  },
  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

export const presetService = {
  list: async () => {
    const { data, error } = await supabase
      .from('transaction_presets')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  create: async (preset: any) => {
    const { data, error } = await supabase
      .from('transaction_presets')
      .insert([preset])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

export const batchService = {
  list: async () => {
    const { data, error } = await supabase
      .from('saved_batches')
      .select('*, members:batch_members(count)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  create: async (batch: { name: string; description: string; created_by: string }) => {
    const { data, error } = await supabase
      .from('saved_batches')
      .insert([batch])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  addMembers: async (batchId: string, studentIds: string[]) => {
    const members = studentIds.map(sid => ({
      batch_id: batchId,
      student_id: sid
    }));
    const { error } = await supabase
      .from('batch_members')
      .insert(members);
    if (error) throw error;
  }
};

export const auditService = {
  list: async (limit = 100) => {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }
};
