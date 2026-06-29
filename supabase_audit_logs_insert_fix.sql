-- Add INSERT policy for audit_logs
CREATE POLICY "Audit logs insertable by staff" ON audit_logs 
FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'manager', 'owner')));
