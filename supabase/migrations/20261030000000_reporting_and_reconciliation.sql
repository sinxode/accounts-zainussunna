-- ==============================================================================
-- ZLS Migration: 20261030000000_reporting_and_reconciliation.sql
-- Prompt 6: Reporting views, borrower loan details, and audit reporting grants
-- ==============================================================================

-- 1. Upgrade borrower_loan_balances view with full loan metadata and security_invoker
DROP VIEW IF EXISTS public.borrower_loan_balances CASCADE;

CREATE VIEW public.borrower_loan_balances AS
SELECT 
  bl.id AS loan_id,
  bl.borrower_id,
  b.name AS borrower_name,
  b.risk_level,
  bl.loan_amount,
  bl.loan_date,
  bl.purpose,
  bl.status,
  bl.source_type,
  COALESCE(SUM(r.amount), 0::numeric) AS total_recovered,
  bl.loan_amount - COALESCE(SUM(r.amount), 0::numeric) AS outstanding_amount
FROM public.borrower_loans bl
JOIN public.borrowers b ON bl.borrower_id = b.id
LEFT JOIN public.recoveries r ON bl.id = r.loan_id
GROUP BY bl.id, bl.borrower_id, b.name, b.risk_level, bl.loan_amount, bl.loan_date, bl.purpose, bl.status, bl.source_type;

-- Set security_invoker = true so PostgreSQL 15+ respects RLS on underlying tables
DO $$
BEGIN
  IF current_setting('server_version_num')::int >= 150000 THEN
    EXECUTE 'ALTER VIEW public.borrower_loan_balances SET (security_invoker = true)';
  END IF;
END $$;

GRANT SELECT ON public.borrower_loan_balances TO authenticated;

-- 2. Ensure audit_logs is readable by financial administrators
GRANT SELECT ON public.audit_logs TO authenticated;
