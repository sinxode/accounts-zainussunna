-- Zainussunna Ledger System (ZLS)
-- Database Fix: Create transaction_presets table and update saved_batches
-- Run this in the Supabase SQL Editor to resolve 404 errors.

-- 1. Create transaction_presets table
CREATE TABLE IF NOT EXISTS transaction_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  transaction_type transaction_type NOT NULL,
  amount NUMERIC(12, 2),
  purpose TEXT,
  configuration JSONB DEFAULT '{}' NOT NULL,
  is_favorite BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Add is_favorite to saved_batches
ALTER TABLE saved_batches ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false NOT NULL;

-- 3. Enable RLS
ALTER TABLE transaction_presets ENABLE ROW LEVEL SECURITY;

-- 4. Policies for transaction_presets
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transaction_presets' AND policyname = 'Presets viewable by authenticated') THEN
        CREATE POLICY "Presets viewable by authenticated" ON transaction_presets FOR SELECT TO authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transaction_presets' AND policyname = 'Staff can manage presets') THEN
        CREATE POLICY "Staff can manage presets" ON transaction_presets FOR ALL TO authenticated 
        USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'manager', 'owner')));
    END IF;
END $$;
