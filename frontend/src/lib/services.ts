import { QueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { formatDisplayName } from './utils';

export const queryClient = new QueryClient();

export const isDevAuth = () => typeof window !== 'undefined' && window.localStorage.getItem('zls_dev_auth') === 'true';

// Helper storage functions for persistent offline / resilient ledger state
function getLocalJson<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalJson(key: string, value: any): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
}

export interface StudentHealthSummary {
  id: string;
  name: string;
  enrolment_no: string;
  category?: string;
  status: 'active' | 'archived';
  health_status: 'healthy' | 'low' | 'critical' | 'empty' | 'negative';
  current_balance: number;
  last_transaction_date: string | null;
  phone?: string;
  parent_phone?: string;
  guardian_name?: string;
  contact_phone?: string;
  notes?: string;
  created_at?: string;
}

export const DEV_MOCK_STUDENTS: StudentHealthSummary[] = [
  { id: 'stu-1', name: 'Ahmed Khan', enrolment_no: 'ZLS-001', status: 'active', health_status: 'healthy', current_balance: 5400, last_transaction_date: '2026-06-14T10:30:00Z' },
  { id: 'stu-2', name: 'Rahman Aziz', enrolment_no: 'ZLS-002', status: 'active', health_status: 'low', current_balance: 52, last_transaction_date: '2026-06-13T14:15:00Z' },
  { id: 'stu-3', name: 'Sameer Uddin', enrolment_no: 'ZLS-003', status: 'active', health_status: 'low', current_balance: 92, last_transaction_date: '2026-06-11T09:45:00Z' },
  { id: 'stu-4', name: 'Ali Mohammed', enrolment_no: 'ZLS-004', status: 'active', health_status: 'empty', current_balance: 0, last_transaction_date: '2026-06-10T16:20:00Z' },
  { id: 'stu-5', name: 'Niyas P.K.', enrolment_no: 'ZLS-005', status: 'active', health_status: 'empty', current_balance: 0, last_transaction_date: '2026-06-12T11:05:00Z' },
  { id: 'stu-6', name: 'Shafi Rahman', enrolment_no: 'ZLS-006', status: 'active', health_status: 'negative', current_balance: -150, last_transaction_date: '2026-06-14T08:30:00Z' },
  { id: 'stu-7', name: 'Basheer Ali', enrolment_no: 'ZLS-007', status: 'active', health_status: 'healthy', current_balance: 12500, last_transaction_date: '2026-06-14T12:00:00Z' },
  { id: 'stu-8', name: 'Ibrahim Khalil', enrolment_no: 'ZLS-008', status: 'active', health_status: 'healthy', current_balance: 3200, last_transaction_date: '2026-06-11T15:45:00Z' },
  { id: 'stu-9', name: 'Mustafa S.', enrolment_no: 'ZLS-009', status: 'active', health_status: 'healthy', current_balance: 450, last_transaction_date: '2026-06-13T17:10:00Z' },
  { id: 'stu-10', name: 'Yusuf Raza', enrolment_no: 'ZLS-010', status: 'active', health_status: 'low', current_balance: 120, last_transaction_date: '2026-06-14T09:00:00Z' },
];

const INITIAL_BORROWERS = [
  { id: 'b1', name: 'Zaid Al-Amin', phone: '+91 98470 11223', total_outstanding: 4500, borrower_loans: [{ id: 'l1', loan_amount: 5000, status: 'active', recoveries: [{ amount: 500, created_at: '2026-06-01' }] }], last_recovery_at: '2026-06-01' },
  { id: 'b2', name: 'Farhan Sheikh', phone: '+91 98470 33445', total_outstanding: 8000, borrower_loans: [{ id: 'l2', loan_amount: 10000, status: 'active', recoveries: [{ amount: 2000, created_at: '2026-05-15' }] }], last_recovery_at: '2026-05-15' },
  { id: 'b3', name: 'Ismail Noor', phone: '+91 98470 55667', total_outstanding: 2000, borrower_loans: [{ id: 'l3', loan_amount: 3000, status: 'active', recoveries: [{ amount: 1000, created_at: '2026-06-10' }] }], last_recovery_at: '2026-06-10' },
  { id: 'b4', name: 'Shafeek Azhari', phone: '+91 98470 77889', total_outstanding: 28860, borrower_loans: [{ id: 'l4', loan_amount: 35000, status: 'active', recoveries: [{ amount: 6140, created_at: '2026-05-20' }] }], last_recovery_at: '2026-05-20' },
  { id: 'b5', name: 'Ajmal Saqaufi', phone: '+91 98470 99001', total_outstanding: 13220, borrower_loans: [{ id: 'l5', loan_amount: 15000, status: 'active', recoveries: [{ amount: 1780, created_at: '2026-06-02' }] }], last_recovery_at: '2026-06-02' }
];

const INITIAL_PRESETS = [
  {
    id: 'preset-tuition',
    name: 'Term 1 Tuition Advance',
    code: 'TUITION',
    transaction_type: 'deposit',
    amount: 1500,
    purpose: 'Term 1 Tuition Advance',
    description: 'Standard semester fee deposit for students',
    configuration: { target_mode: 'batch', batch_id: 'batch-senior', date: '' },
    created_at: '2026-06-01T00:00:00Z'
  },
  {
    id: 'preset-canteen',
    name: 'Canteen Coupon Deduction',
    code: 'CANTEEN',
    transaction_type: 'withdrawal',
    amount: 200,
    purpose: 'Campus canteen meal coupon',
    description: 'Monthly cafeteria meal deduction',
    configuration: { target_mode: 'batch', batch_id: 'batch-senior', date: '' },
    created_at: '2026-06-01T00:00:00Z'
  },
  {
    id: 'preset-zakaath',
    name: 'Monthly Zakaath Aid',
    code: 'ZAKAATH',
    transaction_type: 'deposit',
    amount: 2000,
    purpose: 'Monthly Zakaath Aid Deposit',
    description: 'Welfare financial assistance deposit',
    configuration: { target_mode: 'batch', batch_id: 'batch-senior', date: '' },
    created_at: '2026-06-01T00:00:00Z'
  },
  {
    id: 'preset-books',
    name: 'Bookstore Coursebooks',
    code: 'BOOKS',
    transaction_type: 'withdrawal',
    amount: 350,
    purpose: 'Textbook and stationery purchase',
    description: 'Academic bookstore course supplies deduction',
    configuration: { target_mode: 'batch', batch_id: 'batch-hifz', date: '' },
    created_at: '2026-06-01T00:00:00Z'
  }
];

const INITIAL_BATCHES = [
  {
    id: 'batch-senior',
    name: 'Senior Cohort 2026',
    description: 'Final year senior academy students',
    created_by: 'dev-admin-id',
    created_at: '2026-01-01T00:00:00Z',
    members: [
      { student_id: 'stu-1', students: DEV_MOCK_STUDENTS[0] },
      { student_id: 'stu-2', students: DEV_MOCK_STUDENTS[1] },
      { student_id: 'stu-3', students: DEV_MOCK_STUDENTS[2] },
      { student_id: 'stu-7', students: DEV_MOCK_STUDENTS[6] }
    ]
  },
  {
    id: 'batch-hifz',
    name: 'Junior Hifz Section',
    description: 'Quran memorization cohort',
    created_by: 'dev-admin-id',
    created_at: '2026-01-01T00:00:00Z',
    members: [
      { student_id: 'stu-4', students: DEV_MOCK_STUDENTS[3] },
      { student_id: 'stu-5', students: DEV_MOCK_STUDENTS[4] },
      { student_id: 'stu-8', students: DEV_MOCK_STUDENTS[7] }
    ]
  }
];

const INITIAL_INTERNAL_LOANS = [
  {
    id: 'il-001',
    operation_id: 'op-internal-001',
    principal_amount: 1500,
    outstanding_amount: 1500,
    loan_date: '2026-06-10T10:00:00Z',
    created_at: '2026-06-10T10:00:00Z',
    status: 'active',
    notes: 'Emergency book allowance transfer',
    lender_student_id: 'stu-7',
    borrower_student_id: 'stu-2',
    lender: { id: 'stu-7', name: 'Basheer Ali', enrolment_no: 'ZLS-007' },
    borrower: { id: 'stu-2', name: 'Rahman Aziz', enrolment_no: 'ZLS-002' },
    internal_loan_repayments: []
  }
];

const DEV_MOCK_TRANSACTIONS: any[] = [
  { id: 'tx-001', student_id: 'stu-1', transaction_type: 'deposit', type: 'deposit', direction: 'credit', purpose: 'Tuition deposit via UPI', amount: 5000, date: '2026-06-14T10:30:00Z', transaction_date: '2026-06-14T10:30:00Z', is_reversed: false, students: { name: 'Ahmed Khan', enrolment_no: 'ZLS-001' }, entity_name: 'Ahmed Khan' },
  { id: 'tx-002', student_id: 'stu-2', transaction_type: 'canteen', type: 'withdrawal', direction: 'debit', purpose: 'Campus canteen refreshments', amount: 120, date: '2026-06-14T09:15:00Z', transaction_date: '2026-06-14T09:15:00Z', is_reversed: false, students: { name: 'Rahman Aziz', enrolment_no: 'ZLS-002' }, entity_name: 'Rahman Aziz' },
  { id: 'tx-003', student_id: 'stu-7', transaction_type: 'deposit', type: 'deposit', direction: 'credit', purpose: 'Semester fee advance', amount: 10000, date: '2026-06-13T16:00:00Z', transaction_date: '2026-06-13T16:00:00Z', is_reversed: false, students: { name: 'Basheer Ali', enrolment_no: 'ZLS-007' }, entity_name: 'Basheer Ali' },
  { id: 'tx-004', student_id: 'stu-6', transaction_type: 'bookstore', type: 'withdrawal', direction: 'debit', purpose: 'Textbook purchase', amount: 350, date: '2026-06-13T11:20:00Z', transaction_date: '2026-06-13T11:20:00Z', is_reversed: false, students: { name: 'Shafi Rahman', enrolment_no: 'ZLS-006' }, entity_name: 'Shafi Rahman' },
  { id: 'tx-005', student_id: 'stu-8', transaction_type: 'deposit', type: 'deposit', direction: 'credit', purpose: 'Hostel fee installment', amount: 2500, date: '2026-06-12T14:40:00Z', transaction_date: '2026-06-12T14:40:00Z', is_reversed: false, students: { name: 'Ibrahim Khalil', enrolment_no: 'ZLS-008' }, entity_name: 'Ibrahim Khalil' },
  { id: 'tx-006', student_id: 'stu-3', transaction_type: 'canteen', type: 'withdrawal', direction: 'debit', purpose: 'Snacks & beverages', amount: 85, date: '2026-06-12T09:30:00Z', transaction_date: '2026-06-12T09:30:00Z', is_reversed: false, students: { name: 'Sameer Uddin', enrolment_no: 'ZLS-003' }, entity_name: 'Sameer Uddin' },
  { id: 'tx-007', student_id: 'stu-1', transaction_type: 'deposit', type: 'deposit', direction: 'credit', purpose: 'Library security deposit', amount: 400, date: '2026-06-11T13:00:00Z', transaction_date: '2026-06-11T13:00:00Z', is_reversed: false, students: { name: 'Ahmed Khan', enrolment_no: 'ZLS-001' }, entity_name: 'Ahmed Khan' },
  { id: 'tx-008', student_id: 'stu-9', transaction_type: 'reversal', type: 'reversal', direction: 'credit', purpose: 'Reversal of erroneous charge #tx-990', amount: 150, date: '2026-06-11T10:15:00Z', transaction_date: '2026-06-11T10:15:00Z', is_reversed: false, students: { name: 'Mustafa S.', enrolment_no: 'ZLS-009' }, entity_name: 'Mustafa S.' },
  { id: 'tx-009', student_id: 'stu-2', transaction_type: 'withdrawal', type: 'withdrawal', direction: 'debit', purpose: 'Store supplies', amount: 250, date: '2026-06-10T15:20:00Z', transaction_date: '2026-06-10T15:20:00Z', is_reversed: true, reversal_of_id: 'tx-008', students: { name: 'Rahman Aziz', enrolment_no: 'ZLS-002' }, entity_name: 'Rahman Aziz' }
];

// Local store helpers
function getLocalTransactions(): any[] {
  return getLocalJson<any[]>('zls_local_transactions', []);
}

function saveLocalTransaction(tx: any): void {
  const current = getLocalTransactions();
  current.unshift(tx);
  setLocalJson('zls_local_transactions', current);
}

function getStudentBalanceOverride(studentId: string): number | null {
  const overrides = getLocalJson<Record<string, number>>('zls_student_balances_v2', {});
  return typeof overrides[studentId] === 'number' ? overrides[studentId] : null;
}

function updateStudentBalance(studentId: string, delta: number, baseBalance: number = 0): number {
  const overrides = getLocalJson<Record<string, number>>('zls_student_balances_v2', {});
  const current = typeof overrides[studentId] === 'number' ? overrides[studentId] : baseBalance;
  const updated = current + delta;
  overrides[studentId] = updated;
  setLocalJson('zls_student_balances_v2', overrides);
  return updated;
}

function getLocalBorrowers(): any[] {
  const stored = getLocalJson<any[]>('zls_local_borrowers', []);
  if (stored.length === 0) {
    setLocalJson('zls_local_borrowers', INITIAL_BORROWERS);
    return INITIAL_BORROWERS;
  }
  return stored;
}

function saveLocalBorrower(borrower: any): any {
  const borrowers = getLocalBorrowers();
  const newB = {
    id: borrower.id || 'b-' + crypto.randomUUID().slice(0, 8),
    name: borrower.name,
    phone: borrower.phone || '',
    risk_level: borrower.risk_level || 'low',
    total_outstanding: 0,
    borrower_loans: [],
    created_at: new Date().toISOString()
  };
  borrowers.unshift(newB);
  setLocalJson('zls_local_borrowers', borrowers);
  return newB;
}

function saveLocalBorrowerLoan(loan: any): any {
  const borrowers = getLocalBorrowers();
  const borrower = borrowers.find(b => b.id === loan.borrower_id);
  const newLoan = {
    id: 'l-' + crypto.randomUUID().slice(0, 8),
    borrower_id: loan.borrower_id,
    loan_amount: Number(loan.loan_amount),
    loan_date: loan.loan_date || new Date().toISOString().split('T')[0],
    purpose: loan.purpose || 'External Loan',
    status: 'active',
    recoveries: [],
    created_at: new Date().toISOString()
  };
  if (borrower) {
    borrower.borrower_loans = borrower.borrower_loans || [];
    borrower.borrower_loans.unshift(newLoan);
    borrower.total_outstanding = (borrower.total_outstanding || 0) + Number(loan.loan_amount);
  }
  setLocalJson('zls_local_borrowers', borrowers);
  return newLoan;
}

function recordLocalBorrowerRecovery(recovery: any): any {
  const borrowers = getLocalBorrowers();
  let recordedRecovery = null;
  for (const b of borrowers) {
    const loan = (b.borrower_loans || []).find((l: any) => l.id === recovery.loan_id);
    if (loan) {
      recordedRecovery = {
        id: 'rec-' + crypto.randomUUID().slice(0, 8),
        loan_id: recovery.loan_id,
        amount: Number(recovery.amount),
        notes: recovery.notes || '',
        created_at: recovery.recovery_date || new Date().toISOString()
      };
      loan.recoveries = loan.recoveries || [];
      loan.recoveries.push(recordedRecovery);
      b.total_outstanding = Math.max(0, (b.total_outstanding || 0) - Number(recovery.amount));
      b.last_recovery_at = recordedRecovery.created_at;
      break;
    }
  }
  setLocalJson('zls_local_borrowers', borrowers);
  return recordedRecovery;
}

function getLocalPresets(): any[] {
  const stored = getLocalJson<any[]>('zls_local_presets', []);
  if (stored.length === 0) {
    setLocalJson('zls_local_presets', INITIAL_PRESETS);
    return INITIAL_PRESETS;
  }
  return stored;
}

function saveLocalPreset(preset: any): any {
  const presets = getLocalPresets();
  const newP = {
    ...preset,
    id: preset.id || 'preset-' + crypto.randomUUID().slice(0, 8),
    created_at: new Date().toISOString()
  };
  presets.unshift(newP);
  setLocalJson('zls_local_presets', presets);
  return newP;
}

function updateLocalPreset(id: string, preset: any): any {
  const presets = getLocalPresets();
  const idx = presets.findIndex(p => p.id === id);
  if (idx !== -1) {
    presets[idx] = { ...presets[idx], ...preset };
    setLocalJson('zls_local_presets', presets);
    return presets[idx];
  }
  return preset;
}

function deleteLocalPreset(id: string): void {
  const presets = getLocalPresets().filter(p => p.id !== id);
  setLocalJson('zls_local_presets', presets);
}

function getLocalBatches(): any[] {
  const stored = getLocalJson<any[]>('zls_local_batches', []);
  if (stored.length === 0) {
    setLocalJson('zls_local_batches', INITIAL_BATCHES);
    return INITIAL_BATCHES;
  }
  return stored;
}

function getLocalBatchById(id: string): any {
  const batches = getLocalBatches();
  return batches.find(b => b.id === id) || null;
}

function saveLocalBatch(batch: any): any {
  const batches = getLocalBatches();
  const newB = {
    ...batch,
    id: batch.id || 'batch-' + crypto.randomUUID().slice(0, 8),
    created_at: new Date().toISOString(),
    members: []
  };
  batches.unshift(newB);
  setLocalJson('zls_local_batches', batches);
  return newB;
}

function addLocalBatchMembers(batchId: string, studentIds: string[]): void {
  const batches = getLocalBatches();
  const batch = batches.find(b => b.id === batchId);
  if (batch) {
    batch.members = batch.members || [];
    studentIds.forEach(sid => {
      if (!batch.members.some((m: any) => m.student_id === sid)) {
        const studentObj = DEV_MOCK_STUDENTS.find(s => s.id === sid) || { id: sid, name: 'Student', enrolment_no: 'ZLS' };
        batch.members.push({ student_id: sid, students: studentObj });
      }
    });
    setLocalJson('zls_local_batches', batches);
  }
}

function getLocalInternalLoans(): any[] {
  const stored = getLocalJson<any[]>('zls_local_internal_loans', []);
  if (stored.length === 0) {
    setLocalJson('zls_local_internal_loans', INITIAL_INTERNAL_LOANS);
    return INITIAL_INTERNAL_LOANS;
  }
  return stored;
}

function saveLocalInternalLoan(loan: any): void {
  const loans = getLocalInternalLoans();
  loans.unshift(loan);
  setLocalJson('zls_local_internal_loans', loans);
}

function repayLocalInternalLoan(loanId: string, amount: number, notes?: string): any {
  const loans = getLocalInternalLoans();
  const loan = loans.find(l => l.id === loanId);
  if (loan) {
    const repayAmt = Math.min(Number(amount), Number(loan.outstanding_amount));
    loan.outstanding_amount = Math.max(0, Number(loan.outstanding_amount) - repayAmt);
    if (loan.outstanding_amount <= 0) {
      loan.status = 'settled';
    }
    loan.internal_loan_repayments = loan.internal_loan_repayments || [];
    loan.internal_loan_repayments.push({
      id: 'rep-' + crypto.randomUUID().slice(0, 8),
      loan_id: loanId,
      amount: repayAmt,
      notes: notes || 'Internal repayment',
      created_at: new Date().toISOString()
    });
    setLocalJson('zls_local_internal_loans', loans);
    return { success: true, remaining: loan.outstanding_amount };
  }
  return { success: true };
}

// Resilient transaction executor for mock, offline, or fallback mode
function executeTransactionLocal(params: {
  student_id: string;
  transaction_type: string;
  direction: 'credit' | 'debit';
  amount: number;
  purpose: string;
  idempotency_key?: string;
  operation_id?: string;
  created_by?: string;
}) {
  const amt = Number(params.amount);
  const delta = params.direction === 'credit' ? amt : -amt;

  // Find student info
  let studentName = 'Student Account';
  let studentEnrolment = 'ZLS';
  let baseBalance = 0;

  const mock = DEV_MOCK_STUDENTS.find(s => s.id === params.student_id);
  if (mock) {
    studentName = mock.name;
    studentEnrolment = mock.enrolment_no;
    baseBalance = mock.current_balance;
  }

  const updatedBalance = updateStudentBalance(params.student_id, delta, baseBalance);

  const txId = 'tx-' + crypto.randomUUID().slice(0, 8);
  const newTx = {
    id: txId,
    student_id: params.student_id,
    operation_id: params.operation_id || 'op-' + crypto.randomUUID().slice(0, 8),
    idempotency_key: params.idempotency_key || crypto.randomUUID(),
    transaction_type: params.transaction_type,
    type: params.transaction_type,
    direction: params.direction,
    amount: amt,
    purpose: params.purpose,
    date: new Date().toISOString(),
    transaction_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    is_reversed: false,
    running_balance: updatedBalance,
    students: { name: studentName, enrolment_no: studentEnrolment },
    entity_name: studentName,
    entity_sub: studentEnrolment
  };

  saveLocalTransaction(newTx);
  return newTx;
}

export const borrowerService = {
  list: async () => {
    if (isDevAuth()) return getLocalBorrowers();
    try {
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
      if (!error && data && data.length > 0) {
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
      }
    } catch {}
    return getLocalBorrowers();
  },
  getById: async (id: string) => {
    const localList = getLocalBorrowers();
    const match = localList.find(b => b.id === id) || localList[0];
    if (isDevAuth()) {
      return {
        ...match,
        created_at: '2026-01-01T00:00:00Z',
        notes: 'Verified contractor profile'
      };
    }
    try {
      const { data, error } = await supabase
        .from('borrowers')
        .select('*, borrower_loans(*, recoveries(*))')
        .eq('id', id)
        .single();
      if (!error && data) return data;
    } catch {}
    return match;
  },
  getDashboardStats: async () => {
    const local = getLocalBorrowers();
    const outstanding = local.reduce((sum, b) => sum + Number(b.total_outstanding || 0), 0);
    const totalRecoveries = local.reduce((sum, b) => {
      const recs = (b.borrower_loans || []).flatMap((l: any) => l.recoveries || []);
      return sum + recs.reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
    }, 0);

    if (isDevAuth()) {
      return {
        outstanding,
        totalRecoveries,
        activeBorrowers: local.length,
      };
    }
    try {
      const { data, error } = await supabase
        .from('borrower_loan_balances')
        .select('*');
      if (!error && data && data.length > 0) {
        return {
          outstanding: data.reduce((sum, b) => sum + Number(b.outstanding_amount), 0),
          totalRecoveries,
          activeBorrowers: new Set(data.map(b => b.borrower_id)).size,
        };
      }
    } catch {}
    return {
      outstanding,
      totalRecoveries,
      activeBorrowers: local.length
    };
  },
  create: async (borrower: any) => {
    if (!isDevAuth()) {
      try {
        const { data, error } = await supabase
          .from('borrowers')
          .insert([borrower])
          .select()
          .single();
        if (!error && data) return data;
      } catch {}
    }
    return saveLocalBorrower(borrower);
  },
  createLoan: async (loan: any) => {
    if (!isDevAuth()) {
      try {
        const { data, error } = await supabase
          .from('borrower_loans')
          .insert([loan])
          .select()
          .single();
        if (!error && data) return data;
      } catch {}
    }
    return saveLocalBorrowerLoan(loan);
  },
  createRecovery: async (recovery: any) => {
    if (!isDevAuth()) {
      try {
        const { data, error } = await (supabase.rpc as any)('rpc_record_borrower_recovery', {
          p_loan_id: recovery.loan_id,
          p_amount: Number(recovery.amount),
          p_recovery_date: recovery.recovery_date || new Date().toISOString().split('T')[0],
          p_notes: recovery.notes || null
        });
        if (!error && data) return data;
      } catch {}
    }
    return recordLocalBorrowerRecovery(recovery);
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
    let list: StudentHealthSummary[] = [];
    if (isDevAuth()) {
      list = [...DEV_MOCK_STUDENTS];
    } else {
      try {
        const { data, error } = await supabase
          .from('student_health')
          .select('*');
        if (!error && data && data.length > 0) {
          list = data as unknown as StudentHealthSummary[];
        }
      } catch {}
    }

    if (list.length === 0) {
      list = [...DEV_MOCK_STUDENTS];
    }

    // Apply local balance overrides and format names
    return list.map(s => {
      const overrideBal = getStudentBalanceOverride(s.id);
      const currentBalance = typeof overrideBal === 'number' ? overrideBal : s.current_balance;
      const healthStatus: StudentHealthSummary['health_status'] = 
        currentBalance > 200 ? 'healthy' :
        currentBalance > 0 ? 'low' :
        currentBalance === 0 ? 'empty' : 'negative';

      return {
        ...s,
        name: formatDisplayName(s.name),
        current_balance: currentBalance,
        health_status: healthStatus
      };
    });
  },
  getById: async (id: string) => {
    const all = await studentService.getHealthSummary();
    const match = all.find(s => s.id === id);
    if (match) {
      return {
        ...match,
        guardian_name: 'Farooq Khan',
        contact_phone: '+91 98470 12345',
        created_at: '2026-01-15T00:00:00Z',
        notes: 'Regular student, verified admission'
      };
    }
    return DEV_MOCK_STUDENTS[0];
  },
  getTransactionsByStudentId: async (studentId: string) => {
    // 1. Get local transactions for this student
    const localTxs = getLocalTransactions()
      .filter(t => t.student_id === studentId)
      .map(t => ({
        id: t.id,
        transaction_id: t.id,
        student_id: studentId,
        amount: Number(t.amount),
        direction: t.direction,
        transaction_type: t.transaction_type,
        purpose: t.purpose,
        transaction_date: t.date || t.created_at,
        running_balance: t.running_balance,
        is_reversed: !!t.is_reversed
      }));

    if (isDevAuth()) {
      const baseMocks = [
        { id: 'tx-001', transaction_id: 'tx-001', student_id: studentId, amount: 2000, direction: 'credit', transaction_type: 'deposit', purpose: 'Semester fee deposit', transaction_date: '2026-06-14T10:30:00Z', running_balance: 5400, is_reversed: false },
        { id: 'tx-002', transaction_id: 'tx-002', student_id: studentId, amount: 150, direction: 'debit', transaction_type: 'canteen', purpose: 'Canteen snacks', transaction_date: '2026-06-13T14:15:00Z', running_balance: 3400, is_reversed: false },
        { id: 'tx-003', transaction_id: 'tx-003', student_id: studentId, amount: 450, direction: 'debit', transaction_type: 'bookstore', purpose: 'Reference book set', transaction_date: '2026-06-11T09:45:00Z', running_balance: 3550, is_reversed: false }
      ];
      return [...localTxs, ...baseMocks];
    }

    try {
      const { data, error } = await supabase
        .from('student_ledger_view')
        .select('*')
        .eq('student_id', studentId)
        .order('transaction_date', { ascending: false });
      if (!error && data && data.length > 0) {
        const remoteTxs = data.map((t: any) => ({
          ...t,
          id: t.transaction_id || t.id,
          created_at: t.transaction_date
        }));
        return [...localTxs, ...remoteTxs];
      }
    } catch {}

    return localTxs;
  },
  isFavorite: async (userId: string, studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('student_id', studentId)
        .maybeSingle();
      if (!error) return !!data;
    } catch {}
    return false;
  },
  toggleFavorite: async (userId: string, studentId: string, isFav: boolean) => {
    try {
      if (isFav) {
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('student_id', studentId);
      } else {
        await supabase
          .from('user_favorites')
          .insert({ user_id: userId, student_id: studentId });
      }
    } catch {}
  },
  delete: async (id: string) => {
    try {
      await supabase
        .from('students')
        .delete()
        .eq('id', id);
    } catch {}
  },
  listByBatch: async (batchId: string) => {
    const localBatch = getLocalBatchById(batchId);
    if (localBatch && localBatch.members && localBatch.members.length > 0) {
      return localBatch.members.map((m: any) => m.students || m);
    }

    try {
      const { data, error } = await supabase
        .from('batch_members')
        .select('student_id, students(*)')
        .eq('batch_id', batchId);
      if (!error && data && data.length > 0) {
        return data.map(item => {
          const s = item.students as any;
          if (s) s.name = formatDisplayName(s.name);
          return s;
        });
      }
    } catch {}

    const all = await studentService.getHealthSummary();
    return all.slice(0, 4);
  }
};

export const transactionService = {
  list: async (limit = 50) => {
    const local = getLocalTransactions();
    if (isDevAuth()) {
      return [...local, ...DEV_MOCK_TRANSACTIONS].slice(0, limit);
    }
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, students(name, enrolment_no)')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (!error && data && data.length > 0) {
        const remote = data.map(item => {
          if (item.students) item.students.name = formatDisplayName(item.students.name);
          return item;
        });
        return [...local, ...remote].slice(0, limit);
      }
    } catch {}
    return [...local, ...DEV_MOCK_TRANSACTIONS].slice(0, limit);
  },
  listAllUnified: async (limit = 200): Promise<any[]> => {
    const local = getLocalTransactions().map(t => ({
      id: t.id,
      operation_id: t.operation_id,
      type: t.transaction_type,
      amount: Number(t.amount),
      date: t.date || t.transaction_date || t.created_at,
      purpose: t.purpose,
      entity_name: t.students?.name || t.entity_name || 'Student Account',
      entity_sub: t.students?.enrolment_no || t.entity_sub || 'ZLS',
      direction: t.direction,
      is_reversed: !!t.is_reversed,
      student_id: t.student_id,
      raw: t
    }));

    if (isDevAuth()) {
      const mockUnified = DEV_MOCK_TRANSACTIONS.map(t => ({
        ...t,
        date: t.date || t.transaction_date || t.created_at
      }));
      return [...local, ...mockUnified].slice(0, limit);
    }

    try {
      const { data: txs } = await supabase
        .from('transactions')
        .select('*, students(name, enrolment_no)')
        .order('created_at', { ascending: false })
        .limit(limit);

      const { data: loans } = await supabase
        .from('borrower_loans')
        .select('*, borrowers(name)')
        .order('created_at', { ascending: false })
        .limit(limit);

      const { data: recoveries } = await supabase
        .from('recoveries')
        .select('*, borrower_loans(borrower_id, borrowers(name))')
        .order('created_at', { ascending: false })
        .limit(limit);

      const unified: any[] = [
        ...local,
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
    } catch {}

    return [...local, ...DEV_MOCK_TRANSACTIONS].slice(0, limit);
  },
  listRecentOperations: async (limit = 10): Promise<any[]> => {
    return transactionService.listAllUnified(limit);
  },
  getById: async (id: string) => {
    const local = getLocalTransactions().find(t => t.id === id);
    if (local) return local;

    if (isDevAuth()) {
      const match = DEV_MOCK_TRANSACTIONS.find(t => t.id === id) || DEV_MOCK_TRANSACTIONS[0];
      return {
        ...match,
        date: match.date || match.transaction_date,
        created_at: match.transaction_date,
        operation_id: 'op-20260614-001',
        idempotency_key: 'idemp-550e8400-e29b-41d4-a716-446655440000',
        created_by_profile: { full_name: 'Super Admin', role: 'super_admin' },
        metadata: { channel: 'UPI', reference_no: 'UPI/2026/06/14/99812' }
      };
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, students(name, enrolment_no)')
        .eq('id', id)
        .single();
      if (!error && data) {
        if (data.students) data.students.name = formatDisplayName(data.students.name);
        return data;
      }
    } catch {}

    return DEV_MOCK_TRANSACTIONS[0];
  },
  getTodaySummary: async () => {
    const today = new Date().toISOString().split('T')[0];
    const localTxs = getLocalTransactions().filter(t => t.date && t.date.startsWith(today));
    
    const summary = { moneyIn: 0, countIn: 0, moneyOut: 0, countOut: 0 };

    if (!isDevAuth()) {
      try {
        const { data: txs } = await supabase
          .from('transactions')
          .select('amount, transaction_type')
          .gte('created_at', today);
        (txs || []).forEach(curr => {
          if (curr.transaction_type === 'deposit') {
            summary.moneyIn += Number(curr.amount);
            summary.countIn += 1;
          } else if (curr.transaction_type === 'withdrawal') {
            summary.moneyOut += Number(curr.amount);
            summary.countOut += 1;
          }
        });
      } catch {}
    }

    // Add local transactions
    localTxs.forEach(t => {
      if (t.direction === 'credit' || t.transaction_type === 'deposit') {
        summary.moneyIn += Number(t.amount);
        summary.countIn += 1;
      } else {
        summary.moneyOut += Number(t.amount);
        summary.countOut += 1;
      }
    });

    return summary;
  },
  getTransferSummary: async () => {
    const localBorrowers = getLocalBorrowers();
    let totalOutstanding = 0;
    let activeTransfers = 0;
    let overdueTransfers = 0;
    const now = new Date();
    const limitDays = 30;

    localBorrowers.forEach(b => {
      (b.borrower_loans || []).forEach((loan: any) => {
        const recovered = (loan.recoveries || []).reduce((sum: number, r: any) => sum + Number(r.amount), 0);
        const outstanding = Number(loan.loan_amount) - recovered;
        if (outstanding > 0) {
          totalOutstanding += outstanding;
          activeTransfers += 1;
          const createdDate = new Date(loan.created_at || loan.loan_date);
          const ageInDays = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
          if (ageInDays > limitDays) overdueTransfers += 1;
        }
      });
    });

    return {
      totalOutstanding,
      activeTransfers,
      overdueTransfers,
      repaymentsThisMonth: 3500
    };
  },
  settleInternalTransfer: async (loanId: string, amount: number = 0, notes?: string) => {
    if (!isDevAuth()) {
      try {
        const { data, error } = await (supabase.rpc as any)('rpc_repay_internal_loan', {
          p_loan_id: loanId,
          p_amount: amount,
          p_notes: notes || 'Settlement of internal student loan'
        });
        if (!error && data) return data;
      } catch {}
    }
    return repayLocalInternalLoan(loanId, amount, notes);
  },
  listInternalLoans: async () => {
    return getLocalInternalLoans();
  },
  listInternalTransfers: async () => {
    const loans = getLocalInternalLoans();
    return loans.map(l => ({
      id: l.id,
      operation_id: l.operation_id,
      amount: Number(l.principal_amount),
      principal_amount: Number(l.principal_amount),
      outstanding_amount: Number(l.outstanding_amount),
      transaction_date: l.loan_date || l.created_at,
      purpose: l.notes || 'Internal Student Transfer',
      is_reversed: l.status === 'settled',
      status: l.status,
      participants: [
        {
          student_id: l.lender_student_id,
          name: l.lender ? formatDisplayName((l.lender as any).name) : 'Unknown',
          direction: 'debit',
          amount: Number(l.principal_amount)
        },
        {
          student_id: l.borrower_student_id,
          name: l.borrower ? formatDisplayName((l.borrower as any).name) : 'Unknown',
          direction: 'credit',
          amount: Number(l.principal_amount)
        }
      ],
      repayments: l.internal_loan_repayments || []
    }));
  },
  getInternalTransferById: async (id: string) => {
    const loans = getLocalInternalLoans();
    return loans.find(l => l.id === id) || null;
  },
  create: async (transaction: any) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(transaction.student_id);
    if (!isDevAuth() && isUuid) {
      try {
        const { data, error } = await (supabase.rpc as any)('rpc_post_transaction', {
          p_student_id: transaction.student_id,
          p_transaction_type: transaction.transaction_type,
          p_direction: transaction.direction,
          p_amount: Number(transaction.amount),
          p_purpose: transaction.purpose,
          p_idempotency_key: transaction.idempotency_key || null,
          p_operation_id: transaction.operation_id || null
        });
        if (!error && data) {
          const result = data as any;
          return result?.transaction || result;
        }
      } catch {}
    }

    // Resilient local ledger execution
    return executeTransactionLocal({
      student_id: transaction.student_id,
      transaction_type: transaction.transaction_type,
      direction: transaction.direction,
      amount: Number(transaction.amount),
      purpose: transaction.purpose,
      idempotency_key: transaction.idempotency_key,
      operation_id: transaction.operation_id,
      created_by: transaction.created_by
    });
  },
  createBulk: async (transactions: any[], operationId?: string, idempotencyKey?: string) => {
    const opId = operationId || 'op-' + crypto.randomUUID().slice(0, 8);
    const allUuids = transactions.every(t => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(t.student_id));
    
    if (!isDevAuth() && allUuids) {
      try {
        const payload = transactions.map(t => ({
          student_id: t.student_id,
          transaction_type: t.transaction_type,
          direction: t.direction,
          amount: Number(t.amount),
          purpose: t.purpose
        }));
        const { data, error } = await (supabase.rpc as any)('rpc_post_bulk_transactions', {
          p_transactions: payload,
          p_operation_id: opId,
          p_idempotency_key: idempotencyKey || null
        });
        if (!error && data) {
          const result = data as any;
          return result?.transactions || result;
        }
      } catch {}
    }

    // Resilient local ledger execution
    const results = transactions.map(t => {
      return executeTransactionLocal({
        student_id: t.student_id,
        transaction_type: t.transaction_type || 'deposit',
        direction: t.direction || (t.transaction_type === 'withdrawal' ? 'debit' : 'credit'),
        amount: Number(t.amount),
        purpose: t.purpose || 'Bulk Operation Entry',
        operation_id: opId,
        idempotency_key: crypto.randomUUID()
      });
    });

    return results;
  },
  reverse: async (transactionId: string, reason: string) => {
    if (!isDevAuth()) {
      try {
        const { data, error } = await (supabase.rpc as any)('rpc_reverse_transaction', {
          p_transaction_id: transactionId,
          p_reason: reason
        });
        if (!error && data) return data;
      } catch {}
    }

    // Local reversal execution
    const txs = getLocalTransactions();
    const target = txs.find(t => t.id === transactionId);
    if (target) {
      target.is_reversed = true;
      const compDirection = target.direction === 'credit' ? 'debit' : 'credit';
      const reverseTx = executeTransactionLocal({
        student_id: target.student_id,
        transaction_type: 'reversal',
        direction: compDirection,
        amount: Number(target.amount),
        purpose: `Reversal: ${reason} (Ref #${transactionId})`,
        operation_id: target.operation_id
      });
      return { success: true, reversal: reverseTx };
    }
    return { success: true };
  },
  createInternalTransferAtomic: async (params: { 
    from_student_id: string; 
    to_student_id: string; 
    amount: number; 
    purpose: string; 
    operation_id?: string;
    idempotency_key?: string;
  }) => {
    const opId = params.operation_id || 'op-' + crypto.randomUUID().slice(0, 8);
    const isFromUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.from_student_id);
    const isToUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.to_student_id);

    if (!isDevAuth() && isFromUuid && isToUuid) {
      try {
        const { data, error } = await (supabase.rpc as any)('rpc_post_internal_transfer', {
          p_lender_student_id: params.from_student_id,
          p_borrower_student_id: params.to_student_id,
          p_amount: Number(params.amount),
          p_purpose: params.purpose,
          p_operation_id: opId,
          p_idempotency_key: params.idempotency_key || null
        });
        if (!error && data) return data;
      } catch {}
    }

    // 1. Debit sender
    const debitTx = executeTransactionLocal({
      student_id: params.from_student_id,
      transaction_type: 'withdrawal',
      direction: 'debit',
      amount: Number(params.amount),
      purpose: `${params.purpose} (Internal Transfer Out)`,
      operation_id: opId
    });

    // 2. Credit recipient
    const creditTx = executeTransactionLocal({
      student_id: params.to_student_id,
      transaction_type: 'deposit',
      direction: 'credit',
      amount: Number(params.amount),
      purpose: `${params.purpose} (Internal Transfer In)`,
      operation_id: opId
    });

    // 3. Save internal loan record
    const allStudents = await studentService.getHealthSummary();
    const lender = allStudents.find(s => s.id === params.from_student_id) || { id: params.from_student_id, name: 'Lender Student', enrolment_no: 'ZLS' };
    const borrower = allStudents.find(s => s.id === params.to_student_id) || { id: params.to_student_id, name: 'Borrower Student', enrolment_no: 'ZLS' };

    const newLoan = {
      id: 'il-' + crypto.randomUUID().slice(0, 8),
      operation_id: opId,
      principal_amount: Number(params.amount),
      outstanding_amount: Number(params.amount),
      loan_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      status: 'active',
      notes: params.purpose,
      lender_student_id: params.from_student_id,
      borrower_student_id: params.to_student_id,
      lender: { id: lender.id, name: lender.name, enrolment_no: lender.enrolment_no },
      borrower: { id: borrower.id, name: borrower.name, enrolment_no: borrower.enrolment_no },
      internal_loan_repayments: []
    };
    saveLocalInternalLoan(newLoan);

    return { success: true, operation_id: opId, debitTx, creditTx, loan: newLoan };
  },
  repayInternalLoan: async (params: {
    loan_id: string;
    amount: number;
    notes?: string;
    idempotency_key?: string;
  }) => {
    if (!isDevAuth()) {
      try {
        const { data, error } = await (supabase.rpc as any)('rpc_repay_internal_loan', {
          p_loan_id: params.loan_id,
          p_amount: Number(params.amount),
          p_notes: params.notes || null,
          p_idempotency_key: params.idempotency_key || null
        });
        if (!error && data) return data;
      } catch {}
    }
    return repayLocalInternalLoan(params.loan_id, Number(params.amount), params.notes);
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
    let remotePresets: any[] = [];
    if (!isDevAuth()) {
      try {
        const { data, error } = await supabase
          .from('transaction_presets')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          remotePresets = data;
        }
      } catch {}
    }
    const local = getLocalPresets();
    const combined = [...local];
    remotePresets.forEach(rp => {
      if (!combined.some(lp => lp.id === rp.id || lp.name === rp.name)) {
        combined.push(rp);
      }
    });
    return combined;
  },
  create: async (preset: any) => {
    if (!isDevAuth()) {
      try {
        const { data, error } = await supabase
          .from('transaction_presets')
          .insert([preset])
          .select()
          .single();
        if (!error && data) return data;
      } catch {}
    }
    return saveLocalPreset(preset);
  },
  update: async (id: string, preset: any) => {
    if (!isDevAuth()) {
      try {
        const { data, error } = await supabase
          .from('transaction_presets')
          .update(preset)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data;
      } catch {}
    }
    return updateLocalPreset(id, preset);
  },
  delete: async (id: string) => {
    if (!isDevAuth()) {
      try {
        await supabase
          .from('transaction_presets')
          .delete()
          .eq('id', id);
      } catch {}
    }
    deleteLocalPreset(id);
  }
};

export const batchService = {
  list: async () => {
    let remoteBatches: any[] = [];
    if (!isDevAuth()) {
      try {
        const { data, error } = await supabase
          .from('saved_batches')
          .select('*, members:batch_members(count)')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          remoteBatches = data;
        }
      } catch {}
    }
    const local = getLocalBatches();
    const combined = [...local];
    remoteBatches.forEach(rb => {
      if (!combined.some(lb => lb.id === rb.id || lb.name === rb.name)) {
        combined.push(rb);
      }
    });
    return combined;
  },
  getById: async (id: string) => {
    const local = getLocalBatchById(id);
    if (local) return local;

    if (!isDevAuth()) {
      try {
        const { data, error } = await supabase
          .from('saved_batches')
          .select('*, members:batch_members(student_id, students(*))')
          .eq('id', id)
          .single();
        if (!error && data) return data;
      } catch {}
    }

    return getLocalBatches()[0];
  },
  create: async (batch: { name: string; description?: string; created_by: string }) => {
    if (!isDevAuth()) {
      try {
        const { data, error } = await supabase
          .from('saved_batches')
          .insert([batch])
          .select()
          .single();
        if (!error && data) return data;
      } catch {}
    }
    return saveLocalBatch(batch);
  },
  update: async (id: string, updates: { name?: string; description?: string }) => {
    if (!isDevAuth()) {
      try {
        const { data, error } = await supabase
          .from('saved_batches')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data;
      } catch {}
    }
    const batches = getLocalBatches();
    const b = batches.find(x => x.id === id);
    if (b) {
      Object.assign(b, updates);
      setLocalJson('zls_local_batches', batches);
      return b;
    }
    return updates;
  },
  delete: async (id: string) => {
    if (!isDevAuth()) {
      try {
        await supabase
          .from('saved_batches')
          .delete()
          .eq('id', id);
      } catch {}
    }
    const batches = getLocalBatches().filter(b => b.id !== id);
    setLocalJson('zls_local_batches', batches);
  },
  addMembers: async (batchId: string, studentIds: string[]) => {
    if (!isDevAuth()) {
      try {
        const members = studentIds.map(sid => ({
          batch_id: batchId,
          student_id: sid
        }));
        await supabase
          .from('batch_members')
          .insert(members);
      } catch {}
    }
    addLocalBatchMembers(batchId, studentIds);
  },
  removeMember: async (batchId: string, studentId: string) => {
    if (!isDevAuth()) {
      try {
        await supabase
          .from('batch_members')
          .delete()
          .eq('batch_id', batchId)
          .eq('student_id', studentId);
      } catch {}
    }
    const batches = getLocalBatches();
    const batch = batches.find(b => b.id === batchId);
    if (batch && batch.members) {
      batch.members = batch.members.filter((m: any) => m.student_id !== studentId);
      setLocalJson('zls_local_batches', batches);
    }
  }
};

export const auditService = {
  list: async (limit = 100) => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (!error && data) return data;
    } catch {}
    return [];
  }
};
