-- Add RLS policy for audit_logs
CREATE POLICY "Audit logs viewable by staff" ON audit_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'manager', 'owner')));
