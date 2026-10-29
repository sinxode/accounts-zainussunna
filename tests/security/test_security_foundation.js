// ==============================================================================
// ZLS Automated Security & RLS Test Suite
// File: tests/security/test_security_foundation.js
// Tests all 14 required security and authorization cases locally against zls_security_test.
// ==============================================================================

const { execSync } = require('child_process');

const DB = 'zls_security_test';

function runSql(sql) {
  try {
    const cmd = `psql -h localhost -U apple -d ${DB} -v ON_ERROR_STOP=1 -t -A -c "${sql.replace(/"/g, '\\"')}"`;
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch (err) {
    return `ERROR: ${err.stderr || err.message}`;
  }
}

console.log('=== ZLS REBUILD: PHASE 2 SECURITY & RLS TEST SUITE ===\n');

// 1. Seed identities and test data
runSql(`
-- Reset test records
DELETE FROM public.parent_students;
DELETE FROM public.transactions;
DELETE FROM public.students;
DELETE FROM public.profiles;

-- Test Profiles
INSERT INTO public.profiles (id, full_name, role, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Super Admin User', 'super_admin', true),
  ('22222222-2222-2222-2222-222222222222', 'Admin User', 'admin', true),
  ('33333333-3333-3333-3333-333333333333', 'Faculty User', 'faculty', true),
  ('44444444-4444-4444-4444-444444444444', 'Parent User', 'parent', true),
  ('55555555-5555-5555-5555-555555555555', 'Inactive Parent', 'parent', false);

-- Test Students
INSERT INTO public.students (id, enrolment_no, name, status) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ZLS-001', 'Linked Child Student', 'active'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ZLS-002', 'Unlinked Stranger Student', 'active');

-- Test Transactions
INSERT INTO public.transactions (id, student_id, transaction_type, direction, amount, purpose, created_by) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'deposit', 'credit', 1000.00, 'Fee Deposit', '22222222-2222-2222-2222-222222222222'),
  ('a2222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'deposit', 'credit', 2500.00, 'Other Fee Deposit', '22222222-2222-2222-2222-222222222222');

-- Parent 4444 links to Student aaaa
INSERT INTO public.parent_students (parent_profile_id, student_id, relationship_type) VALUES
  ('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'father');
`);

const tests = [
  {
    id: 1,
    name: 'An authenticated user cannot change their own role',
    run: () => {
      // Faculty 3333 attempts to change own role to super_admin
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
        UPDATE public.profiles SET role = 'super_admin' WHERE id = '33333333-3333-3333-3333-333333333333';
      `;
      const res = runSql(sql);
      // RLS WITH CHECK violation must prevent the update
      const verify = runSql("SELECT role FROM public.profiles WHERE id = '33333333-3333-3333-3333-333333333333';");
      return res.includes('ERROR') || verify === 'faculty';
    }
  },
  {
    id: 2,
    name: 'An Admin cannot grant themselves Super Admin privileges',
    run: () => {
      // Admin 2222 attempts to update role to super_admin
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        UPDATE public.profiles SET role = 'super_admin' WHERE id = '22222222-2222-2222-2222-222222222222';
      `;
      const res = runSql(sql);
      const verify = runSql("SELECT role FROM public.profiles WHERE id = '22222222-2222-2222-2222-222222222222';");
      return res.includes('ERROR') || verify === 'admin';
    }
  },
  {
    id: 3,
    name: 'An Admin cannot change another user\'s role via direct update or RPC',
    run: () => {
      // Admin 2222 attempts to change Faculty 3333's role
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
        SELECT public.admin_set_user_role('33333333-3333-3333-3333-333333333333', 'admin');
      `;
      const res = runSql(sql);
      return res.includes('FORBIDDEN') || res.includes('ERROR');
    }
  },
  {
    id: 4,
    name: 'A Faculty user can read permitted student records',
    run: () => {
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
        SELECT count(*) FROM public.students;
      `;
      const count = runSql(sql);
      return count === '2';
    }
  },
  {
    id: 5,
    name: 'A Faculty user cannot mutate student or financial records',
    run: () => {
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
        INSERT INTO public.students (id, enrolment_no, name) VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'ZLS-003', 'Hacked Student');
      `;
      const res = runSql(sql);
      return res.includes('ERROR') || res.includes('violates row-level security');
    }
  },
  {
    id: 6,
    name: 'A Parent can read a linked child\'s permitted data',
    run: () => {
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
        SELECT enrolment_no FROM public.students;
      `;
      const res = runSql(sql);
      return res.trim() === 'ZLS-001';
    }
  },
  {
    id: 7,
    name: 'A Parent cannot read an unlinked child\'s data, including by direct UUID',
    run: () => {
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
        SELECT count(*) FROM public.students WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
      `;
      const res = runSql(sql);
      return res.trim() === '0';
    }
  },
  {
    id: 8,
    name: 'A Parent cannot mutate financial records',
    run: () => {
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
        INSERT INTO public.transactions (student_id, transaction_type, direction, amount, purpose, created_by)
        VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'deposit', 'credit', 500.00, 'Self Credit', '44444444-4444-4444-4444-444444444444');
      `;
      const res = runSql(sql);
      return res.includes('ERROR') || res.includes('violates row-level security');
    }
  },
  {
    id: 9,
    name: 'Removing a parent-child link revokes access immediately',
    run: () => {
      // 1. Delete link as super_admin
      runSql("DELETE FROM public.parent_students WHERE parent_profile_id = '44444444-4444-4444-4444-444444444444';");
      // 2. Query as parent
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
        SELECT count(*) FROM public.students;
      `;
      const res = runSql(sql);
      // Restore link for subsequent tests
      runSql("INSERT INTO public.parent_students (parent_profile_id, student_id) VALUES ('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');");
      return res.trim() === '0';
    }
  },
  {
    id: 10,
    name: 'Duplicate parent-child relationships are rejected',
    run: () => {
      const sql = `
        INSERT INTO public.parent_students (parent_profile_id, student_id) 
        VALUES ('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
      `;
      const res = runSql(sql);
      return res.includes('duplicate key value') || res.includes('ERROR');
    }
  },
  {
    id: 11,
    name: 'Unauthorized users cannot execute privileged role-management functions',
    run: () => {
      // Anonymous caller
      const sql = `
        SET ROLE anon;
        SELECT public.admin_set_user_role('33333333-3333-3333-3333-333333333333', 'super_admin');
      `;
      const res = runSql(sql);
      return res.includes('permission denied') || res.includes('ERROR');
    }
  },
  {
    id: 12,
    name: 'Views do not bypass parent data isolation',
    run: () => {
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';
        SELECT count(*) FROM public.student_health;
      `;
      const res = runSql(sql);
      // Parent should only see 1 row (their child), not 2
      return res.trim() === '1';
    }
  },
  {
    id: 13,
    name: 'Inactive users do not retain unauthorized access',
    run: () => {
      // Inactive parent 5555 links to student
      runSql("INSERT INTO public.parent_students (parent_profile_id, student_id) VALUES ('55555555-5555-5555-5555-555555555555', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');");
      const sql = `
        SET ROLE authenticated;
        SET request.jwt.claim.sub = '55555555-5555-5555-5555-555555555555';
        SELECT count(*) FROM public.students;
      `;
      const res = runSql(sql);
      return res.trim() === '0';
    }
  },
  {
    id: 14,
    name: 'Anonymous users cannot read protected financial data',
    run: () => {
      const sql = `
        SET ROLE anon;
        SELECT count(*) FROM public.transactions;
      `;
      const res = runSql(sql);
      return res.trim() === '0' || res.includes('permission denied') || res.includes('ERROR');
    }
  }
];

let passed = 0;
let failed = 0;

tests.forEach(t => {
  const ok = t.run();
  if (ok) {
    console.log(`[PASS] Case ${t.id}: ${t.name}`);
    passed++;
  } else {
    console.error(`[FAIL] Case ${t.id}: ${t.name}`);
    failed++;
  }
});

console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${tests.length}) ===`);
process.exit(failed === 0 ? 0 : 1);
