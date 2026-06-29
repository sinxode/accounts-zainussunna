-- Update RLS policy for audit_logs to allow INSERT permissions
DROP POLICY IF EXISTS "Audit logs viewable by staff" ON audit_logs;

CREATE POLICY "Audit logs manageable by staff" ON audit_logs 
FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'manager', 'owner')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'manager', 'owner')));
