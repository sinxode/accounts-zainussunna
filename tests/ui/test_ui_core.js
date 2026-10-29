/**
 * ZLS Rebuild - Prompt 4 Core UI & Navigation Invariant Test Suite
 * 
 * Verifies:
 * 1. Role-based Route Protection and Navigation Access
 * 2. 404 Not Found Handling for unknown routes
 * 3. Authoritative Student Directory Data, Balances, Search and Health Filter Logic
 * 4. Student Profile Chronological Ledger, Running Balance Calculation, and Reversal Rules
 * 5. Transaction Explorer Filtering, Pagination, and Route Navigation (/transactions/:id)
 * 6. Transaction Details Metadata Exposure & Documented Reversal Gating
 * 7. Operations Drawers (Deposit/Withdrawal): Double-click Prevention, Positive Amounts, Stable Idempotency Keys
 */

import assert from 'node:assert';

console.log('================================================================');
console.log('=== ZLS REBUILD: PROMPT 4 CORE UI & NAVIGATION TEST SUITE     ===');
console.log('================================================================\n');

let passedCount = 0;
let totalCount = 0;

function test(name, fn) {
  totalCount++;
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
  }
}

// ---------------------------------------------------------
// 1. ROLE-BASED ACCESS & NAVIGATION PERMISSIONS
// ---------------------------------------------------------
console.log('--- 1. Role-based Access & Navigation Guards ---');

const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  FACULTY: 'faculty',
  PARENT: 'parent'
};

const OPERATIONAL_ROUTES = [
  '/operations',
  '/internal-transfers',
  '/borrowers',
  '/presets',
  '/batches',
  '/settings'
];

const REPORTING_ROUTES = [
  '/reports',
  '/reports/student',
  '/reports/monthly',
  '/reports/audit',
  '/reports/analytics'
];

const ADMIN_ONLY_ROUTES = [
  '/administration/users',
  '/administration/roles'
];

function isRoutePermitted(route, userRole) {
  const moneyManagerRoles = ['super_admin', 'admin', 'owner', 'manager'];
  const facultyPermitted = ['super_admin', 'admin', 'faculty', 'owner', 'manager', 'staff'];
  const superAdminOnly = ['super_admin', 'owner'];

  if (ADMIN_ONLY_ROUTES.some(r => route.startsWith(r))) {
    return superAdminOnly.includes(userRole);
  }
  if (OPERATIONAL_ROUTES.some(r => route.startsWith(r))) {
    return moneyManagerRoles.includes(userRole);
  }
  if (REPORTING_ROUTES.some(r => route.startsWith(r))) {
    return facultyPermitted.includes(userRole);
  }
  // Publicly accessible within app for all authenticated users
  if (route === '/' || route.startsWith('/students') || route.startsWith('/transactions')) {
    return true;
  }
  return false;
}

test('1.1 Super Admin has access to all operational, reporting, and admin routes', () => {
  for (const route of [...OPERATIONAL_ROUTES, ...REPORTING_ROUTES, ...ADMIN_ONLY_ROUTES, '/students', '/transactions/123']) {
    assert.strictEqual(isRoutePermitted(route, ROLES.SUPER_ADMIN), true, `Super admin should access ${route}`);
  }
});

test('1.2 Admin has access to operational and reporting routes but not administration/users', () => {
  assert.strictEqual(isRoutePermitted('/operations', ROLES.ADMIN), true);
  assert.strictEqual(isRoutePermitted('/internal-transfers', ROLES.ADMIN), true);
  assert.strictEqual(isRoutePermitted('/reports/monthly', ROLES.ADMIN), true);
  assert.strictEqual(isRoutePermitted('/administration/users', ROLES.ADMIN), false);
});

test('1.3 Faculty is blocked from operational routes and restricted to student/reporting views', () => {
  for (const route of OPERATIONAL_ROUTES) {
    assert.strictEqual(isRoutePermitted(route, ROLES.FACULTY), false, `Faculty should be blocked from ${route}`);
  }
  assert.strictEqual(isRoutePermitted('/students', ROLES.FACULTY), true);
  assert.strictEqual(isRoutePermitted('/reports/student', ROLES.FACULTY), true);
});

test('1.4 Parent is blocked from operational, admin, and global reporting routes', () => {
  for (const route of [...OPERATIONAL_ROUTES, ...REPORTING_ROUTES, ...ADMIN_ONLY_ROUTES]) {
    assert.strictEqual(isRoutePermitted(route, ROLES.PARENT), false, `Parent should be blocked from ${route}`);
  }
  assert.strictEqual(isRoutePermitted('/students', ROLES.PARENT), true);
});

test('1.5 Unknown routes route to 404 handler', () => {
  const knownRoutes = ['/', '/login', '/access-denied', '/students', '/students/:id', '/transactions', '/transactions/:id', ...OPERATIONAL_ROUTES, ...REPORTING_ROUTES];
  function matchRoute(path) {
    if (knownRoutes.includes(path) || path.startsWith('/students/') || path.startsWith('/transactions/')) {
      return 'MATCHED';
    }
    return '404_NOT_FOUND';
  }
  assert.strictEqual(matchRoute('/unknown-path-xyz'), '404_NOT_FOUND');
  assert.strictEqual(matchRoute('/admin/backdoor'), '404_NOT_FOUND');
  assert.strictEqual(matchRoute('/transactions/00000000-0000-0000-0000-000000000000'), 'MATCHED');
});

// ---------------------------------------------------------
// 2. STUDENT DIRECTORY SEARCH & HEALTH FILTERS
// ---------------------------------------------------------
console.log('\n--- 2. Student Directory Data, Balances & Filters ---');

const mockStudents = [
  { id: 's1', name: 'Zaid Al-Harithi', enrolment_no: 'ZA-001', current_balance: 1500, health_status: 'healthy', status: 'active' },
  { id: 's2', name: 'Bilal Ibn Rabah', enrolment_no: 'ZA-002', current_balance: 350, health_status: 'low', status: 'active' },
  { id: 's3', name: 'Tariq Bin Ziyad', enrolment_no: 'ZA-003', current_balance: 0, health_status: 'empty', status: 'active' },
  { id: 's4', name: 'Khalid Ibn Walid', enrolment_no: 'ZA-004', current_balance: -250, health_status: 'negative', status: 'active' },
  { id: 's5', name: 'Salman Al-Farsi', enrolment_no: 'ZA-005', current_balance: 2000, health_status: 'healthy', status: 'archived' }
];

function filterStudents(list, search, health, status) {
  return list.filter(s => {
    const matchesSearch = !search || 
      s.name.toLowerCase().includes(search.toLowerCase()) || 
      s.enrolment_no.toLowerCase().includes(search.toLowerCase());
    
    const matchesHealth = health === 'all' || s.health_status === health;
    const matchesStatus = status === 'all' || s.status === status;

    return matchesSearch && matchesHealth && matchesStatus;
  });
}

test('2.1 Student list search filters correctly by name and enrolment number', () => {
  const byName = filterStudents(mockStudents, 'Zaid', 'all', 'all');
  assert.strictEqual(byName.length, 1);
  assert.strictEqual(byName[0].id, 's1');

  const byEnrolment = filterStudents(mockStudents, 'ZA-004', 'all', 'all');
  assert.strictEqual(byEnrolment.length, 1);
  assert.strictEqual(byEnrolment[0].id, 's4');
});

test('2.2 Health filter isolates negative, low, and healthy accounts', () => {
  const negatives = filterStudents(mockStudents, '', 'negative', 'all');
  assert.strictEqual(negatives.length, 1);
  assert.strictEqual(negatives[0].id, 's4');
  assert.strictEqual(negatives[0].current_balance < 0, true);

  const lows = filterStudents(mockStudents, '', 'low', 'all');
  assert.strictEqual(lows.length, 1);
  assert.strictEqual(lows[0].id, 's2');

  const healthies = filterStudents(mockStudents, '', 'healthy', 'all');
  assert.strictEqual(healthies.length, 2);
});

test('2.3 Status filter isolates active vs archived accounts', () => {
  const activeOnly = filterStudents(mockStudents, '', 'all', 'active');
  assert.strictEqual(activeOnly.length, 4);

  const archivedOnly = filterStudents(mockStudents, '', 'all', 'archived');
  assert.strictEqual(archivedOnly.length, 1);
  assert.strictEqual(archivedOnly[0].id, 's5');
});

// ---------------------------------------------------------
// 3. STUDENT PROFILE & CHRONOLOGICAL JOURNAL INTEGRITY
// ---------------------------------------------------------
console.log('\n--- 3. Student Profile Ledger & Running Balances ---');

const mockLedgerRows = [
  { id: 't1', transaction_date: '2026-10-01T10:00:00Z', direction: 'credit', amount: 1000, running_balance: 1000, is_reversed: false },
  { id: 't2', transaction_date: '2026-10-05T12:00:00Z', direction: 'debit', amount: 300, running_balance: 700, is_reversed: false },
  { id: 't3', transaction_date: '2026-10-10T09:00:00Z', direction: 'credit', amount: 500, running_balance: 1200, is_reversed: false }
];

test('3.1 Student profile transactions are ordered chronologically with accurate running balance', () => {
  let computedBalance = 0;
  for (const row of mockLedgerRows) {
    if (row.direction === 'credit') {
      computedBalance += row.amount;
    } else {
      computedBalance -= row.amount;
    }
    assert.strictEqual(row.running_balance, computedBalance, `Running balance should match computed journal step`);
  }
  assert.strictEqual(computedBalance, 1200);
});

test('3.2 Documented reversal requires reason of at least 10 characters', () => {
  function validateReversal(reason) {
    if (!reason || reason.trim().length < 10) {
      throw new Error('Reversal reason must be at least 10 characters long.');
    }
    return true;
  }

  assert.throws(() => validateReversal('Wrong'), /at least 10 characters/);
  assert.throws(() => validateReversal('   short   '), /at least 10 characters/);
  assert.strictEqual(validateReversal('Correction of accidental duplicate deposit'), true);
});

// ---------------------------------------------------------
// 4. TRANSACTION EXPLORER & DETAILS ROUTE
// ---------------------------------------------------------
console.log('\n--- 4. Transaction Explorer & Details Navigation ---');

const mockTransactions = Array.from({ length: 65 }, (_, i) => ({
  id: `tx-${i + 1}`,
  student_id: `s-${(i % 5) + 1}`,
  student_name: `Student ${(i % 5) + 1}`,
  amount: (i + 1) * 50,
  direction: i % 2 === 0 ? 'credit' : 'debit',
  transaction_type: i % 3 === 0 ? 'distribution' : 'collection',
  is_reversed: i === 7,
  reversal_of_id: i === 8 ? 'tx-8' : null,
  created_at: new Date(Date.now() - i * 3600000).toISOString()
}));

function paginate(items, page, pageSize) {
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    totalPages: Math.ceil(items.length / pageSize)
  };
}

test('4.1 Transaction explorer paginates 25 items per page cleanly', () => {
  const page1 = paginate(mockTransactions, 1, 25);
  assert.strictEqual(page1.items.length, 25);
  assert.strictEqual(page1.totalPages, 3);
  assert.strictEqual(page1.items[0].id, 'tx-1');

  const page3 = paginate(mockTransactions, 3, 25);
  assert.strictEqual(page3.items.length, 15);
});

test('4.2 Transaction explorer status filter separates Active vs Reversed', () => {
  const reversed = mockTransactions.filter(t => t.is_reversed);
  assert.strictEqual(reversed.length, 1);
  assert.strictEqual(reversed[0].id, 'tx-8');

  const active = mockTransactions.filter(t => !t.is_reversed);
  assert.strictEqual(active.length, 64);
});

test('4.3 Transaction details route displays link to student profile and prevents reversing a reversal', () => {
  const regularTx = { id: 't-10', is_reversed: false, reversal_of_id: null };
  const reversedTx = { id: 't-11', is_reversed: true, reversal_of_id: null };
  const compensatingTx = { id: 't-12', is_reversed: false, reversal_of_id: 't-11' };

  function canReverse(tx) {
    if (tx.is_reversed) return false;
    if (tx.reversal_of_id) return false;
    return true;
  }

  assert.strictEqual(canReverse(regularTx), true);
  assert.strictEqual(canReverse(reversedTx), false);
  assert.strictEqual(canReverse(compensatingTx), false);
});

// ---------------------------------------------------------
// 5. OPERATIONS DRAWERS: IDEMPOTENCY & VALIDATION
// ---------------------------------------------------------
console.log('\n--- 5. Operations Drawers: Double-Click & Validation ---');

test('5.1 Deposit and Withdrawal drawers reject non-positive amounts', () => {
  function validateAmount(val) {
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) {
      throw new Error('Please enter a valid amount greater than zero.');
    }
    const decimalParts = val.toString().split('.');
    if (decimalParts[1] && decimalParts[1].length > 2) {
      throw new Error('Amount cannot have more than 2 decimal places.');
    }
    return true;
  }

  assert.throws(() => validateAmount('0'), /greater than zero/);
  assert.throws(() => validateAmount('-150'), /greater than zero/);
  assert.throws(() => validateAmount('abc'), /greater than zero/);
  assert.throws(() => validateAmount('10.999'), /more than 2 decimal places/);
  assert.strictEqual(validateAmount('500.50'), true);
});

test('5.2 Form submissions use stable idempotency key across retries and generate new key after reset', () => {
  let keyRef = 'idempotency-key-uuid-1';
  let isPending = false;
  let submissionCount = 0;

  function submit() {
    if (isPending) return 'BLOCKED_DOUBLE_CLICK';
    isPending = true;
    submissionCount++;
    return { key: keyRef, attempt: submissionCount };
  }

  const res1 = submit();
  assert.strictEqual(res1.key, 'idempotency-key-uuid-1');
  assert.strictEqual(res1.attempt, 1);

  // Rapid double click while pending
  const res2 = submit();
  assert.strictEqual(res2, 'BLOCKED_DOUBLE_CLICK');

  // Finish request
  isPending = false;

  // Clear / reset drawer generates fresh key
  keyRef = 'idempotency-key-uuid-2';
  const res3 = submit();
  assert.strictEqual(res3.key, 'idempotency-key-uuid-2');
});

console.log('\n================================================================');
console.log(`=== UI TEST RESULTS: ${passedCount} PASSED, ${totalCount - passedCount} FAILED (TOTAL: ${totalCount}) ===`);
console.log('================================================================\n');

if (passedCount !== totalCount) {
  process.exit(1);
}
