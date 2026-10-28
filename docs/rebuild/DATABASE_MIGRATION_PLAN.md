# ZLS Database Migration & Schema Harmonization Plan

**Document Version:** 1.0.0  
**Status:** Approved Foundation  
**System:** Zainussunna Ledger System (ZLS)  

---

## 1. Verified Live Schema & Table Inventory

The live PostgreSQL 17 database export (`zls-schema.sql` and `zls-data.sql`) contains the following 18 public tables:

| Table Name | Live Row Count | Primary Key | Critical Foreign Keys | Current Status / Role |
| :--- | :---: | :---: | :--- | :--- |
| **`students`** | **79** | `id UUID` | None | Core student directory; `enrolment_no UNIQUE` |
| **`transactions`** | **303** | `id UUID` | `student_id` $\rightarrow$ `students(id)`<br>`created_by` $\rightarrow$ `profiles(id)` | Core financial cashbook; `201` withdrawals, `102` deposits |
| **`borrowers`** | **22** | `id UUID` | None | Outside lending contacts; name, phone, risk level |
| **`borrower_loans`** | **20** | `id UUID` | `borrower_id` $\rightarrow$ `borrowers(id)` | External loans totaling ₹196,562.00 |
| **`saved_batches`** | **4** | `id UUID` | `created_by` $\rightarrow$ `profiles(id)` | Student group definitions |
| **`batch_members`** | **24** | `id UUID` | `batch_id` $\rightarrow$ `saved_batches`<br>`student_id` $\rightarrow$ `students` | Student-to-batch junction records |
| **`transaction_presets`** | **4** | `id UUID` | None | Composer reusable transaction templates |
| **`audit_logs`** | **13** | `id UUID` | `user_id` $\rightarrow$ `profiles(id)` | Historical administrative audit entries |
| **`events`** | **10** | `id UUID` | `created_by` $\rightarrow$ `profiles(id)` | Legacy prototype operations (0 linked transactions) |
| **`event_participants`**| **8** | `id UUID` | `event_id` $\rightarrow$ `events(id)` | Legacy prototype participant records |
| **`settings`** | **3** | `key TEXT` | None | System key-value configurations |
| **`profiles`** | **1** | `id UUID` | `id` $\rightarrow$ `auth.users(id)` | User metadata and role assignments |
| **`recoveries`** | **0** | `id UUID` | `loan_id` $\rightarrow$ `borrower_loans(id)` | External loan repayments (empty) |
| **`accounting_periods`**| **0** | `id UUID` | `locked_by` $\rightarrow$ `profiles(id)` | Period lock calendar (empty) |
| **`notifications`** | **0** | `id UUID` | `user_id` $\rightarrow$ `profiles(id)` | In-app user notifications (empty) |
| **`event_templates`** | **0** | `id UUID` | None | Legacy operation templates (empty) |
| **`recent_student_access`**| **0** | `id UUID` | `user_id`, `student_id` | Quick-navigation tracking (empty) |
| **`user_favorites`** | **0** | `id UUID` | `user_id`, `student_id` | Student bookmarking (empty) |

---

## 2. Production Schema Drift Analysis

Comparison of the 8 committed migration scripts in `supabase/migrations/` with the live production schema export revealed **four major discrepancies**:

```
Repository Migrations (Git)               Production Database (Live Export)
--------------------------------------    -------------------------------------
20260614000000_init_schema.sql            Base tables and views present
20260614000001_atomic_event_rpc.sql       process_event_with_participants present
20260614000002_add_audit_logs_policy.sql  Audit logs policy present
20260614000003_update_audit_logs_policy   Audit logs policy present
20260616000000_atomic_internal_transfer   MISSING (Never executed in production)
20260617000000_add_transaction_presets    transaction_presets present
20260617000001_add_transaction_policies   Transaction update/delete policies present
20260802223700_trim_student_names.sql     MISSING (Never executed in production)
[No Migration in Git]                     idx_transactions_operation_id (Manually added)
[No Migration in Git]                     transactions.operation_id column (Manually added)
```

### Detailed Drift Findings
1. **`atomic_internal_transfer` Missing**:
   - The RPC function exists only as a file in Git. In the live database, `SELECT routine_name FROM information_schema.routines WHERE routine_name = 'atomic_internal_transfer'` returns zero rows.
2. **`clean_student_name` Missing**:
   - The trigger function and trigger `trg_clean_student_name` do not exist in the live database schema.
3. **`idx_transactions_operation_id` Present Without Migration**:
   - The index exists on the live `transactions` table but was never committed as a versioned migration script in `supabase/migrations/`.
4. **`operation_id` Column Present Without Migration**:
   - The column was applied directly to production, and 113 historical transactions reference an `operation_id`.

---

## 3. Data Preservation Strategy

The rebuild migration must preserve all historical data without distortion:

### 3.1. Primary Key Continuity
All imported records will retain their original `id UUID` values. No autoincrementing integers or synthetic UUIDs will replace original IDs.

### 3.2. Foreign Key Integrity Check (Pre-Migration)
Before applying the new schema in staging, run referential integrity checks:
```sql
-- Verify no orphaned transactions exist
SELECT t.id, t.student_id 
FROM transactions t 
LEFT JOIN students s ON t.student_id = s.id 
WHERE s.id IS NULL;

-- Verify all borrower loans join to valid borrowers
SELECT bl.id, bl.borrower_id 
FROM borrower_loans bl 
LEFT JOIN borrowers b ON bl.borrower_id = b.id 
WHERE b.id IS NULL;

-- Verify all batch members join to valid batches and students
SELECT bm.id 
FROM batch_members bm 
LEFT JOIN saved_batches sb ON bm.batch_id = sb.id 
LEFT JOIN students s ON bm.student_id = s.id 
WHERE sb.id IS NULL OR s.id IS NULL;
```
*(All three queries produced zero orphaned records in our live verification).*

---

## 4. Rebuilt Schema Baseline Structure

In Prompt 2, the drifted schema will be consolidated into a **clean, reproducible baseline**:

1. **`00001_initial_core.sql`**:
   - Recreates updated enums: `user_role` (`super_admin`, `admin`, `faculty`, `parent`), `student_status`, `transaction_direction`, `transaction_type`.
   - Core tables: `profiles`, `students`, `parent_students`, `transactions`, `borrowers`, `borrower_loans`, `recoveries`, `saved_batches`, `batch_members`, `transaction_presets`, `accounting_periods`, `audit_logs`.
2. **`00002_performance_indexes.sql`**:
   - Explicit B-tree indexes for all foreign keys and query filters:
     - `CREATE INDEX idx_transactions_student_date ON transactions(student_id, transaction_date DESC);`
     - `CREATE INDEX idx_transactions_operation_id ON transactions(operation_id) WHERE operation_id IS NOT NULL;`
     - `CREATE INDEX idx_borrower_loans_borrower ON borrower_loans(borrower_id);`
     - `CREATE INDEX idx_parent_students_parent ON parent_students(parent_profile_id);`
3. **`00003_financial_rpcs_and_triggers.sql`**:
   - Atomically creates `rpc_post_transaction`, `rpc_post_internal_transfer`, `rpc_reverse_transaction`, and `clean_student_name`.
4. **`00004_security_rls_policies.sql`**:
   - Sets non-bypassable RLS policies for Super Admin, Admin, Faculty, and Parent.

---

## 5. Staging Reconciliation Protocol

Before pointing the rebuilt application at production data:

1. **Restore Backup to Staging Database**:
   - Restore `zls-roles.sql`, `zls-schema.sql`, and `zls-data.sql` into an isolated staging instance.
2. **Apply Rebuild Migration Scripts**:
   - Run the consolidated rebuild migrations on staging.
3. **Record-Count Verification**:
   - Assert exact row match: `79` students, `303` transactions, `22` borrowers, `20` loans, `4` batches, `24` batch members.
4. **Ledger Balance Comparison**:
   - Compute total credits, debits, and student balances in staging and assert a 100% numerical match against the legacy database totals.
