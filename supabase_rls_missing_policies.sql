-- SQL Fixes for Zainussunna Ledger System
-- Run this script in the Supabase SQL Editor to add the missing RLS policies.

-- 1. Policies for saved_batches
CREATE POLICY "Batches viewable by authenticated" ON saved_batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert batches" ON saved_batches FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own batches" ON saved_batches FOR UPDATE TO authenticated USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('manager', 'owner')));
CREATE POLICY "Users can delete own batches" ON saved_batches FOR DELETE TO authenticated USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('manager', 'owner')));

-- 2. Policies for batch_members
CREATE POLICY "Batch members viewable by authenticated" ON batch_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert batch members" ON batch_members FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'manager', 'owner')));
CREATE POLICY "Staff can delete batch members" ON batch_members FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'manager', 'owner')));

-- 3. Policies for event_participants
CREATE POLICY "Event participants viewable by authenticated" ON event_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage event participants" ON event_participants FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'manager', 'owner')));

-- 4. Policies for borrowers
CREATE POLICY "Borrowers viewable by authenticated" ON borrowers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage borrowers" ON borrowers FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'manager', 'owner')));

-- 5. Policies for borrower_loans
CREATE POLICY "Borrower loans viewable by authenticated" ON borrower_loans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage borrower loans" ON borrower_loans FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'manager', 'owner')));

-- 6. Policies for recoveries
CREATE POLICY "Recoveries viewable by authenticated" ON recoveries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage recoveries" ON recoveries FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'manager', 'owner')));

-- 7. Policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT TO authenticated USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- 8. Policies for event_templates
CREATE POLICY "Event templates viewable by authenticated" ON event_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage event templates" ON event_templates FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'manager', 'owner')));
