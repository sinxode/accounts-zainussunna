-- Zainussunna Ledger System (ZLS) - Production Final Schema (v9.8)

-- 1. ENUMS & TYPES
CREATE TYPE user_role AS ENUM ('owner', 'manager', 'staff');
CREATE TYPE student_status AS ENUM ('active', 'archived');
CREATE TYPE event_status AS ENUM ('draft', 'pending', 'completed', 'archived');
CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'distribution', 'store_bill', 'collection', 'adjustment');
CREATE TYPE transaction_direction AS ENUM ('credit', 'debit');
CREATE TYPE event_type AS ENUM ('collection_session', 'store_bill', 'bulk_distribution', 'custom_event');
CREATE TYPE borrower_status AS ENUM ('active', 'closed', 'overdue', 'archived');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'alert', 'success'); -- Final Improvement 6

-- 2. TABLES

-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role DEFAULT 'staff' NOT NULL,
  permissions JSONB DEFAULT '{}' NOT NULL,
  last_login TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Students
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrolment_no TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  status student_status DEFAULT 'active' NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  archived_at TIMESTAMPTZ
);

-- User Favorites
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, student_id)
);

-- Recent Student Access
CREATE TABLE recent_student_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, student_id)
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  event_type event_type NOT NULL,
  description TEXT,
  event_metadata JSONB DEFAULT '{}' NOT NULL,
  status event_status DEFAULT 'draft' NOT NULL,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  completed_by UUID REFERENCES profiles(id),
  event_date DATE DEFAULT CURRENT_DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  template_id UUID,
  batch_id UUID,
  total_amount NUMERIC(12, 2) DEFAULT 0 NOT NULL,
  participant_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Transactions (Financial Source of Truth)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  transaction_type transaction_type NOT NULL,
  direction transaction_direction NOT NULL,
  purpose TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  transaction_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  -- Reversal System (Final Improvement 2)
  is_reversed BOOLEAN DEFAULT false NOT NULL,
  reversed_at TIMESTAMPTZ,
  reversed_by UUID REFERENCES profiles(id),
  reversal_reason TEXT,
  -- Metadata
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Event Participants
CREATE TABLE event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  amount NUMERIC(12, 2) NOT NULL,
  notes TEXT,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  UNIQUE(event_id, student_id)
);

-- Outside Borrowers
CREATE TABLE borrowers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  risk_level risk_level DEFAULT 'low' NOT NULL,
  status borrower_status DEFAULT 'active' NOT NULL,
  notes TEXT,
  is_archived BOOLEAN DEFAULT false NOT NULL,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Borrower Loans (Final Improvement 1)
CREATE TABLE borrower_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  borrower_id UUID NOT NULL REFERENCES borrowers(id) ON DELETE CASCADE,
  loan_amount NUMERIC(12, 2) NOT NULL,
  loan_date DATE DEFAULT CURRENT_DATE NOT NULL,
  purpose TEXT,
  source_type TEXT NOT NULL DEFAULT 'student_fund', -- e.g., student_fund, distribution_pool
  source_event_id UUID REFERENCES events(id), -- Originating event if applicable
  status TEXT DEFAULT 'active' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Recoveries
CREATE TABLE recoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES borrower_loans(id) ON DELETE RESTRICT,
  amount NUMERIC(12, 2) NOT NULL,
  recovery_date DATE DEFAULT CURRENT_DATE NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Accounting Periods (Final Improvement 4)
CREATE TABLE accounting_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  is_locked BOOLEAN DEFAULT false NOT NULL,
  locked_at TIMESTAMPTZ,
  locked_by UUID REFERENCES profiles(id),
  UNIQUE(period_year, period_month)
);

-- Templates & Batches
CREATE TABLE event_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  event_type event_type NOT NULL,
  description TEXT,
  configuration JSONB DEFAULT '{}' NOT NULL,
  locked_fields TEXT[] DEFAULT '{}' NOT NULL,
  is_archived BOOLEAN DEFAULT false NOT NULL,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE saved_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  is_archived BOOLEAN DEFAULT false NOT NULL,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE batch_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES saved_batches(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE(batch_id, student_id)
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type DEFAULT 'info' NOT NULL, -- Final Improvement 6
  is_read BOOLEAN DEFAULT false NOT NULL,
  metadata JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Settings & Audit
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. VIEWS

-- Student Balances (Ignoring reversed transactions)
CREATE VIEW student_balances AS
SELECT 
  student_id,
  SUM(
    CASE 
      WHEN direction = 'credit' THEN amount 
      ELSE -amount 
    END
  ) as current_balance,
  MAX(transaction_date) as last_transaction_date,
  COUNT(id) as transaction_count
FROM transactions
WHERE is_reversed = false
GROUP BY student_id;

-- Borrower Loan Balances
CREATE VIEW borrower_loan_balances AS
SELECT 
  bl.id as loan_id,
  bl.borrower_id,
  bl.loan_amount,
  bl.source_type,
  COALESCE(SUM(r.amount), 0) as total_recovered,
  bl.loan_amount - COALESCE(SUM(r.amount), 0) as outstanding_amount
FROM borrower_loans bl
LEFT JOIN recoveries r ON bl.id = r.loan_id
GROUP BY bl.id, bl.borrower_id, bl.loan_amount, bl.source_type;

-- Student Health View
CREATE VIEW student_health AS
SELECT 
  s.*,
  COALESCE(b.current_balance, 0) as current_balance,
  b.last_transaction_date,
  CASE 
    WHEN COALESCE(b.current_balance, 0) < 0 THEN 'negative'
    WHEN COALESCE(b.current_balance, 0) = 0 THEN 'empty'
    WHEN COALESCE(b.current_balance, 0) < 500 THEN 'low'
    ELSE 'healthy'
  END as health_status
FROM students s
LEFT JOIN student_balances b ON s.id = b.student_id;

-- Student Ledger View (Final Improvement 5)
CREATE VIEW student_ledger_view AS
SELECT 
  t.id as transaction_id,
  t.student_id,
  s.name as student_name,
  t.transaction_date,
  t.transaction_type,
  t.direction,
  t.amount,
  t.purpose,
  e.event_name,
  t.is_reversed,
  SUM(
    CASE 
      WHEN t.is_reversed = true THEN 0
      WHEN t.direction = 'credit' THEN t.amount 
      ELSE -t.amount 
    END
  ) OVER (PARTITION BY t.student_id ORDER BY t.transaction_date, t.id) as running_balance
FROM transactions t
JOIN students s ON t.student_id = s.id
LEFT JOIN events e ON t.event_id = e.id
ORDER BY t.student_id, t.transaction_date DESC, t.id DESC;

-- 4. RLS POLICIES (ENABLE RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE recent_student_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowers ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrower_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE recoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_periods ENABLE ROW LEVEL SECURITY;

-- 5. POLICIES (Final Refined RBAC)

-- Profiles
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Students
CREATE POLICY "Students are viewable by authenticated users" ON students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert students" ON students FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'manager', 'owner')));
CREATE POLICY "Managers can update students" ON students FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('manager', 'owner')));

-- Events Locking (Final Improvement 3)
CREATE POLICY "Events viewable by authenticated" ON events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert events" ON events FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'manager', 'owner')));
CREATE POLICY "Enforce completed events are read-only" ON events FOR UPDATE TO authenticated 
  USING (
    (status != 'completed' AND status != 'archived') 
    OR 
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'))
  );

-- Transactions
CREATE POLICY "Transactions viewable by authenticated" ON transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert transactions" ON transactions FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('staff', 'manager', 'owner')));

-- Accounting Periods
CREATE POLICY "Periods viewable by authenticated" ON accounting_periods FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only owner can manage periods" ON accounting_periods FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'));

-- Favorites & Recent
CREATE POLICY "Manage own favorites" ON user_favorites FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Manage own recent access" ON recent_student_access FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 6. TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_student_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
