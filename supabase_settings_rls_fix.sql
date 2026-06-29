-- Add RLS policies for settings table to allow authenticated staff/owners to manage settings
-- 1. Viewable by all authenticated users
CREATE POLICY "Settings viewable by authenticated users" ON settings FOR SELECT TO authenticated USING (true);

-- 2. Updatable by owner only
CREATE POLICY "Only owner can update settings" ON settings FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));
