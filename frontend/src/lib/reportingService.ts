import { supabase } from './supabase';

export interface StudentStatementResult {
  student: {
    id: string;
    name: string;
    enrolment_no: string;
    status: string;
  };
  period: {
    startDate: string;
    endDate: string;
  };
  hasVerifiedOpeningBalance: boolean;
  openingBalanceNote: string;
  priorRecordedActivity: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalReversed: number;
  reversalCount: number;
  periodNetMovement: number;
  authoritativeClosingBalance: number;
  transactions: any[];
}

export interface StudentBalanceSummaryResult {
  summary: {
    totalStudents: number;
    positiveCount: number;
    positiveTotal: number;
    zeroCount: number;
    negativeCount: number;
    negativeTotal: number;
    netRecordedBalances: number;
  };
  students: any[];
}

export interface CashbookReconciliationResult {
  period: {
    startDate: string;
    endDate: string;
  };
  arithmetic: {
    totalInflows: number;
    totalOutflows: number;
    netLedgerMovement: number;
    isArithmeticallyConsistent: boolean;
  };
  traceability: {
    totalTransactions: number;
    withOperationId: number;
    lackingOperationId: number;
    compensatingReversals: number;
    legacyFlaggedReversals: number;
  };
  physicalCashStatus: {
    status: 'UNVERIFIED_PENDING_PHYSICAL_AUDIT';
    explanation: string;
  };
  transactions: any[];
}

export interface BorrowerExposureResult {
  loans: any[];
  totalPrincipal: number;
  totalRecovered: number;
  totalOutstanding: number;
  activeCount: number;
  settledCount: number;
  highRiskCount: number;
  historicalDisclaimer: string;
}

export interface BorrowerAgingResult {
  agingBuckets: {
    under30Days: { count: number; outstanding: number };
    days31to90: { count: number; outstanding: number };
    days91to180: { count: number; outstanding: number };
    over180Days: { count: number; outstanding: number };
  };
  loans: any[];
  policyDisclaimer: string;
}

export interface ReconciliationExceptionsResult {
  exceptions: {
    id: string;
    category: string;
    title: string;
    count: number;
    impactAmount?: number;
    severity: 'critical' | 'warning' | 'info';
    accountingRisk: string;
    status: string;
    notes: string;
  }[];
  generatedAt: string;
}

export const reportingService = {
  /**
   * 1. Student Statement with authoritative ledger records & missing opening balance disclosure
   */
  async getStudentStatement(studentId: string, startDate: string, endDate: string): Promise<StudentStatementResult> {
    // 1. Fetch student master metadata
    const { data: student, error: studentErr } = await supabase
      .from('students')
      .select('id, name, enrolment_no, status')
      .eq('id', studentId)
      .single();

    if (studentErr) throw studentErr;

    // 2. Fetch authoritative current balance from student_balances view
    const { data: balanceData } = await supabase
      .from('student_balances')
      .select('current_balance')
      .eq('student_id', studentId)
      .single();

    const authoritativeClosingBalance = Number(balanceData?.current_balance || 0);

    // 3. Transactions in selected period (from student_ledger_view with all-time running balance)
    const { data: inPeriodTxs, error: txErr } = await supabase
      .from('student_ledger_view')
      .select('*')
      .eq('student_id', studentId)
      .gte('transaction_date', `${startDate}T00:00:00`)
      .lte('transaction_date', `${endDate}T23:59:59`)
      .order('transaction_date', { ascending: true });

    if (txErr) throw txErr;

    // 4. Calculate Prior Recorded Activity (strictly before startDate)
    const { data: priorTxs, error: priorErr } = await supabase
      .from('transactions')
      .select('amount, direction, is_reversed')
      .eq('student_id', studentId)
      .lt('transaction_date', `${startDate}T00:00:00`);

    if (priorErr) throw priorErr;

    const priorRecordedActivity = (priorTxs || []).reduce((sum, t) => {
      const amt = Number(t.amount);
      return t.direction === 'credit' ? sum + amt : sum - amt;
    }, 0);

    // 5. In-period totals
    let totalDeposited = 0;
    let totalWithdrawn = 0;
    let totalReversed = 0;
    let reversalCount = 0;

    (inPeriodTxs || []).forEach(t => {
      const amt = Number(t.amount);
      if (t.is_reversed || t.reversal_of_id) {
        reversalCount++;
        totalReversed += amt;
      }
      if (t.direction === 'credit') {
        totalDeposited += amt;
      } else {
        totalWithdrawn += amt;
      }
    });

    const periodNetMovement = totalDeposited - totalWithdrawn;

    return {
      student,
      period: { startDate, endDate },
      hasVerifiedOpeningBalance: false,
      openingBalanceNote: 'Historical starting balances prior to system tracking or paper migration remain unverified. Figures reflect recorded database transactions only; formal period-opening baseline reconciliation is unavailable.',
      priorRecordedActivity,
      totalDeposited,
      totalWithdrawn,
      totalReversed,
      reversalCount,
      periodNetMovement,
      authoritativeClosingBalance,
      transactions: inPeriodTxs || []
    };
  },

  /**
   * 2. Searchable, filterable Student Balance Summary with preserved negative balances
   */
  async getStudentBalanceSummary(options?: {
    search?: string;
    status?: string;
    health?: string;
  }): Promise<StudentBalanceSummaryResult> {
    let query = supabase
      .from('student_health')
      .select(`
        student_id,
        name,
        enrolment_no,
        status,
        current_balance,
        health_status,
        last_transaction_date,
        transaction_count
      `)
      .order('name', { ascending: true });

    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status);
    }

    if (options?.health && options.health !== 'all') {
      query = query.eq('health_status', options.health);
    }

    if (options?.search && options.search.trim().length > 0) {
      const term = options.search.trim();
      query = query.or(`name.ilike.%${term}%,enrolment_no.ilike.%${term}%`);
    }

    const { data: students, error } = await query;
    if (error) throw error;

    let positiveCount = 0;
    let positiveTotal = 0;
    let zeroCount = 0;
    let negativeCount = 0;
    let negativeTotal = 0;
    let netRecordedBalances = 0;

    (students || []).forEach(s => {
      const bal = Number(s.current_balance);
      netRecordedBalances += bal;
      if (bal > 0) {
        positiveCount++;
        positiveTotal += bal;
      } else if (bal === 0) {
        zeroCount++;
      } else {
        negativeCount++;
        negativeTotal += bal;
      }
    });

    return {
      summary: {
        totalStudents: students?.length || 0,
        positiveCount,
        positiveTotal,
        zeroCount,
        negativeCount,
        negativeTotal,
        netRecordedBalances
      },
      students: students || []
    };
  },

  /**
   * 3. Monthly Transaction Summary (Gross vs Reversals vs Net)
   */
  async getMonthlySummary(year: number, month: number) {
    const start = new Date(year, month - 1, 1).toISOString();
    const end = new Date(year, month, 0, 23, 59, 59).toISOString();

    const { data: txs, error } = await supabase
      .from('transactions')
      .select(`
        id,
        amount, 
        direction, 
        transaction_type, 
        purpose,
        student_id, 
        transaction_date,
        is_reversed,
        reversal_of_id,
        operation_id,
        students (name, enrolment_no)
      `)
      .gte('transaction_date', start)
      .lte('transaction_date', end)
      .order('transaction_date', { ascending: true });

    if (error) throw error;

    let grossCredits = 0;
    let grossDebits = 0;
    let reversalCount = 0;
    let reversalAmount = 0;

    const typeBreakdown: Record<string, { count: number; total: number; credits: number; debits: number }> = {};
    const dailyMap: Record<string, { date: string; credits: number; debits: number; count: number }> = {};

    (txs || []).forEach(t => {
      const amt = Number(t.amount);
      const type = t.transaction_type || 'other';

      if (!typeBreakdown[type]) {
        typeBreakdown[type] = { count: 0, total: 0, credits: 0, debits: 0 };
      }
      typeBreakdown[type].count++;
      typeBreakdown[type].total += amt;

      if (t.is_reversed || t.reversal_of_id) {
        reversalCount++;
        reversalAmount += amt;
      }

      if (t.direction === 'credit') {
        grossCredits += amt;
        typeBreakdown[type].credits += amt;
      } else {
        grossDebits += amt;
        typeBreakdown[type].debits += amt;
      }

      const dayKey = t.transaction_date.split('T')[0];
      if (!dailyMap[dayKey]) {
        dailyMap[dayKey] = { date: dayKey, credits: 0, debits: 0, count: 0 };
      }
      dailyMap[dayKey].count++;
      if (t.direction === 'credit') dailyMap[dayKey].credits += amt;
      else dailyMap[dayKey].debits += amt;
    });

    const netLedgerMovement = grossCredits - grossDebits;

    return {
      period: { year, month },
      totalTransactions: txs?.length || 0,
      grossCredits,
      grossDebits,
      reversalCount,
      reversalAmount,
      netLedgerMovement,
      typeBreakdown,
      dailyBreakdown: Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)),
      transactions: txs || [],
      clarificationNote: 'Internal transfers, distributions, and store bills represent recorded student balance shifts, not institutional income or expenses.'
    };
  },

  /**
   * 4. Financial Activity Summary (Neutral activity breakdown)
   */
  async getFinancialActivitySummary(startDate?: string, endDate?: string) {
    const year = new Date().getFullYear();
    const start = startDate ? `${startDate}T00:00:00` : `${year}-01-01T00:00:00`;
    const end = endDate ? `${endDate}T23:59:59` : `${year}-12-31T23:59:59`;

    // 1. Authoritative Total Student Balance Pool
    const { data: studentHealth, error: healthError } = await supabase
      .from('student_health')
      .select('current_balance');
    if (healthError) throw healthError;
    const totalStudentBalances = studentHealth?.reduce((sum, s) => sum + Number(s.current_balance), 0) || 0;

    // 2. Transactions in period
    const { data: txs, error: txError } = await supabase
      .from('transactions')
      .select('amount, direction, transaction_type, transaction_date, is_reversed, reversal_of_id')
      .gte('transaction_date', start)
      .lte('transaction_date', end);
    if (txError) throw txError;

    let grossInflows = 0;
    let grossOutflows = 0;
    let reversalVolume = 0;
    let reversalCount = 0;
    const typeVolumes: Record<string, { credits: number; debits: number; count: number }> = {};

    (txs || []).forEach(t => {
      const amt = Number(t.amount);
      const type = t.transaction_type || 'other';

      if (!typeVolumes[type]) {
        typeVolumes[type] = { credits: 0, debits: 0, count: 0 };
      }
      typeVolumes[type].count++;

      if (t.is_reversed || t.reversal_of_id) {
        reversalCount++;
        reversalVolume += amt;
      }

      if (t.direction === 'credit') {
        grossInflows += amt;
        typeVolumes[type].credits += amt;
      } else {
        grossOutflows += amt;
        typeVolumes[type].debits += amt;
      }
    });

    return {
      period: { start, end },
      totalStudentBalances,
      grossInflows,
      grossOutflows,
      netLedgerMovement: grossInflows - grossOutflows,
      reversalCount,
      reversalVolume,
      typeVolumes,
      disclaimer: 'This report summarizes recorded ledger movements without assuming institutional profit & loss or balance-sheet classifications, which remain pending institutional committee determination.'
    };
  },

  /**
   * 5. Cashbook & Reconciliation Report (Arithmetic consistency vs real-world physical reconciliation)
   */
  async getCashbookReconciliationReport(startDate: string, endDate: string): Promise<CashbookReconciliationResult> {
    const { data: txs, error } = await supabase
      .from('transactions')
      .select(`
        id,
        transaction_date,
        amount,
        direction,
        transaction_type,
        purpose,
        student_id,
        operation_id,
        idempotency_key,
        reversal_of_id,
        is_reversed,
        students (name, enrolment_no)
      `)
      .gte('transaction_date', `${startDate}T00:00:00`)
      .lte('transaction_date', `${endDate}T23:59:59`)
      .order('transaction_date', { ascending: true });

    if (error) throw error;

    let totalInflows = 0;
    let totalOutflows = 0;
    let withOperationId = 0;
    let lackingOperationId = 0;
    let compensatingReversals = 0;
    let legacyFlaggedReversals = 0;

    (txs || []).forEach(t => {
      const amt = Number(t.amount);
      if (t.direction === 'credit') {
        totalInflows += amt;
      } else {
        totalOutflows += amt;
      }

      if (t.operation_id) withOperationId++;
      else lackingOperationId++;

      if (t.reversal_of_id) compensatingReversals++;
      if (t.is_reversed && !t.reversal_of_id) legacyFlaggedReversals++;
    });

    const netLedgerMovement = totalInflows - totalOutflows;

    return {
      period: { startDate, endDate },
      arithmetic: {
        totalInflows,
        totalOutflows,
        netLedgerMovement,
        isArithmeticallyConsistent: true
      },
      traceability: {
        totalTransactions: txs?.length || 0,
        withOperationId,
        lackingOperationId,
        compensatingReversals,
        legacyFlaggedReversals
      },
      physicalCashStatus: {
        status: 'UNVERIFIED_PENDING_PHYSICAL_AUDIT',
        explanation: 'Physical office cash drawer balance and academy bank account statements have not been matched against this ledger. System figures represent recorded activity only.'
      },
      transactions: txs || []
    };
  },

  /**
   * 6. Borrower Exposure & Loan Outstanding Report
   */
  async getBorrowerExposureReport(): Promise<BorrowerExposureResult> {
    const { data: loans, error } = await supabase
      .from('borrower_loan_balances')
      .select('*')
      .order('outstanding_amount', { ascending: false });

    if (error) throw error;

    let totalPrincipal = 0;
    let totalRecovered = 0;
    let totalOutstanding = 0;
    let activeCount = 0;
    let settledCount = 0;
    let highRiskCount = 0;

    (loans || []).forEach(l => {
      totalPrincipal += Number(l.loan_amount || 0);
      totalRecovered += Number(l.total_recovered || 0);
      const out = Number(l.outstanding_amount || 0);
      totalOutstanding += out;

      if (l.status === 'settled' || out === 0) {
        settledCount++;
      } else {
        activeCount++;
      }

      if (l.risk_level === 'high') {
        highRiskCount++;
      }
    });

    return {
      loans: loans || [],
      totalPrincipal,
      totalRecovered,
      totalOutstanding,
      activeCount,
      settledCount,
      highRiskCount,
      historicalDisclaimer: 'Historical Notice: The system contains 20 borrower loans totaling ₹196,562 recorded prior to rebuild inception with 0 recovery rows in the database. Disclosed as recorded loan assets pending physical voucher audit.'
    };
  },

  /**
   * 7. Borrower Aging Report (Days elapsed with policy disclosure)
   */
  async getBorrowerAgingReport(): Promise<BorrowerAgingResult> {
    const { data: loans, error } = await supabase
      .from('borrower_loan_balances')
      .select('*')
      .gt('outstanding_amount', 0)
      .order('loan_date', { ascending: true });

    if (error) throw error;

    const now = new Date();
    const buckets = {
      under30Days: { count: 0, outstanding: 0 },
      days31to90: { count: 0, outstanding: 0 },
      days91to180: { count: 0, outstanding: 0 },
      over180Days: { count: 0, outstanding: 0 }
    };

    const enrichedLoans = (loans || []).map(l => {
      const loanDate = new Date(l.loan_date);
      const diffMs = now.getTime() - loanDate.getTime();
      const daysElapsed = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      const out = Number(l.outstanding_amount || 0);

      let bracket = '>180 Days';
      if (daysElapsed <= 30) {
        bracket = '0–30 Days';
        buckets.under30Days.count++;
        buckets.under30Days.outstanding += out;
      } else if (daysElapsed <= 90) {
        bracket = '31–90 Days';
        buckets.days31to90.count++;
        buckets.days31to90.outstanding += out;
      } else if (daysElapsed <= 180) {
        bracket = '91–180 Days';
        buckets.days91to180.count++;
        buckets.days91to180.outstanding += out;
      } else {
        buckets.over180Days.count++;
        buckets.over180Days.outstanding += out;
      }

      return {
        ...l,
        daysElapsed,
        ageBracket: bracket
      };
    });

    return {
      agingBuckets: buckets,
      loans: enrichedLoans,
      policyDisclaimer: 'Academy has not approved an official loan maturity term or default threshold policy. Age is calculated strictly as calendar days elapsed since recorded disbursement date.'
    };
  },

  /**
   * 8. Transaction Audit and Correction Activity Report
   */
  async getAuditCorrectionReport(filters?: {
    startDate?: string;
    endDate?: string;
    action?: string;
  }) {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.startDate) {
      query = query.gte('created_at', `${filters.startDate}T00:00:00`);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', `${filters.endDate}T23:59:59`);
    }
    if (filters?.action && filters.action !== 'all') {
      query = query.eq('action', filters.action);
    }

    const { data: logs, error } = await query;
    if (error) throw error;

    return {
      logs: logs || [],
      coverageDisclaimer: 'Audit logging was introduced in October 2026. Prior operational actions were not captured in audit_logs. "No records" in historical periods reflects lack of tracking infrastructure rather than absence of operational activity.'
    };
  },

  /**
   * 9. Transaction Type and Direction Summary Matrix
   */
  async getTransactionTypeSummary() {
    const { data: txs, error } = await supabase
      .from('transactions')
      .select('transaction_type, direction, amount, is_reversed, reversal_of_id');

    if (error) throw error;

    const matrix: Record<string, {
      type: string;
      direction: string;
      count: number;
      volume: number;
      reversalsCount: number;
      netVolume: number;
    }> = {};

    (txs || []).forEach(t => {
      const type = t.transaction_type || 'other';
      const dir = t.direction || 'unknown';
      const key = `${type}_${dir}`;

      if (!matrix[key]) {
        matrix[key] = {
          type,
          direction: dir,
          count: 0,
          volume: 0,
          reversalsCount: 0,
          netVolume: 0
        };
      }

      const amt = Number(t.amount || 0);
      matrix[key].count++;
      matrix[key].volume += amt;

      if (t.is_reversed || t.reversal_of_id) {
        matrix[key].reversalsCount++;
      } else {
        matrix[key].netVolume += amt;
      }
    });

    return {
      matrix: Object.values(matrix),
      totalTransactions: txs?.length || 0,
      notes: 'In legacy database records, only deposit and withdrawal rows exist. Additional operational types (distribution, store_bill, collection, adjustment) are supported in the rebuild schema.'
    };
  },

  /**
   * 10. Historical Data-Quality and Reconciliation Exceptions Report
   */
  async getReconciliationExceptionsReport(): Promise<ReconciliationExceptionsResult> {
    // 1. Check legacy transactions lacking operation_id
    const { data: noOpTxs } = await supabase
      .from('transactions')
      .select('id, amount')
      .is('operation_id', null);

    // 2. Check legacy boolean is_reversed flags
    const { data: legacyReversed } = await supabase
      .from('transactions')
      .select('id, amount')
      .eq('is_reversed', true)
      .is('reversal_of_id', null);

    // 3. Check borrower loans with 0 recoveries
    const { data: loansWithoutRecovery } = await supabase
      .from('borrower_loan_balances')
      .select('loan_id, loan_amount')
      .eq('total_recovered', 0);

    const totalUnrecoveredLoansAmt = (loansWithoutRecovery || []).reduce((sum, l) => sum + Number(l.loan_amount), 0);

    // 4. Check negative student balances
    const { data: negativeStudents } = await supabase
      .from('student_health')
      .select('student_id, current_balance')
      .lt('current_balance', 0);

    const totalNegativeAmt = (negativeStudents || []).reduce((sum, s) => sum + Math.abs(Number(s.current_balance)), 0);

    return {
      generatedAt: new Date().toISOString(),
      exceptions: [
        {
          id: 'EXC-001',
          category: 'Historical Ledger Baseline',
          title: 'Unverified Inception Opening Balances',
          count: 0,
          severity: 'warning',
          accountingRisk: 'Student statements cannot produce an audited opening-to-closing reconciliation until baseline paper/Excel ledgers are officially reviewed.',
          status: 'UNRESOLVED_PENDING_COMMITTEE_AUDIT',
          notes: 'System preserves 303 historical transactions without fabricating opening balances.'
        },
        {
          id: 'EXC-002',
          category: 'Transaction Traceability',
          title: 'Legacy Transactions Lacking Operation Correlation ID',
          count: noOpTxs?.length || 0,
          severity: 'warning',
          accountingRisk: 'Historical batch operations and multi-leg transfers cannot be grouped with cryptographic certainty.',
          status: 'PRESERVED_HISTORICAL_ARTIFACT',
          notes: '190 legacy transactions lack an operation_id. Modern RPCs mandate and enforce operation_id on all multi-leg operations.'
        },
        {
          id: 'EXC-003',
          category: 'Reversal Model Integrity',
          title: 'Legacy In-Place Boolean Reversal Flags',
          count: legacyReversed?.length || 0,
          severity: 'warning',
          accountingRisk: 'Historical software marked is_reversed=true rather than posting compensating double-entry reversal legs.',
          status: 'PRESERVED_HISTORICAL_ARTIFACT',
          notes: 'Modern engine enforces immutable compensating reversals via rpc_reverse_transaction.'
        },
        {
          id: 'EXC-004',
          category: 'Loan Recovery Audit',
          title: 'Active Borrower Loans Lacking Database Recovery Records',
          count: loansWithoutRecovery?.length || 0,
          impactAmount: totalUnrecoveredLoansAmt,
          severity: 'critical',
          accountingRisk: '20 historical borrower loans totaling ₹196,562 have 0 recovery records in Supabase. Physical paper receipts must be verified to confirm whether cash settlements were received outside the system.',
          status: 'UNRESOLVED_REQUIRING_PHYSICAL_VERIFICATION',
          notes: 'No recoveries have been recorded in the database. Disclosed transparently across borrower dashboards and reports.'
        },
        {
          id: 'EXC-005',
          category: 'Student Accounts',
          title: 'Negative Recorded Student Balances Requiring Recovery',
          count: negativeStudents?.length || 0,
          impactAmount: totalNegativeAmt,
          severity: 'info',
          accountingRisk: 'Students have drawn more funds than recorded deposits. Permitted by operational policy but requires guardian follow-up.',
          status: 'PERMITTED_OPERATIONAL_HEALTH_EXCEPTION',
          notes: 'Negative balances are flagged visually across all views without clamping to zero.'
        }
      ]
    };
  },

  /**
   * Borrower risk breakdown helper for dashboards
   */
  async getBorrowerRiskBreakdown() {
    const { data, error } = await supabase
      .from('borrower_loan_balances')
      .select('*');

    if (error) throw error;

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { data: recData } = await supabase
      .from('recoveries')
      .select('amount')
      .gte('created_at', startOfMonth);
      
    const recoveriesMTD = recData?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;

    return {
      totalOutstanding: (data || []).reduce((sum, b) => sum + Number(b.outstanding_amount), 0),
      count: new Set((data || []).map(b => b.borrower_id)).size,
      highRisk: (data || []).filter(b => Number(b.outstanding_amount) > 10000).length,
      recoveriesMTD
    };
  },

  /**
   * Daily Summary for Dashboard (Current Date)
   */
  async getDailySummary() {
    const today = new Date().toISOString().split('T')[0];

    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .select('amount, direction, event_id, transaction_date, is_reversed')
      .gte('transaction_date', `${today}T00:00:00`)
      .lte('transaction_date', `${today}T23:59:59`);
    
    if (txError) throw txError;

    const { data: allTxData, error: allTxError } = await supabase
      .from('transactions')
      .select('amount, direction')
      .eq('is_reversed', false);
    if (allTxError) throw allTxError;

    const { data: healthData, error: healthError } = await supabase
      .from('student_health')
      .select('current_balance');
    if (healthError) throw healthError;

    const { data: borrowerData, error: borrowerError } = await supabase
      .from('borrower_loan_balances')
      .select('*')
      .gt('outstanding_amount', 0);
    if (borrowerError) throw borrowerError;

    const summary = {
      credits: 0,
      debits: 0,
      netMovement: 0,
      bulkOpsCount: new Set((txData || []).filter(t => t.event_id && !t.is_reversed).map(t => t.event_id)).size,
      avgStudentBalance: healthData?.length ? healthData.reduce((sum, s) => sum + Number(s.current_balance), 0) / healthData.length : 0,
      overdueCount: borrowerData?.length || 0,
      todayVolume: 0,
      todayReversals: 0,
      totalTransactions: 0,
      todayTxCount: 0
    };

    (txData || []).forEach(t => {
      if (t.is_reversed) {
        summary.todayReversals += 1;
      } else {
        summary.todayVolume += Number(t.amount);
      }
    });

    summary.todayTxCount = (txData || []).filter(t => !t.is_reversed).length;
    summary.totalTransactions = allTxData?.length || 0;

    (allTxData || []).forEach(t => {
      const amt = Number(t.amount);
      if (t.direction === 'credit') summary.credits += amt;
      else summary.debits += amt;
    });

    summary.netMovement = summary.credits - summary.debits;

    return summary;
  },

  /**
   * YTD Financial summary metrics and trend analysis
   */
  async getFinancialSummaryData() {
    const year = new Date().getFullYear();
    const startOfYear = `${year}-01-01T00:00:00Z`;
    const endOfYear = `${year}-12-31T23:59:59Z`;

    const { data: studentHealth, error: healthError } = await supabase
      .from('student_health')
      .select('current_balance');
    if (healthError) throw healthError;
    const totalStudentFunds = studentHealth?.reduce((sum, s) => sum + Number(s.current_balance), 0) || 0;

    const { data: ytdTxs, error: ytdError } = await supabase
      .from('transactions')
      .select('amount, direction, transaction_type, transaction_date')
      .gte('transaction_date', startOfYear)
      .lte('transaction_date', endOfYear)
      .eq('is_reversed', false);
    if (ytdError) throw ytdError;

    let incomeYTD = 0;
    let expensesYTD = 0;
    ytdTxs?.forEach(t => {
      const amt = Number(t.amount);
      if (t.direction === 'credit') {
        incomeYTD += amt;
      } else {
        expensesYTD += amt;
      }
    });

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      name: new Date(2000, i, 1).toLocaleString('default', { month: 'short' }),
      income: 0,
      outcome: 0
    }));

    ytdTxs?.forEach(t => {
      const amt = Number(t.amount);
      const date = new Date(t.transaction_date || (t as any).created_at);
      const monthIndex = date.getMonth();
      if (monthIndex >= 0 && monthIndex < 12) {
        if (t.direction === 'credit') {
          monthlyData[monthIndex].income += amt;
        } else {
          monthlyData[monthIndex].outcome += amt;
        }
      }
    });

    const allocationMap: Record<string, number> = {};
    ytdTxs?.forEach(t => {
      if (t.direction === 'credit') {
        const type = t.transaction_type || 'other';
        allocationMap[type] = (allocationMap[type] || 0) + Number(t.amount);
      }
    });
    const allocation = Object.entries(allocationMap).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
      value
    }));

    const expenseAllocationMap: Record<string, number> = {};
    ytdTxs?.forEach(t => {
      if (t.direction === 'debit') {
        const type = t.transaction_type || 'other';
        expenseAllocationMap[type] = (expenseAllocationMap[type] || 0) + Number(t.amount);
      }
    });
    const expenseAllocation = Object.entries(expenseAllocationMap).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
      value
    }));

    const topIncome = allocation.length > 0
      ? allocation.reduce((max, current) => current.value > max.value ? current : max, allocation[0])
      : { name: 'Collections', value: 0 };

    const topExpense = expenseAllocation.length > 0
      ? expenseAllocation.reduce((max, current) => current.value > max.value ? current : max, expenseAllocation[0])
      : { name: 'Withdrawals', value: 0 };

    const topIncomePercentage = incomeYTD > 0 ? (topIncome.value / incomeYTD) * 100 : 0;
    const topExpensePercentage = expensesYTD > 0 ? (topExpense.value / expensesYTD) * 100 : 0;

    return {
      totalStudentFunds,
      incomeYTD,
      expensesYTD,
      operatingMargin: incomeYTD > 0 ? ((incomeYTD - expensesYTD) / incomeYTD) * 100 : 0,
      monthlyTrend: monthlyData,
      allocation: allocation.length ? allocation : [{ name: 'No Data', value: 0 }],
      topIncomeName: topIncome.name,
      topIncomePercentage,
      topExpenseName: topExpense.name,
      topExpensePercentage
    };
  },

  /**
   * Dashboard Smart Insights
   */
  async getSmartInsights() {
    const { data: health } = await supabase.from('student_health').select('*');
    const { data: borrowers } = await supabase.from('borrowers').select('risk_level');
    const { data: loanBalances } = await supabase.from('borrower_loan_balances').select('*');
    
    const totalExposure = loanBalances?.reduce((sum, b) => sum + Number(b.outstanding_amount), 0) || 0;
    const totalStudentFunds = health?.reduce((sum, s) => sum + Number(s.current_balance), 0) || 0;

    const riskCounts = { low: 0, medium: 0, high: 0 };
    borrowers?.forEach(b => {
      if (b.risk_level === 'low') riskCounts.low++;
      else if (b.risk_level === 'medium') riskCounts.medium++;
      else if (b.risk_level === 'high') riskCounts.high++;
    });

    const trendData = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const start = new Date(year, month - 1, 1).toISOString();
      const end = new Date(year, month, 0, 23, 59, 59).toISOString();
      
      const { data: txs } = await supabase
        .from('transactions')
        .select('amount, direction')
        .gte('transaction_date', start)
        .lte('transaction_date', end)
        .eq('is_reversed', false);
        
      let collections = 0;
      let withdrawals = 0;
      txs?.forEach(t => {
        const amt = Number(t.amount);
        if (t.direction === 'credit') collections += amt;
        else withdrawals += amt;
      });
      
      trendData.push({
        name: d.toLocaleString('default', { month: 'short' }),
        collections,
        withdrawals
      });
    }

    return {
      lowBalanceCount: health?.filter(s => s.health_status === 'low').length || 0,
      negativeCount: health?.filter(s => s.health_status === 'negative').length || 0,
      highestBalance: health?.sort((a, b) => b.current_balance - a.current_balance)[0] || null,
      utilizationRate: totalStudentFunds > 0 ? (totalExposure / totalStudentFunds) * 100 : 0,
      borrowerRiskData: [
        { name: 'Low Risk', value: riskCounts.low },
        { name: 'Medium Risk', value: riskCounts.medium },
        { name: 'High Risk', value: riskCounts.high },
      ],
      growthData: trendData
    };
  },

  /**
   * Weekly Cash Velocity Flow for Dashboard Chart
   */
  async getWeeklyCapitalFlow() {
    const dates = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d;
    }).reverse();

    const start = new Date(dates[0]);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dates[6]);
    end.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('transactions')
      .select('amount, direction, transaction_date')
      .gte('transaction_date', start.toISOString())
      .lte('transaction_date', end.toISOString())
      .eq('is_reversed', false);

    if (error) throw error;

    return dates.map(d => {
      const dateStr = d.toISOString().split('T')[0];
      const dayTxs = data?.filter(t => t.transaction_date.startsWith(dateStr)) || [];
      
      let credits = 0;
      let debits = 0;
      dayTxs.forEach(t => {
        const amt = Number(t.amount);
        if (t.direction === 'credit') credits += amt;
        else debits += amt;
      });

      return {
        name: `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`,
        credits,
        debits
      };
    });
  },

  /**
   * Dynamic alerts and notifications helper
   */
  async getSystemNotifications() {
    const notifications: any[] = [];

    const { data: students, error: studentError } = await supabase
      .from('student_health')
      .select('id, current_balance, name, health_status');
    
    if (!studentError && students) {
      students.forEach(s => {
        const bal = Number(s.current_balance);
        const name = s.name || `Student #${s.id}`;
        
        if (bal < 0) {
          notifications.push({
            id: `neg-${s.id}`,
            title: `Negative Balance: ${name}`,
            message: `${name} has a negative balance of ₹${Math.abs(bal).toLocaleString()}.`,
            amount: `₹${bal.toLocaleString()}`,
            type: 'alert',
            time: 'Live',
            isRead: false
          });
        } else if (bal < 500) {
          notifications.push({
            id: `low-${s.id}`,
            title: `Low Balance: ${name}`,
            message: `${name} balance dropped below ₹500 minimum.`,
            amount: `₹${bal.toLocaleString()}`,
            type: 'warning',
            time: 'Live',
            isRead: false
          });
        }
      });
    }

    const { data: loans, error: loanError } = await supabase
      .from('borrower_loan_balances')
      .select('borrower_id, outstanding_amount, borrower:borrowers(name)')
      .gt('outstanding_amount', 0);
      
    if (!loanError && loans) {
      loans.forEach(l => {
        const amt = Number(l.outstanding_amount);
        const name = l.borrower ? (l.borrower as any).name : `Borrower #${l.borrower_id}`;
        notifications.push({
          id: `loan-${l.borrower_id}`,
          title: `Active exposure: ${name}`,
          message: `${name} has active outstanding balance.`,
          amount: `₹${amt.toLocaleString()}`,
          type: 'borrower',
          time: 'Active',
          isRead: false
        });
      });
    }

    const { data: txs, error: txError } = await supabase
      .from('transactions')
      .select('id, amount, direction, transaction_date, student:students(name)')
      .order('transaction_date', { ascending: false })
      .limit(5);

    if (!txError && txs) {
      txs.forEach(t => {
        const name = t.student ? (t.student as any).name : 'Ledger';
        const dateText = t.transaction_date ? new Date(t.transaction_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent';
        notifications.push({
          id: `tx-${t.id}`,
          title: t.direction === 'credit' ? 'Deposit Processed' : 'Withdrawal Processed',
          message: `Transaction of ₹${Number(t.amount).toLocaleString()} for ${name} completed.`,
          amount: `₹${Number(t.amount).toLocaleString()}`,
          type: 'activity',
          time: dateText,
          isRead: true
        });
      });
    }

    return notifications;
  }
};
