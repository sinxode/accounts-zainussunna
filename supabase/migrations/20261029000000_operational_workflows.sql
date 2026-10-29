-- ==============================================================================
-- ZLS REBUILD — PHASE 5: OPERATIONAL WORKFLOWS, LENDING, PERIODS & AUDIT LOGS
-- Migration: 20261029000000_operational_workflows.sql
-- Description:
--   1. Accounting Periods: Database-level period locking enforcement & admin RPC.
--   2. User Administration: Super-admin user activation/deactivation RPC & self-lockout guard.
--   3. Audit Logs: Read-only access for Admins/Super-Admins; immutable against direct client writes.
--   4. Saved Batches & Batch Members: Role-based RLS policies for draft-batch isolation.
--   5. Transaction Presets: Role-based RLS policies for reusable templates.
--   6. Borrowers, Loans & Recoveries: RLS policies enforcing money-manager access & immutable recovery.
--   7. Settings: Validation RPC and audit logging for system configuration keys.
--   8. Notifications: User-scoped isolation policy preventing cross-user data leakage.
-- ==============================================================================

-- 1. ACCOUNTING PERIODS SECURITY & TRUSTED ENFORCEMENT
ALTER TABLE public.accounting_periods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Accounting periods viewable by authenticated users" ON public.accounting_periods;
DROP POLICY IF EXISTS "Accounting periods manageable by admins" ON public.accounting_periods;

CREATE POLICY "Accounting periods viewable by authenticated users" ON public.accounting_periods
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Accounting periods manageable by admins" ON public.accounting_periods
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin', 'owner') 
        AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin', 'owner') 
        AND is_active = true
    )
  );

-- RPC: Set Accounting Period Lock State
CREATE OR REPLACE FUNCTION public.rpc_set_accounting_period_lock(
  p_year INT,
  p_month INT,
  p_lock BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_actor_id UUID;
  v_role public.user_role;
  v_period public.accounting_periods%ROWTYPE;
BEGIN
  -- 1. Verify authenticated financial admin
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED: Authentication required';
  END IF;

  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = v_actor_id AND is_active = true;

  IF v_role IS NULL OR v_role NOT IN ('super_admin', 'admin', 'owner') THEN
    RAISE EXCEPTION 'FORBIDDEN: Only Financial Administrators can manage accounting periods';
  END IF;

  -- 2. Validate input parameters
  IF p_year IS NULL OR p_year < 2020 OR p_year > 2100 THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: Year must be between 2020 and 2100';
  END IF;
  IF p_month IS NULL OR p_month < 1 OR p_month > 12 THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: Month must be between 1 and 12';
  END IF;

  -- 3. Upsert accounting period lock state
  INSERT INTO public.accounting_periods (
    period_year,
    period_month,
    is_locked,
    locked_at,
    locked_by
  ) VALUES (
    p_year,
    p_month,
    p_lock,
    CASE WHEN p_lock THEN now() ELSE NULL END,
    CASE WHEN p_lock THEN v_actor_id ELSE NULL END
  )
  ON CONFLICT (period_year, period_month) DO UPDATE
  SET is_locked = EXCLUDED.is_locked,
      locked_at = EXCLUDED.locked_at,
      locked_by = EXCLUDED.locked_by
  RETURNING * INTO v_period;

  -- 4. Record audit log
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity,
    entity_id,
    new_values
  ) VALUES (
    v_actor_id,
    CASE WHEN p_lock THEN 'LOCK_ACCOUNTING_PERIOD' ELSE 'UNLOCK_ACCOUNTING_PERIOD' END,
    'accounting_periods',
    v_period.id,
    jsonb_build_object(
      'period_year', p_year,
      'period_month', p_month,
      'is_locked', p_lock,
      'locked_by', v_actor_id
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'period', row_to_json(v_period)
  );
END;
$$;


-- 2. USER ADMINISTRATION: ACTIVATION & DEACTIVATION
CREATE OR REPLACE FUNCTION public.admin_set_user_active(
  p_target_user_id UUID,
  p_is_active BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_caller_role public.user_role;
  v_old_active BOOLEAN;
  v_updated_profile public.profiles%ROWTYPE;
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
    RAISE EXCEPTION 'FORBIDDEN: Only active Super Admin can activate or deactivate users';
  END IF;

  -- 3. Prevent self-deactivation (Lockout protection)
  IF auth.uid() = p_target_user_id AND p_is_active = false THEN
    RAISE EXCEPTION 'INVALID_OPERATION: Super Admin cannot deactivate their own account';
  END IF;

  -- 4. Verify target profile exists
  SELECT is_active INTO v_old_active 
  FROM public.profiles 
  WHERE id = p_target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: User profile % does not exist', p_target_user_id;
  END IF;

  -- 5. Update user active status
  UPDATE public.profiles
  SET is_active = p_is_active
  WHERE id = p_target_user_id
  RETURNING * INTO v_updated_profile;

  -- 6. Record audit log
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity,
    entity_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    CASE WHEN p_is_active THEN 'REACTIVATE_USER' ELSE 'DEACTIVATE_USER' END,
    'profiles',
    p_target_user_id,
    jsonb_build_object('is_active', v_old_active),
    jsonb_build_object('is_active', p_is_active)
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_target_user_id,
    'is_active', p_is_active
  );
END;
$$;


-- 3. AUDIT LOGS SECURITY
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Audit logs viewable by staff" ON public.audit_logs;
DROP POLICY IF EXISTS "Audit logs manageable by staff" ON public.audit_logs;
DROP POLICY IF EXISTS "Audit logs insertable by staff" ON public.audit_logs;
DROP POLICY IF EXISTS "Audit logs viewable by admins only" ON public.audit_logs;

CREATE POLICY "Audit logs viewable by admins only" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin', 'owner') 
        AND is_active = true
    )
  );

-- Direct client INSERT/UPDATE/DELETE on audit_logs remains blocked by having no write policies.


-- 4. SAVED BATCHES & BATCH MEMBERS RLS
ALTER TABLE public.saved_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Batches viewable by authenticated" ON public.saved_batches;
DROP POLICY IF EXISTS "Users can insert batches" ON public.saved_batches;
DROP POLICY IF EXISTS "Users can update own batches" ON public.saved_batches;
DROP POLICY IF EXISTS "Users can delete own batches" ON public.saved_batches;
DROP POLICY IF EXISTS "Saved batches viewable by staff" ON public.saved_batches;
DROP POLICY IF EXISTS "Saved batches manageable by admins" ON public.saved_batches;

CREATE POLICY "Saved batches viewable by staff" ON public.saved_batches
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin', 'faculty', 'owner', 'manager') 
        AND is_active = true
    )
  );

CREATE POLICY "Saved batches manageable by admins" ON public.saved_batches
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin', 'owner', 'manager') 
        AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin', 'owner', 'manager') 
        AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Batch members viewable by authenticated" ON public.batch_members;
DROP POLICY IF EXISTS "Staff can insert batch members" ON public.batch_members;
DROP POLICY IF EXISTS "Staff can delete batch members" ON public.batch_members;
DROP POLICY IF EXISTS "Batch members viewable by staff" ON public.batch_members;
DROP POLICY IF EXISTS "Batch members manageable by admins" ON public.batch_members;

CREATE POLICY "Batch members viewable by staff" ON public.batch_members
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin', 'faculty', 'owner', 'manager') 
        AND is_active = true
    )
  );

CREATE POLICY "Batch members manageable by admins" ON public.batch_members
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin', 'owner', 'manager') 
        AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin', 'owner', 'manager') 
        AND is_active = true
    )
  );


-- 5. TRANSACTION PRESETS RLS
ALTER TABLE public.transaction_presets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Presets viewable by staff" ON public.transaction_presets;
DROP POLICY IF EXISTS "Presets manageable by admins" ON public.transaction_presets;

CREATE POLICY "Presets viewable by staff" ON public.transaction_presets
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin', 'faculty', 'owner', 'manager') 
        AND is_active = true
    )
  );

CREATE POLICY "Presets manageable by admins" ON public.transaction_presets
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin', 'owner', 'manager') 
        AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin', 'owner', 'manager') 
        AND is_active = true
    )
  );


-- 6. BORROWERS, LOANS & RECOVERIES RLS
ALTER TABLE public.borrowers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrower_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recoveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Borrowers viewable by authenticated" ON public.borrowers;
DROP POLICY IF EXISTS "Staff can manage borrowers" ON public.borrowers;
DROP POLICY IF EXISTS "Borrowers viewable by money managers" ON public.borrowers;
DROP POLICY IF EXISTS "Borrowers manageable by money managers" ON public.borrowers;
DROP POLICY IF EXISTS "Borrowers updatable by money managers" ON public.borrowers;

CREATE POLICY "Borrowers viewable by money managers" ON public.borrowers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin', 'owner', 'manager') 
        AND is_active = true
    )
  );

CREATE POLICY "Borrowers manageable by money managers" ON public.borrowers
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin', 'owner', 'manager') 
        AND is_active = true
    )
  );

CREATE POLICY "Borrowers updatable by money managers" ON public.borrowers
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin', 'owner', 'manager') 
        AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin', 'owner', 'manager') 
        AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Borrower loans viewable by authenticated" ON public.borrower_loans;
DROP POLICY IF EXISTS "Staff can manage borrower loans" ON public.borrower_loans;
DROP POLICY IF EXISTS "Borrower loans viewable by money managers" ON public.borrower_loans;
DROP POLICY IF EXISTS "Borrower loans insertable by money managers" ON public.borrower_loans;

CREATE POLICY "Borrower loans viewable by money managers" ON public.borrower_loans
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin', 'owner', 'manager') 
        AND is_active = true
    )
  );

CREATE POLICY "Borrower loans insertable by money managers" ON public.borrower_loans
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin', 'owner', 'manager') 
        AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Recoveries viewable by authenticated" ON public.recoveries;
DROP POLICY IF EXISTS "Staff can manage recoveries" ON public.recoveries;
DROP POLICY IF EXISTS "Recoveries viewable by money managers" ON public.recoveries;
CREATE POLICY "Recoveries viewable by money managers" ON public.recoveries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin', 'owner', 'manager') 
        AND is_active = true
    )
  );


-- 7. SETTINGS RLS & RPC
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Settings viewable by authenticated users" ON public.settings;
DROP POLICY IF EXISTS "Staff can manage settings" ON public.settings;
DROP POLICY IF EXISTS "Settings viewable by authenticated" ON public.settings;
DROP POLICY IF EXISTS "Settings manageable by admins" ON public.settings;

-- Also clean up legacy unversioned event policies
DROP POLICY IF EXISTS "Event participants viewable by authenticated" ON public.event_participants;
DROP POLICY IF EXISTS "Staff can manage event participants" ON public.event_participants;
DROP POLICY IF EXISTS "Event templates viewable by authenticated" ON public.event_templates;
DROP POLICY IF EXISTS "Staff can manage event templates" ON public.event_templates;

CREATE POLICY "Settings viewable by authenticated" ON public.settings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Settings manageable by admins" ON public.settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin', 'owner') 
        AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin', 'owner') 
        AND is_active = true
    )
  );

CREATE OR REPLACE FUNCTION public.rpc_update_setting(
  p_key TEXT,
  p_value JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_actor_id UUID;
  v_role public.user_role;
  v_old_value JSONB;
BEGIN
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED: Authentication required';
  END IF;

  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = v_actor_id AND is_active = true;

  IF v_role IS NULL OR v_role NOT IN ('super_admin', 'admin', 'owner') THEN
    RAISE EXCEPTION 'FORBIDDEN: Only Financial Administrators can update system settings';
  END IF;

  IF p_key IS NULL OR length(trim(p_key)) = 0 THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: Setting key is required';
  END IF;

  SELECT value INTO v_old_value
  FROM public.settings
  WHERE key = p_key;

  INSERT INTO public.settings (key, value, updated_at)
  VALUES (p_key, p_value, now())
  ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value,
      updated_at = EXCLUDED.updated_at;

  -- Record audit log
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity,
    entity_id,
    old_values,
    new_values
  ) VALUES (
    v_actor_id,
    'UPDATE_SETTING',
    'settings',
    gen_random_uuid(),
    jsonb_build_object('key', p_key, 'value', v_old_value),
    jsonb_build_object('key', p_key, 'value', p_value)
  );

  RETURN jsonb_build_object(
    'success', true,
    'key', p_key,
    'value', p_value
  );
END;
$$;


-- 8. NOTIFICATIONS RLS (Strict user-isolation)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can create notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role IN ('super_admin', 'admin', 'owner') 
        AND is_active = true
    )
  );


-- 9. ENHANCED BULK TRANSACTION COMPOSER RPC
-- Handles multi-row atomicity, per-row period validation, and shared idempotency key
CREATE OR REPLACE FUNCTION public.rpc_post_bulk_transactions(
  p_transactions JSONB,
  p_operation_id UUID DEFAULT NULL,
  p_idempotency_key UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_actor_id UUID;
  v_op_id UUID;
  v_item JSONB;
  v_student_id UUID;
  v_type public.transaction_type;
  v_dir public.transaction_direction;
  v_amount NUMERIC(12, 2);
  v_purpose TEXT;
  v_tx_date TIMESTAMPTZ;
  v_student_status TEXT;
  v_created_ids JSONB := '[]'::jsonb;
  v_new_tx public.transactions%ROWTYPE;
  v_first BOOLEAN := true;
  v_existing_op_id UUID;
BEGIN
  -- 1. Authorization check
  v_actor_id := public.check_is_financial_admin();

  -- 2. Array check
  IF p_transactions IS NULL OR jsonb_array_length(p_transactions) = 0 THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: Bulk transactions array cannot be empty';
  END IF;

  v_op_id := COALESCE(p_operation_id, gen_random_uuid());

  -- 3. Idempotency check for bulk operation
  IF p_idempotency_key IS NOT NULL THEN
    SELECT operation_id INTO v_existing_op_id
    FROM public.transactions
    WHERE idempotency_key = p_idempotency_key
    LIMIT 1;

    IF v_existing_op_id IS NOT NULL THEN
      SELECT jsonb_agg(row_to_json(t)) INTO v_created_ids
      FROM public.transactions t
      WHERE operation_id = v_existing_op_id;

      RETURN jsonb_build_object(
        'success', true,
        'idempotent_replay', true,
        'operation_id', v_existing_op_id,
        'transactions', v_created_ids
      );
    END IF;
  END IF;

  -- 4. Process each entry atomically
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_transactions)
  LOOP
    v_student_id := (v_item->>'student_id')::UUID;
    v_type := (v_item->>'transaction_type')::public.transaction_type;
    v_dir := (v_item->>'direction')::public.transaction_direction;
    v_amount := (v_item->>'amount')::NUMERIC(12, 2);
    v_purpose := trim(v_item->>'purpose');
    v_tx_date := COALESCE((v_item->>'transaction_date')::TIMESTAMPTZ, clock_timestamp());

    -- Validate period unlocked for each item's date
    PERFORM public.check_period_unlocked(v_tx_date);

    IF v_amount IS NULL OR v_amount <= 0 THEN
      RAISE EXCEPTION 'INVALID_ARGUMENT: Amount must be greater than zero';
    END IF;
    IF v_amount != ROUND(v_amount, 2) THEN
      RAISE EXCEPTION 'INVALID_ARGUMENT: Amount cannot have more than 2 decimal places';
    END IF;
    IF v_purpose IS NULL OR length(v_purpose) = 0 THEN
      RAISE EXCEPTION 'INVALID_ARGUMENT: Purpose is required for all bulk items';
    END IF;

    -- Validate and lock student
    SELECT status INTO v_student_status
    FROM public.students
    WHERE id = v_student_id
    FOR UPDATE;

    IF v_student_status IS NULL THEN
      RAISE EXCEPTION 'NOT_FOUND: Student % does not exist', v_student_id;
    END IF;
    IF v_student_status != 'active' THEN
      RAISE EXCEPTION 'INVALID_OPERATION: Cannot post transactions to student % with status %', v_student_id, v_student_status;
    END IF;

    INSERT INTO public.transactions (
      student_id,
      transaction_type,
      direction,
      purpose,
      amount,
      transaction_date,
      created_by,
      operation_id,
      idempotency_key
    ) VALUES (
      v_student_id,
      v_type,
      v_dir,
      v_purpose,
      v_amount,
      v_tx_date,
      v_actor_id,
      v_op_id,
      CASE WHEN v_first THEN p_idempotency_key ELSE NULL END
    ) RETURNING * INTO v_new_tx;

    v_first := false;
    v_created_ids := v_created_ids || jsonb_build_array(row_to_json(v_new_tx));
  END LOOP;

  -- 5. Record audit log
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity,
    entity_id,
    new_values
  ) VALUES (
    v_actor_id,
    'CREATE_BULK_TRANSACTIONS',
    'transactions',
    v_op_id,
    jsonb_build_object(
      'operation_id', v_op_id,
      'idempotency_key', p_idempotency_key,
      'count', jsonb_array_length(p_transactions)
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'idempotent_replay', false,
    'operation_id', v_op_id,
    'transactions', v_created_ids
  );
END;
$$;
