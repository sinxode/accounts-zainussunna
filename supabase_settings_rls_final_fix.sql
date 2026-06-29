-- SQL Fix for 'settings' table RLS
-- Run this script in the Supabase SQL Editor to resolve the 403 Forbidden error.

-- 1. Ensure RLS is enabled on the settings table
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Settings viewable by authenticated users" ON settings;
DROP POLICY IF EXISTS "Only owner can update settings" ON settings;

-- 3. Create permissive policies for authenticated users
-- Allow everyone to read settings
CREATE POLICY "Settings viewable by authenticated users" ON settings 
FOR SELECT TO authenticated USING (true);

-- Allow manager or owner to insert/update (Upsert)
CREATE POLICY "Staff can manage settings" ON settings 
FOR ALL TO authenticated 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() 
  AND role IN ('manager', 'owner')
));
