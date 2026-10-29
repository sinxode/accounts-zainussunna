import { QueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { formatDisplayName } from './utils';

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
    const { data, error } = await (supabase.rpc as any)('rpc_record_borrower_recovery', {
      p_loan_id: recovery.loan_id,
      p_amount: Number(recovery.amount),
      p_recovery_date: recovery.recovery_date || new Date().toISOString().split('T')[0],
      p_notes: recovery.notes || null
    });
    if (error) throw error;
    return data;
  },
  deleteLoan: async (_id: string) => {
    throw new Error('UNSUPPORTED_OPERATION: External loan deletion is prohibited by ledger integrity rules.');
  },
  deleteRecovery: async (_id: string) => {
    throw new Error('UNSUPPORTED_OPERATION: Loan recovery deletion is prohibited by ledger integrity rules.');
  }
};

export const studentService = {
  getHealthSummary: async (): Promise<StudentHealthSummary[]> => {
    const { data, error } = await supabase
      .from('student_health')
      .select('*');
    if (error) throw error;
    const list = (data as unknown as StudentHealthSummary[]) || [];
    return list.map(s => ({
      ...s,
      name: formatDisplayName(s.name)
    }));
  },
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('student_health')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (data) {
      data.name = formatDisplayName(data.name);
    }
    return data;
  },
  getTransactionsByStudentId: async (studentId: string) => {
    const { data, error } = await supabase
      .from('student_ledger_view')
      .select('*')
      .eq('student_id', studentId)
      .order('transaction_date', { ascending: false });
    if (error) throw error;
    return (data || []).map((t: any) => ({
      ...t,
      id: t.transaction_id || t.id,
      created_at: t.transaction_date
    }));
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
    return data?.map(item => {
      const s = item.students as any;
      if (s) {
        s.name = formatDisplayName(s.name);
      }
      return s;
    }) || [];
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
    const list = data || [];
    return list.map(item => {
      if (item.students) {
        item.students.name = formatDisplayName(item.students.name);
      }
      return item;
    });
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
        entity_name: t.students?.name ? formatDisplayName(t.students.name) : 'Unknown',
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
        entity_name: t.students?.name ? formatDisplayName(t.students.name) : 'Unknown',
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
    if (data && data.students) {
      data.students.name = formatDisplayName(data.students.name);
    }
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
  settleInternalTransfer: async (loanId: string, amount: number = 0, notes?: string) => {
    const { data, error } = await (supabase.rpc as any)('rpc_repay_internal_loan', {
      p_loan_id: loanId,
      p_amount: amount,
      p_notes: notes || 'Settlement of internal student loan'
    });
    if (error) throw error;
    return data;
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
    const { data, error } = await (supabase.rpc as any)('rpc_post_transaction', {
      p_student_id: transaction.student_id,
      p_transaction_type: transaction.transaction_type,
      p_direction: transaction.direction,
      p_amount: Number(transaction.amount),
      p_purpose: transaction.purpose,
      p_idempotency_key: transaction.idempotency_key || null,
      p_operation_id: transaction.operation_id || null
    });
    if (error) throw error;
    const result = data as any;
    return result?.transaction || result;
  },
  createBulk: async (transactions: any[], operationId?: string, idempotencyKey?: string) => {
    const payload = transactions.map(t => ({
      student_id: t.student_id,
      transaction_type: t.transaction_type,
      direction: t.direction,
      amount: Number(t.amount),
      purpose: t.purpose
    }));
    const { data, error } = await (supabase.rpc as any)('rpc_post_bulk_transactions', {
      p_transactions: payload,
      p_operation_id: operationId || null,
      p_idempotency_key: idempotencyKey || null
    });
    if (error) throw error;
    const result = data as any;
    return result?.transactions || result;
  },
  reverse: async (transactionId: string, reason: string) => {
    const { data, error } = await (supabase.rpc as any)('rpc_reverse_transaction', {
      p_transaction_id: transactionId,
      p_reason: reason
    });
    if (error) throw error;
    return data;
  },
  createInternalTransferAtomic: async (params: { 
    from_student_id: string; 
    to_student_id: string; 
    amount: number; 
    purpose: string; 
    operation_id?: string;
    idempotency_key?: string;
  }) => {
    const { data, error } = await (supabase.rpc as any)('rpc_post_internal_transfer', {
      p_lender_student_id: params.from_student_id,
      p_borrower_student_id: params.to_student_id,
      p_amount: Number(params.amount),
      p_purpose: params.purpose,
      p_operation_id: params.operation_id || null,
      p_idempotency_key: params.idempotency_key || null
    });
    if (error) throw error;
    return data;
  },
  repayInternalLoan: async (params: {
    loan_id: string;
    amount: number;
    notes?: string;
    idempotency_key?: string;
  }) => {
    const { data, error } = await (supabase.rpc as any)('rpc_repay_internal_loan', {
      p_loan_id: params.loan_id,
      p_amount: Number(params.amount),
      p_notes: params.notes || null,
      p_idempotency_key: params.idempotency_key || null
    });
    if (error) throw error;
    return data;
  },
  delete: async (_id: string) => {
    throw new Error('UNSUPPORTED_OPERATION: Direct transaction deletion is prohibited by financial ledger invariants. Use reverse instead.');
  },
  deleteOperation: async (_operationId: string) => {
    throw new Error('UNSUPPORTED_OPERATION: Bulk operation deletion is prohibited by financial ledger invariants. Reverse individual transactions with documented reasons.');
  },
  update: async (_id: string, _updates: any) => {
    throw new Error('UNSUPPORTED_OPERATION: Direct transaction update is prohibited by financial ledger invariants. Post a compensating adjustment or reversal.');
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
  },
  update: async (id: string, preset: any) => {
    const { data, error } = await supabase
      .from('transaction_presets')
      .update(preset)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  delete: async (id: string) => {
    const { error } = await supabase
      .from('transaction_presets')
      .delete()
      .eq('id', id);
    if (error) throw error;
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
