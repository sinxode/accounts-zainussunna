# ZLS Rebuild — Historical Data Migration Contract & Reconciliation Specification

**Document Version:** 1.0.0  
**Phase:** Prompt 7 of 8  
**System:** Zainussunna Ledger System (ZLS)  
**Date:** 2026-10-29  
**Branch:** `zls-rebuild`  
**Status:** Validated in Isolated Staging (`zls_restore_test`)

---

## 1. Executive Summary

This document defines the formal data migration contract, schema drift resolutions, reconciliation results, and backup recovery protocols for transitioning existing historical data into the rebuilt Zainussunna Ledger System (ZLS).

All procedures were rehearsed and mathematically proven using the physical database exports stored in `~/Documents/ZLS-Database-Backup` (`zls-roles.sql`, `zls-schema.sql`, `zls-data.sql`) restored into an isolated local database instance (`zls_restore_test`).

### Fundamental Invariants
1. **Zero Production Mutation:** This specification does NOT execute or authorize production writes or deployments.
2. **Deterministic & Idempotent:** Migration operations are repeatable without duplicating transactions or corrupting ledger states.
3. **Primary Key Continuity:** Original UUIDs for all students, transactions, borrowers, loans, and batches are 100% preserved. No synthetic surrogate keys are generated.
4. **Honest Accounting:** Historical ambiguities (such as missing pre-ledger opening balances and undocumented external loans) are surfaced with explicit disclosures rather than concealed with artificial balancing entries.

---

## 2. Backup & Recovery Plan Verification

The physical backup files generated on October 28, 2026, were verified:

| File Name | File Size | Timestamp | Structure & Content | Verification Status |
| :--- | :---: | :---: | :--- | :--- |
| `zls-roles.sql` | 358 B | 2026-10-28 21:58 | PostgreSQL role timeouts (`anon`, `authenticated`, `authenticator`, `supabase_admin`) | **Verified** |
| `zls-schema.sql` | 41 KB | 2026-10-28 21:58 | DDL for 18 public tables, custom types, enums, indexes, and triggers | **Verified** (Requires Supabase auth stubs in stock Postgres) |
| `zls-data.sql` | 132 KB | 2026-10-28 21:58 | COPY data for 18 public tables, auth sessions, and identities | **Verified** (100% row counts restored) |

### Restore Rehearsal Evidence (`zls_restore_test`)
A dedicated staging database (`zls_restore_test`) was initialized, populated from the physical backup files, and upgraded with the four forward-only rebuild migrations. 

#### Restored Operational Row Counts
- **Students (`public.students`):** Exactly 79 rows restored.
- **Transactions (`public.transactions`):** Exactly 303 rows restored.
- **Borrowers (`public.borrowers`):** Exactly 22 rows restored.
- **Borrower Loans (`public.borrower_loans`):** Exactly 20 rows restored.
- **Saved Batches (`public.saved_batches`):** Exactly 4 rows restored.
- **Batch Members (`public.batch_members`):** Exactly 24 rows restored.
- **Transaction Presets (`public.transaction_presets`):** Exactly 4 rows restored.
- **System Settings (`public.settings`):** Exactly 3 rows restored.
- **Audit Logs (`public.audit_logs`):** Exactly 13 rows restored.
- **Profiles (`public.profiles`):** Exactly 1 row restored (`Sinanneyy`, Owner).

### Restoration Prerequisites Checklist
When restoring into a clean PostgreSQL or Supabase environment:
1. **Target Extensions:** Ensure `pgcrypto` and `uuid-ossp` extensions exist in the `extensions` schema. (Note: `supabase_vault` is cloud-proprietary and must be omitted on self-hosted instances).
2. **Auth Schema Stubs:** In non-Supabase standalone instances, stub `auth.uid()` and `auth.role()` functions to allow RLS policies to compile.
3. **Restoration Order:**
   - Step 1: Execute `zls-roles.sql`
   - Step 2: Execute base DDL (`zls-schema.sql`)
   - Step 3: Execute table data (`zls-data.sql`)
   - Step 4: Execute forward rebuild migrations:
     - `20261028000000_security_rbac_foundation.sql`
     - `20261028000001_financial_engine_core.sql`
     - `20261029000000_operational_workflows.sql`
     - `20261030000000_reporting_and_reconciliation.sql`
   - Step 5: Execute post-migration reconciliation assertions.

---

## 3. Comprehensive Migration Contract

### 3.1. Entity Mapping & Field Preservation Matrix

| Source Table & Field | Destination Table & Field | Data Type | Transformation / Conversion Rule | Preservation Requirement |
| :--- | :--- | :--- | :--- | :--- |
| `students.id` | `students.id` | `UUID` | Direct 1:1 mapping | **Mandatory:** Exact UUID preserved |
| `students.enrolment_no`| `students.enrolment_no`| `TEXT` | Direct 1:1 mapping (`UNIQUE`) | Preserved (`ZLS-001` through `ZLS-079`) |
| `students.name` | `students.name` | `TEXT` | Whitespace trimmed via trigger | Original name text preserved |
| `students.status` | `students.status` | `student_status` | Direct enum mapping (`active`, `archived`)| 65 active, 14 archived preserved |
| `transactions.id` | `transactions.id` | `UUID` | Direct 1:1 mapping | **Mandatory:** Exact UUID preserved |
| `transactions.student_id`| `transactions.student_id`| `UUID` | Foreign key to `students(id)` | Exact referential integrity preserved |
| `transactions.amount` | `transactions.amount` | `NUMERIC(12,2)`| Exact decimal; validated $> 0$ | Exact monetary value preserved |
| `transactions.direction`| `transactions.direction`| `transaction_direction`| Direct enum (`credit`, `debit`) | 102 credits, 201 debits preserved |
| `transactions.transaction_type`| `transactions.transaction_type`| `transaction_type`| Direct enum (`deposit`, `withdrawal`)| 102 deposits, 201 withdrawals preserved |
| `transactions.purpose`| `transactions.purpose` | `TEXT` | Trimmed text description | Original narrative description preserved |
| `transactions.operation_id`| `transactions.operation_id`| `UUID` | Preserved when present; NULL preserved | 113 populated, 190 NULL preserved |
| `transactions.is_reversed`| `transactions.is_reversed`| `BOOLEAN` | Direct boolean flag | Preserved (all 303 are `false`) |
| `transactions.reversal_of_id`| `transactions.reversal_of_id`| `UUID` | Added in rebuild migration | NULL for all 303 historical rows |
| `transactions.transaction_date`| `transactions.transaction_date`| `TIMESTAMPTZ`| Preserved UTC timestamp | Exact historical posting date preserved |
| `borrowers.id` | `borrowers.id` | `UUID` | Direct 1:1 mapping | Exact UUID preserved |
| `borrowers.name` | `borrowers.name` | `TEXT` | Direct 1:1 mapping | Exact borrower contact preserved |
| `borrower_loans.id` | `borrower_loans.id` | `UUID` | Direct 1:1 mapping | Exact UUID preserved |
| `borrower_loans.loan_amount`| `borrower_loans.loan_amount`| `NUMERIC(12,2)`| Direct 1:1 mapping | Sum = ₹196,562.00 preserved |
| `saved_batches.id` | `saved_batches.id` | `UUID` | Direct 1:1 mapping | 4 saved batches preserved |
| `batch_members.id` | `batch_members.id` | `UUID` | Direct 1:1 mapping | 24 junction links preserved |
| `transaction_presets.id`| `transaction_presets.id`| `UUID` | Direct 1:1 mapping | 4 operational presets preserved |
| `settings.key` | `settings.key` | `TEXT` | Primary key 1:1 | 3 system configuration keys preserved |

---

## 4. Legacy Schema Drift Inventory & Resolutions

During audit and staging execution, four schema drift discrepancies between Git migrations and the live database were resolved:

```
Discrepancy                                 Status in Rebuild                Resolution
------------------------------------------  -------------------------------  ---------------------------------------------
1. atomic_internal_transfer RPC missing     Superseded & Implemented         Replaced with rpc_post_internal_transfer in
   from live database                       in 20261028000001                financial_engine_core (atomic double-entry)
2. clean_student_name trigger missing       Implemented                      Added trigger on public.students to trim
   from live database                       in 20261028000000                leading/trailing whitespace on insert/update
3. idx_transactions_operation_id index      Committed in Git                 Explicitly added in 20261028000001:
   existed in live but missing from Git     in 20261028000001                CREATE INDEX idx_transactions_operation_id
4. transactions.operation_id column         Harmonized in Git                Explicitly added via forward migration in
   existed in live but missing from Git     in 20261028000001                20261028000001 with NULL preservation
```

---

## 5. Historical Reconciliation & Balance Verification

### 5.1. Central Ledger Equality
Reconciliation executed against the restored staging database verified exact mathematical equality:

$$\sum \text{Gross Credits} = ₹225,702.84 \quad (102 \text{ transactions})$$
$$\sum \text{Gross Debits} = ₹92,936.57 \quad (201 \text{ transactions})$$
$$\text{Net Ledger Movement} = ₹225,702.84 - ₹92,936.57 = \mathbf{₹132,766.27}$$
$$\sum_{k=1}^{79} \text{Student Balance}_k = \mathbf{₹132,766.27}$$
$$\text{Discrepancy} = \mathbf{₹0.00}$$

### 5.2. Student Health & Balance Distribution
Across all 79 enrolled students:

| Health Category | Balance Range | Student Count | Aggregate Balance | Minimum Balance | Maximum Balance |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Healthy** | $> ₹500.00$ | **40** | ₹160,923.85 | ₹512.00 | ₹19,903.00 |
| **Negative Balance** | $< ₹0.00$ | **24** | -₹29,565.67 | -₹6,744.00 | -₹34.50 |
| **Low Balance** | ₹0.00 to ₹500.00 | **9** | ₹1,408.09 | ₹1.70 | ₹455.00 |
| **Empty Account** | Exactly ₹0.00 | **6** | ₹0.00 | ₹0.00 | ₹0.00 |
| **Total** | | **79** | **₹132,766.27** | **-₹6,744.00** | **₹19,903.00** |

### 5.3. Analysis of 24 Negative Balances
The existence of 24 students with negative balances (totaling -₹29,565.67) is an empirical reality of the legacy system:
- When the digital ledger was launched in August 2026, students began withdrawing funds or paying fees for services without their pre-existing paper ledger cash deposits being entered as opening balances.
- **Rebuild Rule:** Negative balances are preserved faithfully. The rebuild never manufactures fake deposit rows or clamps negative balances to zero. The user interface labels these accounts with a neutral `Negative Balance` badge.

### 5.4. Analysis of External Borrower Loans
- **Count:** 20 loans across 22 borrower contacts.
- **Total Principal:** ₹196,562.00.
- **Documented Recoveries in Database:** 0 rows.
- **Status:** All 20 loans remain classified as `active`.
- **Reconciliation Reality:** Because external recoveries may have occurred in cash or offline without being posted, outstanding amounts represent unverified claims. The system flags all 20 loans with a pre-rebuild historical loan disclosure.

---

## 6. Catalog of Known Historical Exceptions

1. **Missing Opening Balances:** 24 student accounts show negative running balances because initial capital was never credited upon ledger initialization.
2. **Missing Operation IDs:** 190 of 303 transactions have `operation_id = NULL` because batch operation tracking was added mid-lifecycle in August 2026.
3. **Legacy External Loans Without Terms:** 20 loans totaling ₹196,562 lack recorded maturity dates, payment schedules, or written agreements.
4. **Historical Prototype Events:** 10 events and 8 event participants exist from an abandoned prototype module with zero linked transactions.
5. **Placeholder Timestamp:** 1 historical saved batch contains placeholder metadata timestamp `1970-01-01`.

---

## 7. Migration Execution & Non-Destructive Rollback Protocol

### Pre-Migration Gate
1. Confirm Supabase production database snapshot is captured.
2. Verify checksum and non-zero size of backup files.
3. Place application in scheduled maintenance mode.

### Execution Steps
1. Apply forward migrations `20261028000000` through `20261030000000` via Supabase CLI.
2. Run database verification queries:
   - Verify 79 students present.
   - Verify 303 transactions present.
   - Verify net movement equals ₹132,766.27.
3. Switch DNS/Vercel router to the rebuilt application frontend.

### Non-Destructive Rollback Plan
If post-migration validation fails or financial totals do not reconcile:
- **Decision Point:** Triggered immediately if transaction count $\ne 303$ or student sum $\ne ₹132,766.27$.
- **Action:**
  1. Do NOT delete or mutate financial rows.
  2. Point frontend deployment back to the legacy release branch (`main` or previous Vercel deployment tag).
  3. Because all rebuild migrations are additive (adding new RPC functions, views, and non-destructive columns), the legacy application continues operating without schema breakage.
  4. Restore database from pre-migration snapshot only if irreversible data corruption occurred.
