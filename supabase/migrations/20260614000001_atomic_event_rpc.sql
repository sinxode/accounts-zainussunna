-- ZLS Hardening: Atomic Event Processing RPC

CREATE OR REPLACE FUNCTION process_event_with_participants(
  p_event_name TEXT,
  p_event_type event_type,
  p_description TEXT,
  p_metadata JSONB,
  p_participants JSONB, -- Array of { student_id: uuid, amount: numeric, notes: text }
  p_created_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
  v_direction transaction_direction;
  v_trans_type transaction_type;
  v_participant RECORD;
  v_transaction_id UUID;
  v_total_amount NUMERIC(12, 2) := 0;
  v_count INTEGER := 0;
BEGIN
  -- 1. Determine Transaction Logic
  IF p_event_type = 'collection_session' THEN
    v_direction := 'credit';
    v_trans_type := 'collection';
  ELSIF p_event_type = 'bulk_distribution' THEN
    v_direction := 'credit';
    v_trans_type := 'distribution';
  ELSIF p_event_type = 'store_bill' THEN
    v_direction := 'debit';
    v_trans_type := 'store_bill';
  ELSE
    v_direction := 'credit'; -- Default for custom
    v_trans_type := 'adjustment';
  END IF;

  -- 2. Create the Event Record (Initial)
  INSERT INTO events (
    event_name,
    event_type,
    description,
    event_metadata,
    created_by,
    status
  ) VALUES (
    p_event_name,
    p_event_type,
    p_description,
    p_metadata,
    p_created_by,
    'completed' -- Auto-complete for these high-level actions
  ) RETURNING id INTO v_event_id;

  -- 3. Process Participants
  FOR v_participant IN SELECT * FROM jsonb_to_recordset(p_participants) AS x(student_id UUID, amount NUMERIC, notes TEXT)
  LOOP
    -- A. Generate Ledger Transaction
    INSERT INTO transactions (
      student_id,
      event_id,
      transaction_type,
      direction,
      amount,
      purpose,
      created_by
    ) VALUES (
      v_participant.student_id,
      v_event_id,
      v_trans_type,
      v_direction,
      v_participant.amount,
      p_event_name || COALESCE(' - ' || v_participant.notes, ''),
      p_created_by
    ) RETURNING id INTO v_transaction_id;

    -- B. Link Participant
    INSERT INTO event_participants (
      event_id,
      student_id,
      amount,
      notes,
      transaction_id,
      status
    ) VALUES (
      v_event_id,
      v_participant.student_id,
      v_participant.amount,
      v_participant.notes,
      v_transaction_id,
      'completed'
    );

    -- C. Track Totals
    v_total_amount := v_total_amount + v_participant.amount;
    v_count := v_count + 1;
  END LOOP;

  -- 4. Update Event with Final Totals & Completion Info
  UPDATE events SET
    total_amount = v_total_amount,
    participant_count = v_count,
    completed_at = NOW(),
    completed_by = p_created_by
  WHERE id = v_event_id;

  -- 5. Write Audit Log
  INSERT INTO audit_logs (
    user_id,
    action,
    entity,
    entity_id,
    new_values
  ) VALUES (
    p_created_by,
    'ATOMIC_EVENT_PROCESSED',
    'events',
    v_event_id,
    jsonb_build_object(
      'event_id', v_event_id,
      'name', p_event_name,
      'type', p_event_type,
      'total_amount', v_total_amount,
      'participant_count', v_count
    )
  );

  RETURN v_event_id;
END;
$$;
