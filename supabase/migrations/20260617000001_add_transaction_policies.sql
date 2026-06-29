-- Add missing DELETE and UPDATE policies for transactions table

-- 1. Allow authenticated staff/managers/owners to delete transactions
CREATE POLICY "Staff can delete transactions" ON transactions 
FOR DELETE TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'manager', 'owner')));

-- 2. Allow authenticated staff/managers/owners to update transactions
CREATE POLICY "Staff can update transactions" ON transactions 
FOR UPDATE TO authenticated 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'manager', 'owner')));
