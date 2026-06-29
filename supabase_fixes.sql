-- SQL Fixes for Zainussunna Ledger System
-- Copy all content below and paste it into the Supabase SQL Editor.

-- 1. Create the atomic event processing RPC function
CREATE OR REPLACE FUNCTION process_event_with_participants(
  p_event_name TEXT,
  p_event_type event_type,
  p_description TEXT,
  p_metadata JSONB,
  p_participants JSONB,
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
  IF p_event_type = 'collection_session' THEN v_direction := 'credit'; v_trans_type := 'collection';
  ELSIF p_event_type = 'bulk_distribution' THEN v_direction := 'credit'; v_trans_type := 'distribution';
  ELSIF p_event_type = 'store_bill' THEN v_direction := 'debit'; v_trans_type := 'store_bill';
  ELSE v_direction := 'credit'; v_trans_type := 'adjustment'; END IF;

  INSERT INTO events (event_name, event_type, description, event_metadata, created_by, status)
  VALUES (p_event_name, p_event_type, p_description, p_metadata, p_created_by, 'completed')
  RETURNING id INTO v_event_id;

  FOR v_participant IN SELECT * FROM jsonb_to_recordset(p_participants) AS x(student_id UUID, amount NUMERIC, notes TEXT) LOOP
    INSERT INTO transactions (student_id, event_id, transaction_type, direction, amount, purpose, created_by)
    VALUES (v_participant.student_id, v_event_id, v_trans_type, v_direction, v_participant.amount, p_event_name || COALESCE(' - ' || v_participant.notes, ''), p_created_by)
    RETURNING id INTO v_transaction_id;

    INSERT INTO event_participants (event_id, student_id, amount, notes, transaction_id, status)
    VALUES (v_event_id, v_participant.student_id, v_participant.amount, v_participant.notes, v_transaction_id, 'completed');

    v_total_amount := v_total_amount + v_participant.amount;
    v_count := v_count + 1;
  END LOOP;

  UPDATE events SET total_amount = v_total_amount, participant_count = v_count, completed_at = NOW(), completed_by = p_created_by WHERE id = v_event_id;

  INSERT INTO audit_logs (user_id, action, entity, entity_id, new_values)
  VALUES (p_created_by, 'ATOMIC_EVENT_PROCESSED', 'events', v_event_id, jsonb_build_object('event_id', v_event_id, 'name', p_event_name, 'type', p_event_type, 'total_amount', v_total_amount, 'participant_count', v_count));

  RETURN v_event_id;
END;
$$;

-- 2. Add RLS policy for audit_logs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Audit logs viewable by staff') THEN
        CREATE POLICY "Audit logs viewable by staff" ON audit_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'manager', 'owner')));
    END IF;
END $$;
