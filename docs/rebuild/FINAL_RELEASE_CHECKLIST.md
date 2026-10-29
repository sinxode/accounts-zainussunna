# ZLS Rebuild — Final Release Checklist & Deployment Procedure

**Document Version:** 1.0.0  
**Phase:** Prompt 8 of 8  
**System:** Zainussunna Ledger System (ZLS)  
**Date:** 2026-10-29  
**Branch:** `zls-rebuild`  
**Production Authorization Required:** YES

---

## 1. Release Gates & Approvals

All release gates must be signed off prior to executing production deployment:

- [x] **Technical Rebuild Gate:** 131/131 automated regression tests passing (`PASS`).
- [x] **Build & Bundle Gate:** Production build passes with 0 TypeScript/bundler errors (`PASS`).
- [x] **Data Reconciliation Gate:** 79 students, 303 transactions, and ₹132,766.27 net movement reconciled to ₹0.00 variance in staging (`PASS`).
- [ ] **Administrative Approval Gate (Condition 1):** Written review and policy determination on 20 legacy external loans (₹196,562.00).
- [ ] **Administrative Approval Gate (Condition 2):** Approval of policy notice regarding 24 historical negative accounts (-₹29,565.67).
- [ ] **User Acceptance Testing (Condition 3):** Super Admin walkthrough in controlled staging instance.

---

## 2. Production Environment Prerequisites

Before applying migrations or deploying frontend code:

1. **Verify Database Snapshot**:
   - Ensure a fresh, complete snapshot of the Supabase production database is exported and downloaded to local storage (`zls-backup-<date>.sql`).
2. **Environment Variables**:
   - Verify `VITE_SUPABASE_URL` is configured in production hosting (e.g. Vercel / Netlify).
   - Verify `VITE_SUPABASE_ANON_KEY` is set to the public anon key.
   - Confirm no service role keys or administrative passwords exist in client-side bundles.
3. **Authentication Settings**:
   - Verify Site URL and Redirect URLs in Supabase Auth Settings include the production domain and `/auth/callback`.

---

## 3. Database Migration Deployment Sequence

Apply migrations strictly in numerical order using the Supabase CLI or direct migration pipeline:

```bash
# 1. Apply Security RBAC Foundation
npx supabase db push --file supabase/migrations/20261028000000_security_rbac_foundation.sql

# 2. Apply Financial Engine Core & Atomic RPCs
npx supabase db push --file supabase/migrations/20261028000001_financial_engine_core.sql

# 3. Apply Operational Workflows & Period Locks
npx supabase db push --file supabase/migrations/20261029000000_operational_workflows.sql

# 4. Apply Reporting Views & Grants
npx supabase db push --file supabase/migrations/20261030000000_reporting_and_reconciliation.sql
```

### Post-Migration Database Sanity Verification
Immediately run these sanity checks in production SQL editor:
```sql
-- 1. Assert exactly 79 students
SELECT count(*) = 79 AS students_ok FROM public.students;

-- 2. Assert exactly 303 transactions
SELECT count(*) = 303 AS transactions_ok FROM public.transactions;

-- 3. Assert exact net ledger movement (132766.27)
SELECT 
  sum(CASE WHEN direction = 'credit' THEN amount ELSE -amount END) = 132766.27 AS net_movement_ok
FROM public.transactions;

-- 4. Assert sum of student balances equals net movement
SELECT 
  round(sum(current_balance), 2) = 132766.27 AS balances_ok
FROM public.student_balances;
```

---

## 4. Frontend Deployment Procedure

1. Merge `zls-rebuild` branch into `main` after receiving administrative release authorization.
2. Trigger production build in Vercel.
3. Perform smoke testing on live production URL:
   - Login as Super Admin (`Sinanneyy`).
   - Open `/students` and verify student roster and health badges.
   - Open `/reports/cashbook` and verify arithmetic reconciliation status.
   - Open `/administration/users` and verify user administration panel.
   - Test Parent login and verify isolation to linked child.

---

## 5. Non-Destructive Rollback Plan

If any post-migration sanity assertion fails:
1. **Frontend Fallback**: Revert Vercel deployment alias to previous release tag (instant rollback).
2. **Database Continuity**: Because all four rebuild migrations are additive (adding new columns, RPCs, views, and RLS policies without dropping existing production tables), the legacy application continues functioning safely.
3. **Emergency Snapshot Restore**: Restore from pre-migration backup only if irreversible data mutation occurred.
