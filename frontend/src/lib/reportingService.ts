import { supabase } from './supabase';

export const reportingService = {
  /**
   * Fetches a full student statement with opening/closing balances.
   */
  async getStudentStatement(studentId: string, startDate: string, endDate: string) {
    // 1. Get transactions in range
    const { data: transactions, error } = await supabase
      .from('student_ledger_view')
      .select('*')
      .eq('student_id', studentId)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date', { ascending: true });

    if (error) throw error;

    // 2. Calculate Opening Balance (Sum of all transactions before startDate)
    const { data: openingData, error: openingErr } = await supabase
      .from('transactions')
      .select('amount, direction')
      .eq('student_id', studentId)
      .lt('transaction_date', startDate)
      .eq('is_reversed', false);

    if (openingErr) throw openingErr;

    const openingBalance = openingData.reduce((sum, t) => 
      t.direction === 'credit' ? sum + Number(t.amount) : sum - Number(t.amount), 0
    );

    // 3. Totals
    const totalDeposited = transactions
      .filter(t => t.direction === 'credit' && !t.is_reversed)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalWithdrawn = transactions
      .filter(t => t.direction === 'debit' && !t.is_reversed)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      transactions,
      openingBalance,
      closingBalance: openingBalance + totalDeposited - totalWithdrawn,
      totalDeposited,
      totalWithdrawn
    };
  },

  /**
   * Monthly Summary Aggregation
   */
  async getMonthlySummary(year: number, month: number) {
    const start = new Date(year, month - 1, 1).toISOString();
    const end = new Date(year, month, 0, 23, 59, 59).toISOString();

    const { data: txs, error } = await supabase
      .from('transactions')
      .select(`
        amount, 
        direction, 
        transaction_type, 
        student_id, 
        students (name, enrolment_no), 
        event_id, 
        events (event_name)
      `)
      .gte('transaction_date', start)
      .lte('transaction_date', end)
      .eq('is_reversed', false);

    if (error) throw error;

    const summary = {
      collections: 0,
      withdrawals: 0,
      distributions: 0,
      storeBills: 0,
      netMovement: 0,
      highlights: {
        activeStudentName: 'None',
        activeStudentCount: 0,
        highestDepositAmount: 0,
        highestDepositStudent: 'N/A',
        largestEventName: 'None',
        largestEventAmount: 0
      }
    };

    const studentCounts: Record<string, { name: string; count: number }> = {};
    const eventTotals: Record<string, { name: string; total: number }> = {};
    let maxDeposit = 0;
    let maxDepositStudent = 'N/A';

    txs?.forEach(t => {
      const amt = Number(t.amount);
      if (t.transaction_type === 'collection') summary.collections += amt;
      if (t.transaction_type === 'withdrawal') summary.withdrawals += amt;
      if (t.transaction_type === 'distribution') summary.distributions += amt;
      if (t.transaction_type === 'store_bill') summary.storeBills += amt;

      // Group student activity
      if (t.student_id && t.students) {
        const studentName = (t.students as any).name;
        if (!studentCounts[t.student_id]) {
          studentCounts[t.student_id] = { name: studentName, count: 0 };
        }
        studentCounts[t.student_id].count++;
      }

      // Track highest deposit (any credit direction)
      if (t.direction === 'credit' && amt > maxDeposit) {
        maxDeposit = amt;
        maxDepositStudent = (t.students as any)?.name || 'Unknown';
      }

      // Group event totals
      if (t.event_id && t.events) {
        const eventName = (t.events as any).event_name;
        if (!eventTotals[t.event_id]) {
          eventTotals[t.event_id] = { name: eventName, total: 0 };
        }
        eventTotals[t.event_id].total += amt;
      }
    });

    summary.netMovement = (summary.collections + summary.distributions) - (summary.withdrawals + summary.storeBills);

    // Calculate active student
    let activeStudent = { name: 'None', count: 0 };
    Object.values(studentCounts).forEach(s => {
      if (s.count > activeStudent.count) {
        activeStudent = s;
      }
    });

    // Calculate largest event
    let largestEvent = { name: 'None', total: 0 };
    Object.values(eventTotals).forEach(e => {
      if (e.total > largestEvent.total) {
        largestEvent = { name: e.name, total: e.total };
      }
    });

    summary.highlights = {
      activeStudentName: activeStudent.name,
      activeStudentCount: activeStudent.count,
      highestDepositAmount: maxDeposit,
      highestDepositStudent: maxDepositStudent,
      largestEventName: largestEvent.name,
      largestEventAmount: largestEvent.total
    };

    return summary;
  },

  /**
   * Daily Summary for Dashboard (Current Date)
   */
  async getDailySummary() {
    // Get date in YYYY-MM-DD format based on local system
    const today = new Date().toISOString().split('T')[0];

    // 1. Today's Transaction Summary (retained for bulkOpsCount and threshold calculations)
    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .select('amount, direction, event_id, transaction_date, is_reversed')
      .gte('transaction_date', `${today}T00:00:00`)
      .lte('transaction_date', `${today}T23:59:59`);
    
    console.log('Daily Summary Query Debug:', { today, txData, error: txError });
    if (txError) throw txError;

    // 2. All-Time Transactions (for full inflow and outflow flow data)
    const { data: allTxData, error: allTxError } = await supabase
      .from('transactions')
      .select('amount, direction')
      .eq('is_reversed', false);
    if (allTxError) throw allTxError;

    // 3. Average Student Balance
    const { data: healthData, error: healthError } = await supabase
      .from('student_health')
      .select('current_balance');
    if (healthError) throw healthError;

    // 4. Overdue Count (Placeholder logic using status or specific amount)
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
   * Borrower Exposure and Risk
   */
  async getBorrowerRiskBreakdown() {
    const { data, error } = await supabase
      .from('borrower_loan_balances')
      .select('*');

    if (error) throw error;

    // Fetch month to date recoveries
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { data: recData } = await supabase
      .from('recoveries')
      .select('amount')
      .gte('created_at', startOfMonth);
      
    const recoveriesMTD = recData?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;

    return {
      totalOutstanding: data.reduce((sum, b) => sum + Number(b.outstanding_amount), 0),
      count: new Set(data.map(b => b.borrower_id)).size,
      highRisk: data.filter(b => Number(b.outstanding_amount) > 10000).length,
      recoveriesMTD
    };
  },

  /**
   * YTD Financial summary metrics and trend analysis
   */
  async getFinancialSummaryData() {
    const year = new Date().getFullYear();
    const startOfYear = `${year}-01-01T00:00:00Z`;
    const endOfYear = `${year}-12-31T23:59:59Z`;

    // 1. Total Student Funds
    const { data: studentHealth, error: healthError } = await supabase
      .from('student_health')
      .select('current_balance');
    if (healthError) throw healthError;
    const totalStudentFunds = studentHealth?.reduce((sum, s) => sum + Number(s.current_balance), 0) || 0;

    // 2. YTD Income (Credits) and YTD Expenses (Debits)
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

    // 3. Monthly Trend (Income vs Expense) for the chart
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

    // 4. Resource Allocation (by transaction type)
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

    // 5. Expense Allocation (by transaction type)
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
   * Fetches dynamic alerts and notifications from live student balance levels, outstanding loans,
   * and recent transaction logs.
   */
  async getSystemNotifications() {
    const notifications: any[] = [];

    // 1. Fetch negative/low student balances from student_health
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

    // 2. Fetch active outstanding loans
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

    // 3. Fetch last 5 transactions
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
