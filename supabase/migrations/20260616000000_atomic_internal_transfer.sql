-- ZLS Hardening: Atomic Internal Transfer RPC

CREATE OR REPLACE FUNCTION atomic_internal_transfer(
  p_from_student_id UUID,
  p_to_student_id UUID,
  p_amount NUMERIC,
  p_purpose TEXT,
  p_operation_id UUID,
  p_created_by UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Create Debit Transaction for Lender
  INSERT INTO transactions (
    student_id,
    operation_id,
    transaction_type,
    direction,
    amount,
    purpose,
    transaction_date,
    created_by
  ) VALUES (
    p_from_student_id,
    p_operation_id,
    'adjustment',
    'debit',
    p_amount,
    p_purpose,
    NOW(),
    p_created_by
  );

  -- 2. Create Credit Transaction for Borrower
  INSERT INTO transactions (
    student_id,
    operation_id,
    transaction_type,
    direction,
    amount,
    purpose,
    transaction_date,
    created_by
  ) VALUES (
    p_to_student_id,
    p_operation_id,
    'adjustment',
    'credit',
    p_amount,
    p_purpose,
    NOW(),
    p_created_by
  );

  -- 3. Write Audit Log
  INSERT INTO audit_logs (
    user_id,
    action,
    entity,
    new_values
  ) VALUES (
    p_created_by,
    'ATOMIC_TRANSFER_PROCESSED',
    'transactions',
    jsonb_build_object(
      'from_student_id', p_from_student_id,
      'to_student_id', p_to_student_id,
      'amount', p_amount,
      'operation_id', p_operation_id
    )
  );
END;
$$;
