-- ==============================================================================
-- ZLS REBUILD MIGRATION: Financial Engine, Ledger Integrity & Atomic Operations
-- Version: 20261028000001_financial_engine_core.sql
-- Description:
--   1. Enhances transactions table with idempotency_key and reversal_of_id.
--   2. Enforces positive transaction amount constraint (amount > 0).
--   3. Creates internal_loans and internal_loan_repayments for peer student lending.
--   4. Recreates financial views with exact double-entry running balance mathematics.
--   5. Implements atomic, idempotent SECURITY DEFINER RPC functions:
--      - rpc_post_transaction
--      - rpc_post_bulk_transactions
--      - rpc_reverse_transaction
--      - rpc_post_internal_transfer
--      - rpc_repay_internal_loan
--      - rpc_record_borrower_recovery
--   6. Enforces ledger immutability by revoking direct table INSERT/UPDATE/DELETE.
-- ==============================================================================

-- 1. ALTER TRANSACTIONS TABLE
DO $$
BEGIN
  -- Add reversal_of_id if not present
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'reversal_of_id'
  ) THEN
    ALTER TABLE public.transactions 
      ADD COLUMN reversal_of_id UUID REFERENCES public.transactions(id);
  END IF;

  -- Add idempotency_key if not present
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'idempotency_key'
  ) THEN
    ALTER TABLE public.transactions 
      ADD COLUMN idempotency_key UUID;
  END IF;
END $$;

-- Indexes for idempotency and reversal lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_idempotency_key 
  ON public.transactions(idempotency_key) 
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_reversal_of_id 
  ON public.transactions(reversal_of_id);

CREATE INDEX IF NOT EXISTS idx_transactions_student_date 
  ON public.transactions(student_id, transaction_date DESC);

-- Ensure strict amount constraint (> 0)
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_amount_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_amount_check CHECK (amount > 0);


-- 2. CREATE INTERNAL LOANS TABLES (Peer-to-Peer Student Lending)
CREATE TABLE IF NOT EXISTS public.internal_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id UUID NOT NULL,
  lender_student_id UUID NOT NULL REFERENCES public.students(id),
  borrower_student_id UUID NOT NULL REFERENCES public.students(id),
  principal_amount NUMERIC(12, 2) NOT NULL CHECK (principal_amount > 0),
  outstanding_amount NUMERIC(12, 2) NOT NULL CHECK (outstanding_amount >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'settled', 'defaulted')),
  loan_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  idempotency_key UUID UNIQUE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_internal_loans_distinct_students CHECK (lender_student_id != borrower_student_id),
  CONSTRAINT chk_internal_loans_outstanding_le_principal CHECK (outstanding_amount <= principal_amount)
);

CREATE INDEX IF NOT EXISTS idx_internal_loans_lender ON public.internal_loans(lender_student_id);
CREATE INDEX IF NOT EXISTS idx_internal_loans_borrower ON public.internal_loans(borrower_student_id);
CREATE INDEX IF NOT EXISTS idx_internal_loans_status ON public.internal_loans(status);
CREATE INDEX IF NOT EXISTS idx_internal_loans_operation_id ON public.internal_loans(operation_id);

CREATE TABLE IF NOT EXISTS public.internal_loan_repayments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.internal_loans(id) ON DELETE RESTRICT,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  repayment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  operation_id UUID NOT NULL,
  notes TEXT,
  idempotency_key UUID UNIQUE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_internal_loan_repayments_loan ON public.internal_loan_repayments(loan_id);
CREATE INDEX IF NOT EXISTS idx_internal_loan_repayments_operation ON public.internal_loan_repayments(operation_id);


-- 3. RLS POLICIES FOR INTERNAL LOANS
ALTER TABLE public.internal_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_loan_repayments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Internal loans viewable by authorized roles and parents" ON public.internal_loans;
CREATE POLICY "Internal loans viewable by authorized roles and parents" ON public.internal_loans
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'faculty', 'owner', 'manager', 'staff') AND is_active = true
    )
    OR public.is_parent_of_student(lender_student_id)
    OR public.is_parent_of_student(borrower_student_id)
  );

DROP POLICY IF EXISTS "Internal loan repayments viewable by authorized roles and parents" ON public.internal_loan_repayments;
CREATE POLICY "Internal loan repayments viewable by authorized roles and parents" ON public.internal_loan_repayments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'faculty', 'owner', 'manager', 'staff') AND is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.internal_loans il
      WHERE il.id = internal_loan_repayments.loan_id
        AND (public.is_parent_of_student(il.lender_student_id) OR public.is_parent_of_student(il.borrower_student_id))
    )
  );


-- 4. RECREATE FINANCIAL VIEWS (Exact Double-Entry Ledger Mathematics)
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
  t.idempotency_key,
  t.reversal_of_id,
  t.is_reversed,
  t.reversal_reason,
  t.reversed_at,
  t.reversed_by,
  SUM(
    CASE 
      WHEN t.direction = 'credit' THEN t.amount 
      ELSE -t.amount 
    END
  ) OVER (PARTITION BY t.student_id ORDER BY t.transaction_date, t.id) as running_balance
FROM public.transactions t
JOIN public.students s ON t.student_id = s.id
ORDER BY t.student_id, t.transaction_date DESC, t.id DESC;

-- Security invoker configuration
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


-- 5. ATOMIC AUTHORITATIVE POSTING ENGINE (SECURITY DEFINER RPCs)

-- Helper: Check caller is authorized admin
CREATE OR REPLACE FUNCTION public.check_is_financial_admin()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_uid UUID;
  v_role public.user_role;
  v_active BOOLEAN;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHENTICATED: Authentication required to post financial transactions';
  END IF;

  SELECT role, is_active INTO v_role, v_active
  FROM public.profiles
  WHERE id = v_uid;

  IF v_role IS NULL OR v_active IS NOT TRUE OR v_role NOT IN ('super_admin', 'admin', 'owner') THEN
    RAISE EXCEPTION 'FORBIDDEN: User does not possess financial posting authority';
  END IF;

  RETURN v_uid;
END;
$$;

-- Helper: Verify accounting period is not locked
CREATE OR REPLACE FUNCTION public.check_period_unlocked(p_date TIMESTAMPTZ)
RETURNS VOID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.accounting_periods
    WHERE period_year = EXTRACT(YEAR FROM p_date)::int
      AND period_month = EXTRACT(MONTH FROM p_date)::int
      AND is_locked = true
  ) THEN
    RAISE EXCEPTION 'PERIOD_LOCKED: Accounting period for % is locked', to_char(p_date, 'YYYY-MM');
  END IF;
END;
$$;


-- 5.1 POST SINGLE TRANSACTION
CREATE OR REPLACE FUNCTION public.rpc_post_transaction(
  p_student_id UUID,
  p_transaction_type public.transaction_type,
  p_direction public.transaction_direction,
  p_amount NUMERIC(12, 2),
  p_purpose TEXT,
  p_idempotency_key UUID DEFAULT NULL,
  p_operation_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_actor_id UUID;
  v_student_status TEXT;
  v_existing_tx public.transactions%ROWTYPE;
  v_new_tx public.transactions%ROWTYPE;
  v_op_id UUID;
BEGIN
  -- 1. Authorization check
  v_actor_id := public.check_is_financial_admin();

  -- 2. Period check
  PERFORM public.check_period_unlocked(CURRENT_TIMESTAMP);

  -- 3. Idempotency check
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing_tx 
    FROM public.transactions 
    WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
      IF v_existing_tx.student_id = p_student_id 
         AND v_existing_tx.transaction_type = p_transaction_type 
         AND v_existing_tx.direction = p_direction 
         AND v_existing_tx.amount = p_amount THEN
        RETURN jsonb_build_object(
          'success', true,
          'idempotent_replay', true,
          'transaction', row_to_json(v_existing_tx)
        );
      ELSE
        RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT: Key % already used with different transaction parameters', p_idempotency_key;
      END IF;
    END IF;
  END IF;

  -- 4. Parameter validation
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: Amount must be greater than zero';
  END IF;
  IF p_amount != ROUND(p_amount, 2) THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: Amount cannot have more than 2 decimal places';
  END IF;
  IF p_purpose IS NULL OR length(trim(p_purpose)) = 0 THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: Purpose is required';
  END IF;
  IF p_direction NOT IN ('credit', 'debit') THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: Direction must be credit or debit';
  END IF;

  -- 5. Student validation with row locking
  SELECT status INTO v_student_status
  FROM public.students
  WHERE id = p_student_id
  FOR UPDATE;

  IF v_student_status IS NULL THEN
    RAISE EXCEPTION 'NOT_FOUND: Student % does not exist', p_student_id;
  END IF;
  IF v_student_status != 'active' THEN
    RAISE EXCEPTION 'INVALID_OPERATION: Cannot post transactions to student with status %', v_student_status;
  END IF;

  -- 6. Insert transaction
  v_op_id := COALESCE(p_operation_id, gen_random_uuid());

  INSERT INTO public.transactions (
    student_id,
    transaction_type,
    direction,
    purpose,
    amount,
    created_by,
    operation_id,
    idempotency_key
  ) VALUES (
    p_student_id,
    p_transaction_type,
    p_direction,
    trim(p_purpose),
    p_amount,
    v_actor_id,
    v_op_id,
    p_idempotency_key
  ) RETURNING * INTO v_new_tx;

  -- 7. Audit log
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity,
    entity_id,
    new_values
  ) VALUES (
    v_actor_id,
    'CREATE_TRANSACTION',
    'transactions',
    v_new_tx.id,
    row_to_json(v_new_tx)::jsonb
  );

  RETURN jsonb_build_object(
    'success', true,
    'idempotent_replay', false,
    'transaction', row_to_json(v_new_tx)
  );
END;
$$;


-- 5.2 POST BULK TRANSACTIONS ATOMICALLY
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
  v_item JSONB;
  v_op_id UUID;
  v_student_id UUID;
  v_type public.transaction_type;
  v_dir public.transaction_direction;
  v_amount NUMERIC(12, 2);
  v_purpose TEXT;
  v_student_status TEXT;
  v_created_ids JSONB := '[]'::jsonb;
  v_new_tx public.transactions%ROWTYPE;
BEGIN
  -- 1. Authorization check
  v_actor_id := public.check_is_financial_admin();

  -- 2. Period check
  PERFORM public.check_period_unlocked(CURRENT_TIMESTAMP);

  -- 3. Array check
  IF p_transactions IS NULL OR jsonb_array_length(p_transactions) = 0 THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: Bulk transactions array cannot be empty';
  END IF;

  v_op_id := COALESCE(p_operation_id, gen_random_uuid());

  -- 4. Idempotency check for bulk operation
  IF p_idempotency_key IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.transactions WHERE idempotency_key = p_idempotency_key) THEN
      SELECT jsonb_agg(row_to_json(t)) INTO v_created_ids
      FROM public.transactions t
      WHERE idempotency_key = p_idempotency_key;

      RETURN jsonb_build_object(
        'success', true,
        'idempotent_replay', true,
        'operation_id', v_op_id,
        'transactions', v_created_ids
      );
    END IF;
  END IF;

  -- 5. Process each entry atomically
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_transactions)
  LOOP
    v_student_id := (v_item->>'student_id')::UUID;
    v_type := (v_item->>'transaction_type')::public.transaction_type;
    v_dir := (v_item->>'direction')::public.transaction_direction;
    v_amount := (v_item->>'amount')::NUMERIC(12, 2);
    v_purpose := trim(v_item->>'purpose');

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
      created_by,
      operation_id,
      idempotency_key
    ) VALUES (
      v_student_id,
      v_type,
      v_dir,
      v_purpose,
      v_amount,
      v_actor_id,
      v_op_id,
      p_idempotency_key
    ) RETURNING * INTO v_new_tx;

    v_created_ids := v_created_ids || jsonb_build_array(row_to_json(v_new_tx));
  END LOOP;

  -- 6. Bulk audit log
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
    jsonb_build_object('count', jsonb_array_length(v_created_ids), 'operation_id', v_op_id)
  );

  RETURN jsonb_build_object(
    'success', true,
    'idempotent_replay', false,
    'operation_id', v_op_id,
    'transactions', v_created_ids
  );
END;
$$;


-- 5.3 REVERSE TRANSACTION (Non-destructive compensating reversal)
CREATE OR REPLACE FUNCTION public.rpc_reverse_transaction(
  p_transaction_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_actor_id UUID;
  v_target public.transactions%ROWTYPE;
  v_comp_tx public.transactions%ROWTYPE;
  v_comp_dir public.transaction_direction;
  v_comp_purpose TEXT;
BEGIN
  -- 1. Authorization check
  v_actor_id := public.check_is_financial_admin();

  -- 2. Reason validation
  IF p_reason IS NULL OR length(trim(p_reason)) < 10 THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: Reversal reason must be at least 10 characters long';
  END IF;

  -- 3. Target transaction existence & state with row lock
  SELECT * INTO v_target 
  FROM public.transactions 
  WHERE id = p_transaction_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Transaction % does not exist', p_transaction_id;
  END IF;

  IF v_target.is_reversed THEN
    RAISE EXCEPTION 'ALREADY_REVERSED: Transaction % has already been reversed', p_transaction_id;
  END IF;

  IF v_target.reversal_of_id IS NOT NULL THEN
    RAISE EXCEPTION 'INVALID_OPERATION: Cannot reverse a compensating reversal transaction';
  END IF;

  -- 4. Accounting period check for original transaction
  PERFORM public.check_period_unlocked(v_target.transaction_date);

  -- 5. Update target transaction (mark reversed)
  UPDATE public.transactions
  SET is_reversed = true,
      reversed_at = NOW(),
      reversed_by = v_actor_id,
      reversal_reason = trim(p_reason)
  WHERE id = p_transaction_id;

  -- 6. Insert compensating transaction with inverted direction
  v_comp_dir := CASE WHEN v_target.direction = 'credit' THEN 'debit'::public.transaction_direction ELSE 'credit'::public.transaction_direction END;
  v_comp_purpose := 'Reversal of ' || v_target.id || ': ' || trim(p_reason);

  INSERT INTO public.transactions (
    student_id,
    event_id,
    transaction_type,
    direction,
    purpose,
    amount,
    created_by,
    operation_id,
    reversal_of_id
  ) VALUES (
    v_target.student_id,
    v_target.event_id,
    v_target.transaction_type,
    v_comp_dir,
    v_comp_purpose,
    v_target.amount,
    v_actor_id,
    v_target.operation_id,
    v_target.id
  ) RETURNING * INTO v_comp_tx;

  -- 7. Audit log entry
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity,
    entity_id,
    old_values,
    new_values
  ) VALUES (
    v_actor_id,
    'TRANSACTION_REVERSAL',
    'transactions',
    p_transaction_id,
    jsonb_build_object('is_reversed', false),
    jsonb_build_object(
      'is_reversed', true,
      'reversal_reason', trim(p_reason),
      'reversed_by', v_actor_id,
      'compensating_transaction_id', v_comp_tx.id
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'original_transaction_id', v_target.id,
    'compensating_transaction', row_to_json(v_comp_tx)
  );
END;
$$;


-- 5.4 POST INTERNAL STUDENT-TO-STUDENT TRANSFER (Atomic loan creation)
CREATE OR REPLACE FUNCTION public.rpc_post_internal_transfer(
  p_lender_student_id UUID,
  p_borrower_student_id UUID,
  p_amount NUMERIC(12, 2),
  p_purpose TEXT,
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
  v_lender_status TEXT;
  v_borrower_status TEXT;
  v_lender_name TEXT;
  v_borrower_name TEXT;
  v_op_id UUID;
  v_existing_loan public.internal_loans%ROWTYPE;
  v_lender_tx public.transactions%ROWTYPE;
  v_borrower_tx public.transactions%ROWTYPE;
  v_new_loan public.internal_loans%ROWTYPE;
BEGIN
  -- 1. Authorization check
  v_actor_id := public.check_is_financial_admin();

  -- 2. Period check
  PERFORM public.check_period_unlocked(CURRENT_TIMESTAMP);

  -- 3. Parameter checks
  IF p_lender_student_id = p_borrower_student_id THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: Lender and borrower must be different students';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: Transfer amount must be greater than zero';
  END IF;
  IF p_amount != ROUND(p_amount, 2) THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: Amount cannot have more than 2 decimal places';
  END IF;
  IF p_purpose IS NULL OR length(trim(p_purpose)) = 0 THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: Purpose is required for internal transfer';
  END IF;

  -- 4. Idempotency check
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing_loan
    FROM public.internal_loans
    WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
      IF v_existing_loan.lender_student_id = p_lender_student_id 
         AND v_existing_loan.borrower_student_id = p_borrower_student_id 
         AND v_existing_loan.principal_amount = p_amount THEN
        RETURN jsonb_build_object(
          'success', true,
          'idempotent_replay', true,
          'loan', row_to_json(v_existing_loan)
        );
      ELSE
        RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT: Key % already used with different transfer parameters', p_idempotency_key;
      END IF;
    END IF;
  END IF;

  -- 5. Deterministic row locking on students (prevent deadlocks)
  IF p_lender_student_id < p_borrower_student_id THEN
    SELECT status, name INTO v_lender_status, v_lender_name FROM public.students WHERE id = p_lender_student_id FOR UPDATE;
    SELECT status, name INTO v_borrower_status, v_borrower_name FROM public.students WHERE id = p_borrower_student_id FOR UPDATE;
  ELSE
    SELECT status, name INTO v_borrower_status, v_borrower_name FROM public.students WHERE id = p_borrower_student_id FOR UPDATE;
    SELECT status, name INTO v_lender_status, v_lender_name FROM public.students WHERE id = p_lender_student_id FOR UPDATE;
  END IF;

  IF v_lender_status IS NULL OR v_lender_status != 'active' THEN
    RAISE EXCEPTION 'INVALID_OPERATION: Lender student is not active or does not exist';
  END IF;
  IF v_borrower_status IS NULL OR v_borrower_status != 'active' THEN
    RAISE EXCEPTION 'INVALID_OPERATION: Borrower student is not active or does not exist';
  END IF;

  v_op_id := COALESCE(p_operation_id, gen_random_uuid());

  -- 6. Post Leg 1: Lender Debit (balance decreases)
  INSERT INTO public.transactions (
    student_id,
    transaction_type,
    direction,
    purpose,
    amount,
    created_by,
    operation_id
  ) VALUES (
    p_lender_student_id,
    'withdrawal',
    'debit',
    'Internal transfer to ' || v_borrower_name || ': ' || trim(p_purpose),
    p_amount,
    v_actor_id,
    v_op_id
  ) RETURNING * INTO v_lender_tx;

  -- 7. Post Leg 2: Borrower Credit (balance increases)
  INSERT INTO public.transactions (
    student_id,
    transaction_type,
    direction,
    purpose,
    amount,
    created_by,
    operation_id
  ) VALUES (
    p_borrower_student_id,
    'deposit',
    'credit',
    'Internal transfer from ' || v_lender_name || ': ' || trim(p_purpose),
    p_amount,
    v_actor_id,
    v_op_id
  ) RETURNING * INTO v_borrower_tx;

  -- 8. Create internal loan record
  INSERT INTO public.internal_loans (
    operation_id,
    lender_student_id,
    borrower_student_id,
    principal_amount,
    outstanding_amount,
    status,
    notes,
    created_by,
    idempotency_key
  ) VALUES (
    v_op_id,
    p_lender_student_id,
    p_borrower_student_id,
    p_amount,
    p_amount,
    'active',
    trim(p_purpose),
    v_actor_id,
    p_idempotency_key
  ) RETURNING * INTO v_new_loan;

  -- 9. Audit log entry
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity,
    entity_id,
    new_values
  ) VALUES (
    v_actor_id,
    'CREATE_INTERNAL_LOAN',
    'internal_loans',
    v_new_loan.id,
    row_to_json(v_new_loan)::jsonb
  );

  RETURN jsonb_build_object(
    'success', true,
    'idempotent_replay', false,
    'loan', row_to_json(v_new_loan),
    'lender_transaction_id', v_lender_tx.id,
    'borrower_transaction_id', v_borrower_tx.id
  );
END;
$$;


-- 5.5 REPAY INTERNAL STUDENT LOAN
CREATE OR REPLACE FUNCTION public.rpc_repay_internal_loan(
  p_loan_id UUID,
  p_amount NUMERIC(12, 2),
  p_notes TEXT DEFAULT NULL,
  p_idempotency_key UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_actor_id UUID;
  v_loan public.internal_loans%ROWTYPE;
  v_lender_name TEXT;
  v_borrower_name TEXT;
  v_new_outstanding NUMERIC(12, 2);
  v_new_status TEXT;
  v_op_id UUID;
  v_existing_repayment public.internal_loan_repayments%ROWTYPE;
  v_repayment public.internal_loan_repayments%ROWTYPE;
BEGIN
  -- 1. Authorization check
  v_actor_id := public.check_is_financial_admin();

  -- 2. Period check
  PERFORM public.check_period_unlocked(CURRENT_TIMESTAMP);

  -- 3. Parameter checks
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: Repayment amount must be greater than zero';
  END IF;
  IF p_amount != ROUND(p_amount, 2) THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: Amount cannot have more than 2 decimal places';
  END IF;

  -- 4. Idempotency check
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing_repayment
    FROM public.internal_loan_repayments
    WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
      IF v_existing_repayment.loan_id = p_loan_id AND v_existing_repayment.amount = p_amount THEN
        RETURN jsonb_build_object(
          'success', true,
          'idempotent_replay', true,
          'repayment', row_to_json(v_existing_repayment)
        );
      ELSE
        RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT: Key % already used with different repayment parameters', p_idempotency_key;
      END IF;
    END IF;
  END IF;

  -- 5. Lock loan row
  SELECT * INTO v_loan
  FROM public.internal_loans
  WHERE id = p_loan_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Internal loan % does not exist', p_loan_id;
  END IF;

  IF v_loan.status = 'settled' THEN
    RAISE EXCEPTION 'ALREADY_SETTLED: Internal loan % is already fully settled', p_loan_id;
  END IF;

  -- 6. Prevent overpayment
  IF p_amount > v_loan.outstanding_amount THEN
    RAISE EXCEPTION 'OVERPAYMENT_REJECTED: Repayment amount % exceeds outstanding balance %', p_amount, v_loan.outstanding_amount;
  END IF;

  SELECT name INTO v_lender_name FROM public.students WHERE id = v_loan.lender_student_id;
  SELECT name INTO v_borrower_name FROM public.students WHERE id = v_loan.borrower_student_id;

  v_op_id := gen_random_uuid();
  v_new_outstanding := v_loan.outstanding_amount - p_amount;
  v_new_status := CASE WHEN v_new_outstanding = 0 THEN 'settled' ELSE 'active' END;

  -- 7. Post repayment transactions without modifying original transactions
  -- Leg 1: Borrower Debit (settlement cash deduction)
  INSERT INTO public.transactions (
    student_id, transaction_type, direction, purpose, amount, created_by, operation_id
  ) VALUES (
    v_loan.borrower_student_id, 'withdrawal', 'debit',
    'Internal loan repayment to ' || v_lender_name || COALESCE(': ' || trim(p_notes), ''),
    p_amount, v_actor_id, v_op_id
  );

  -- Leg 2: Lender Credit (debt recovery restored)
  INSERT INTO public.transactions (
    student_id, transaction_type, direction, purpose, amount, created_by, operation_id
  ) VALUES (
    v_loan.lender_student_id, 'deposit', 'credit',
    'Internal loan repayment from ' || v_borrower_name || COALESCE(': ' || trim(p_notes), ''),
    p_amount, v_actor_id, v_op_id
  );

  -- 8. Record repayment row
  INSERT INTO public.internal_loan_repayments (
    loan_id,
    amount,
    operation_id,
    notes,
    created_by,
    idempotency_key
  ) VALUES (
    p_loan_id,
    p_amount,
    v_op_id,
    trim(p_notes),
    v_actor_id,
    p_idempotency_key
  ) RETURNING * INTO v_repayment;

  -- 9. Update internal loan state
  UPDATE public.internal_loans
  SET outstanding_amount = v_new_outstanding,
      status = v_new_status
  WHERE id = p_loan_id;

  -- 10. Audit log
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity,
    entity_id,
    new_values
  ) VALUES (
    v_actor_id,
    'REPAY_INTERNAL_LOAN',
    'internal_loans',
    p_loan_id,
    jsonb_build_object(
      'repayment_id', v_repayment.id,
      'amount', p_amount,
      'outstanding_amount', v_new_outstanding,
      'status', v_new_status
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'idempotent_replay', false,
    'repayment', row_to_json(v_repayment),
    'outstanding_amount', v_new_outstanding,
    'status', v_new_status
  );
END;
$$;


-- 5.6 RECORD EXTERNAL BORROWER RECOVERY (Without unapproved cashbook double-entries)
CREATE OR REPLACE FUNCTION public.rpc_record_borrower_recovery(
  p_loan_id UUID,
  p_amount NUMERIC(12, 2),
  p_recovery_date DATE DEFAULT CURRENT_DATE,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_actor_id UUID;
  v_loan public.borrower_loans%ROWTYPE;
  v_total_recovered NUMERIC(12, 2);
  v_outstanding NUMERIC(12, 2);
  v_new_outstanding NUMERIC(12, 2);
  v_recovery public.recoveries%ROWTYPE;
BEGIN
  -- 1. Authorization check
  v_actor_id := public.check_is_financial_admin();

  -- 2. Parameter checks
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: Recovery amount must be greater than zero';
  END IF;
  IF p_amount != ROUND(p_amount, 2) THEN
    RAISE EXCEPTION 'INVALID_ARGUMENT: Amount cannot have more than 2 decimal places';
  END IF;

  -- 3. Lock borrower loan row for update
  SELECT * INTO v_loan
  FROM public.borrower_loans
  WHERE id = p_loan_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: Borrower loan % does not exist', p_loan_id;
  END IF;

  -- 4. Calculate existing recovered total
  SELECT COALESCE(SUM(amount), 0::numeric) INTO v_total_recovered
  FROM public.recoveries
  WHERE loan_id = p_loan_id;

  v_outstanding := v_loan.loan_amount - v_total_recovered;

  IF v_outstanding <= 0 THEN
    RAISE EXCEPTION 'ALREADY_SETTLED: Borrower loan % is already fully recovered', p_loan_id;
  END IF;

  -- 5. Prevent overpayment
  IF p_amount > v_outstanding THEN
    RAISE EXCEPTION 'OVERPAYMENT_REJECTED: Recovery amount % exceeds outstanding loan balance %', p_amount, v_outstanding;
  END IF;

  -- 6. Insert recovery record
  INSERT INTO public.recoveries (
    loan_id,
    amount,
    recovery_date,
    notes,
    created_by
  ) VALUES (
    p_loan_id,
    p_amount,
    COALESCE(p_recovery_date, CURRENT_DATE),
    trim(p_notes),
    v_actor_id
  ) RETURNING * INTO v_recovery;

  v_new_outstanding := v_outstanding - p_amount;

  -- 7. Update borrower loan status if fully recovered
  IF v_new_outstanding = 0 THEN
    UPDATE public.borrower_loans
    SET status = 'settled'
    WHERE id = p_loan_id;
  END IF;

  -- 8. Audit log
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity,
    entity_id,
    new_values
  ) VALUES (
    v_actor_id,
    'RECORD_BORROWER_RECOVERY',
    'borrower_loans',
    p_loan_id,
    jsonb_build_object(
      'recovery_id', v_recovery.id,
      'amount', p_amount,
      'outstanding_amount', v_new_outstanding,
      'status', CASE WHEN v_new_outstanding = 0 THEN 'settled' ELSE v_loan.status END
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'recovery', row_to_json(v_recovery),
    'outstanding_amount', v_new_outstanding,
    'is_settled', (v_new_outstanding = 0)
  );
END;
$$;


-- 6. PERMISSIONS & TABLE MUTATION RESTRICTION (Ledger Immutability)

-- Drop direct client mutation policies on transactions
DROP POLICY IF EXISTS "Admins can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Staff can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Staff can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Staff can delete transactions" ON public.transactions;

-- Revoke direct table mutations from ordinary authenticated clients
REVOKE INSERT, UPDATE, DELETE ON public.transactions FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.internal_loans FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.internal_loan_repayments FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.recoveries FROM authenticated;

-- Ensure SELECT is granted
GRANT SELECT ON public.transactions TO authenticated;
GRANT SELECT ON public.internal_loans TO authenticated;
GRANT SELECT ON public.internal_loan_repayments TO authenticated;
GRANT SELECT ON public.recoveries TO authenticated;
GRANT SELECT ON public.student_balances TO authenticated;
GRANT SELECT ON public.student_health TO authenticated;
GRANT SELECT ON public.student_ledger_view TO authenticated;
GRANT SELECT ON public.borrower_loan_balances TO authenticated;

-- Grant EXECUTE on trusted financial functions to authenticated
REVOKE ALL ON FUNCTION public.rpc_post_transaction(UUID, public.transaction_type, public.transaction_direction, NUMERIC, TEXT, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_post_transaction(UUID, public.transaction_type, public.transaction_direction, NUMERIC, TEXT, UUID, UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.rpc_post_bulk_transactions(JSONB, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_post_bulk_transactions(JSONB, UUID, UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.rpc_reverse_transaction(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_reverse_transaction(UUID, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.rpc_post_internal_transfer(UUID, UUID, NUMERIC, TEXT, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_post_internal_transfer(UUID, UUID, NUMERIC, TEXT, UUID, UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.rpc_repay_internal_loan(UUID, NUMERIC, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_repay_internal_loan(UUID, NUMERIC, TEXT, UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.rpc_record_borrower_recovery(UUID, NUMERIC, DATE, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_record_borrower_recovery(UUID, NUMERIC, DATE, TEXT) TO authenticated;
