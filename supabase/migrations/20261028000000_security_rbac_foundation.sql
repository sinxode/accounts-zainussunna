-- ==============================================================================
-- ZLS REBUILD MIGRATION: Security, RBAC & Parent-Child Foundation
-- Version: 20261028000000_security_rbac_foundation.sql
-- Description:
--   1. Adds new canonical roles ('super_admin', 'admin', 'faculty', 'parent')
--      to user_role enum while maintaining backwards compatibility with legacy values.
--   2. Hardens 'profiles' table RLS against privilege self-escalation.
--   3. Introduces 'admin_set_user_role' SECURITY DEFINER function for trusted role updates.
--   4. Creates 'parent_students' relationship table for guardian-to-child data isolation.
--   5. Creates 'is_parent_of_student' trusted authorization helper.
--   6. Enforces strict RLS on 'students' and 'transactions' for Faculty and Parents.
--   7. Re-defines views with security_invoker on PostgreSQL 15+ to prevent RLS bypass.
-- ==============================================================================

-- 1. ENUM UPGRADE (Non-destructive extension of user_role)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'user_role' AND e.enumlabel = 'super_admin') THEN
    ALTER TYPE user_role ADD VALUE 'super_admin';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'user_role' AND e.enumlabel = 'admin') THEN
    ALTER TYPE user_role ADD VALUE 'admin';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'user_role' AND e.enumlabel = 'faculty') THEN
    ALTER TYPE user_role ADD VALUE 'faculty';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'user_role' AND e.enumlabel = 'parent') THEN
    ALTER TYPE user_role ADD VALUE 'parent';
  END IF;
END $$;

-- 2. PARENT-CHILD RELATIONSHIP TABLE
CREATE TABLE IF NOT EXISTS public.parent_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'guardian' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  UNIQUE(parent_profile_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_parent_students_parent ON public.parent_students(parent_profile_id);
CREATE INDEX IF NOT EXISTS idx_parent_students_student ON public.parent_students(student_id);

ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;

-- 3. TRUSTED PARENT AUTHORIZATION HELPER FUNCTION
CREATE OR REPLACE FUNCTION public.is_parent_of_student(p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.parent_students ps
    JOIN public.profiles p ON p.id = ps.parent_profile_id
    WHERE ps.student_id = p_student_id
      AND ps.parent_profile_id = auth.uid()
      AND p.role = 'parent'
      AND p.is_active = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_parent_of_student(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_parent_of_student(UUID) TO authenticated;

-- 4. HARDENED TRUSTED ROLE MANAGEMENT FUNCTION
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_target_user_id UUID,
  p_new_role public.user_role
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_caller_role public.user_role;
  v_old_role public.user_role;
BEGIN
  -- 1. Ensure authenticated caller
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED: Authentication required';
  END IF;

  -- 2. Verify caller is active super_admin (or legacy owner)
  SELECT role INTO v_caller_role 
  FROM public.profiles 
  WHERE id = auth.uid() AND is_active = true;
  
  IF v_caller_role IS NULL OR v_caller_role NOT IN ('super_admin', 'owner') THEN
    RAISE EXCEPTION 'FORBIDDEN: Only active Super Admin can assign user roles';
  END IF;

  -- 3. Verify target profile exists
  SELECT role INTO v_old_role 
  FROM public.profiles 
  WHERE id = p_target_user_id;
  
  IF v_old_role IS NULL THEN
    RAISE EXCEPTION 'NOT_FOUND: Target user profile does not exist';
  END IF;

  -- 4. Validate requested role is canonical
  IF p_new_role NOT IN ('super_admin', 'admin', 'faculty', 'parent') THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: Target role must be super_admin, admin, faculty, or parent';
  END IF;

  -- 5. Prevent sole super_admin lockout
  IF auth.uid() = p_target_user_id AND p_new_role != 'super_admin' THEN
    IF (SELECT count(*) FROM public.profiles WHERE role IN ('super_admin', 'owner') AND is_active = true) <= 1 THEN
      RAISE EXCEPTION 'PRECONDITION_FAILED: Cannot demote the sole active Super Admin';
    END IF;
  END IF;

  -- 6. Apply role update
  UPDATE public.profiles
  SET role = p_new_role
  WHERE id = p_target_user_id;

  -- 7. Audit log event
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity,
    entity_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    'ROLE_CHANGE',
    'profiles',
    p_target_user_id,
    jsonb_build_object('role', v_old_role),
    jsonb_build_object('role', p_new_role)
  );

  RETURN jsonb_build_object(
    'success', true,
    'target_user_id', p_target_user_id,
    'new_role', p_new_role
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_user_role(UUID, public.user_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(UUID, public.user_role) TO authenticated;

-- 5. RLS POLICIES FOR PROFILES (Privilege Escalation Prevention)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own non-sensitive profile fields" ON public.profiles;

-- Authenticated users can view active profiles
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

-- Users can ONLY update their own non-sensitive fields; role/is_active/permissions modifications are rejected
CREATE POLICY "Users can update own non-sensitive profile fields" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id AND is_active = true)
  WITH CHECK (
    auth.uid() = id
    AND role IS NOT DISTINCT FROM (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
    AND is_active IS NOT DISTINCT FROM (SELECT p.is_active FROM public.profiles p WHERE p.id = auth.uid())
    AND permissions IS NOT DISTINCT FROM (SELECT p.permissions FROM public.profiles p WHERE p.id = auth.uid())
  );

-- Super admin can update any profile
CREATE POLICY "Super admin can update any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'owner') AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'owner') AND is_active = true
    )
  );

-- 6. RLS POLICIES FOR PARENT_STUDENTS
DROP POLICY IF EXISTS "Parents view linked children links only" ON public.parent_students;
DROP POLICY IF EXISTS "Admins manage parent student links" ON public.parent_students;

CREATE POLICY "Parents view linked children links only" ON public.parent_students
  FOR SELECT TO authenticated
  USING (
    parent_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'faculty', 'owner', 'manager') AND is_active = true
    )
  );

CREATE POLICY "Admins manage parent student links" ON public.parent_students
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'owner', 'manager') AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'owner', 'manager') AND is_active = true
    )
  );

-- 7. RLS POLICIES FOR STUDENTS (Faculty & Parent Scoping)
DROP POLICY IF EXISTS "Students are viewable by authenticated users" ON public.students;
DROP POLICY IF EXISTS "Students viewable by authorized roles and parents" ON public.students;
DROP POLICY IF EXISTS "Admins can insert students" ON public.students;
DROP POLICY IF EXISTS "Admins can update students" ON public.students;
DROP POLICY IF EXISTS "Super admins can delete students" ON public.students;
DROP POLICY IF EXISTS "Staff can insert students" ON public.students;
DROP POLICY IF EXISTS "Managers can update students" ON public.students;

-- Staff, Faculty, Admin, Super Admin see all students; Parents ONLY see linked children
CREATE POLICY "Students viewable by authorized roles and parents" ON public.students
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'faculty', 'owner', 'manager', 'staff') AND is_active = true
    )
    OR public.is_parent_of_student(students.id)
  );

CREATE POLICY "Admins can insert students" ON public.students
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'owner', 'manager') AND is_active = true
    )
  );

CREATE POLICY "Admins can update students" ON public.students
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'owner', 'manager') AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'owner', 'manager') AND is_active = true
    )
  );

CREATE POLICY "Super admins can delete students" ON public.students
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'owner') AND is_active = true
    )
  );

-- 8. RLS POLICIES FOR TRANSACTIONS
DROP POLICY IF EXISTS "Transactions viewable by authenticated" ON public.transactions;
DROP POLICY IF EXISTS "Transactions viewable by authorized roles and parents" ON public.transactions;
DROP POLICY IF EXISTS "Staff can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Staff can delete transactions" ON public.transactions;
DROP POLICY IF EXISTS "Staff can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can insert transactions" ON public.transactions;

CREATE POLICY "Transactions viewable by authorized roles and parents" ON public.transactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'faculty', 'owner', 'manager', 'staff') AND is_active = true
    )
    OR public.is_parent_of_student(transactions.student_id)
  );

CREATE POLICY "Admins can insert transactions" ON public.transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'owner', 'manager') AND is_active = true
    )
  );

-- 9. RE-DEFINE VIEWS WITH CLEAN CASCADE AND CONDITIONAL SECURITY INVOKER
DROP VIEW IF EXISTS public.student_ledger_view CASCADE;
DROP VIEW IF EXISTS public.student_health CASCADE;
DROP VIEW IF EXISTS public.student_balances CASCADE;

CREATE VIEW public.student_balances AS
SELECT 
  student_id,
  SUM(
    CASE 
      WHEN direction = 'credit' THEN amount 
      ELSE -amount 
    END
  ) as current_balance,
  MAX(transaction_date) as last_transaction_date,
  COUNT(id) as transaction_count
FROM public.transactions
WHERE is_reversed = false
GROUP BY student_id;

CREATE VIEW public.student_health AS
SELECT 
  s.*,
  COALESCE(b.current_balance, 0) as current_balance,
  b.last_transaction_date,
  CASE 
    WHEN COALESCE(b.current_balance, 0) < 0 THEN 'negative'
    WHEN COALESCE(b.current_balance, 0) = 0 THEN 'empty'
    WHEN COALESCE(b.current_balance, 0) < 500 THEN 'low'
    ELSE 'healthy'
  END as health_status
FROM public.students s
LEFT JOIN public.student_balances b ON s.id = b.student_id;

CREATE VIEW public.student_ledger_view AS
SELECT 
  t.id as transaction_id,
  t.student_id,
  s.name as student_name,
  t.transaction_date,
  t.transaction_type,
  t.direction,
  t.amount,
  t.purpose,
  t.operation_id,
  t.is_reversed,
  SUM(
    CASE 
      WHEN t.is_reversed = true THEN 0
      WHEN t.direction = 'credit' THEN t.amount 
      ELSE -t.amount 
    END
  ) OVER (PARTITION BY t.student_id ORDER BY t.transaction_date, t.id) as running_balance
FROM public.transactions t
JOIN public.students s ON t.student_id = s.id
ORDER BY t.student_id, t.transaction_date DESC, t.id DESC;

-- Enable security_invoker if PostgreSQL >= 15 (Supabase production is PG 17)
-- For PostgreSQL < 15, transfer view ownership to authenticated to prevent superuser RLS bypass
DO $$
BEGIN
  IF current_setting('server_version_num')::int >= 150000 THEN
    EXECUTE 'ALTER VIEW public.student_balances SET (security_invoker = true)';
    EXECUTE 'ALTER VIEW public.student_health SET (security_invoker = true)';
    EXECUTE 'ALTER VIEW public.student_ledger_view SET (security_invoker = true)';
  ELSE
    EXECUTE 'ALTER VIEW public.student_balances OWNER TO authenticated';
    EXECUTE 'ALTER VIEW public.student_health OWNER TO authenticated';
    EXECUTE 'ALTER VIEW public.student_ledger_view OWNER TO authenticated';
  END IF;
END $$;
