# ZLS Master Specification

**Document Version:** 1.0.0  
**Status:** Approved Foundation  
**System:** Zainussunna Ledger System (ZLS)  
**Target:** Rebuild of Institutional Cashbook & Financial Ledger  

---

## 1. Executive Overview

The **Zainussunna Ledger System (ZLS)** is the dedicated financial management and cashbook platform for **Zainussunna Academy**. It tracks student balances, deposits, disbursements, peer-to-peer student loans, external borrower loans, batch distributions, and financial statements.

This rebuild replaces fragile, non-atomic, and inconsistent legacy workflows with an **append-only, immutable financial core**, verifiable server-side Row Level Security (RLS), multi-role access control, and an enterprise user experience.

---

## 2. User Roles and Authorization Matrix

The system enforces four distinct, mutually exclusive roles. Every user account authenticates via username and password.

| Role | Operational Scope | Financial Mutation Rights | User & System Administration |
| :--- | :--- | :--- | :--- |
| **Super Admin** | Institution-wide oversight | Full mutation rights; reversal authorization; period lock management | Exclusive right to invite, create, deactivate users, and assign roles |
| **Admin** | Daily financial operations | Immediate posting of deposits, withdrawals, bulk transactions; reversals with mandatory reason | Cannot manage user accounts, invite users, or alter global role assignments |
| **Faculty** | Educational & academic tracking | Read-only access to students, rosters, balances, transactions, and statements | No mutation rights; no administrative privileges |
| **Parent** | Student guardian tracking | Strictly isolated read-only access to explicitly linked children's records only | No access to global student rosters or other students' transactions |

### Authorization Invariants
1. **Server-Side Authorization**: Hiding UI buttons or client routes is strictly for user experience. Authorization must be enforced exclusively at the database layer using PostgreSQL Row Level Security (RLS) policies and security-definer functions.
2. **Immutability of System Ownership**: Staff and Admin users cannot self-escalate or reassign roles. User creation and role modification are restricted to the Super Admin.
3. **Parent Data Isolation**: Parent queries to `students`, `transactions`, and `student_health` must evaluate against a verified `parent_students` junction table linked to `auth.uid()`.

---

## 3. Core Financial Principles

### 3.1. Ledger Immutability
- **No Physical Deletions**: Financial transaction records (`transactions`) must never be deleted through application workflows. Hard `DELETE` operations are completely revoked from client roles.
- **Compensating Entries for Reversals**: A mistake or cancellation is corrected by issuing an explicit compensating reversal transaction linked to the original transaction ID.
- **Audit Logging**: Every financial write, reversal, settings update, and administrative role change automatically records an immutable event in `audit_logs` capturing timestamp, actor (`user_id`), entity ID, and before/after payloads.

### 3.2. Atomicity & Double-Entry Integrity
- **Multi-Record Operations**: Operations with multiple legs (such as student-to-student internal transfers, bulk composer distributions, and borrower disbursements) must execute within an atomic PostgreSQL transaction. If any record fails validation, the entire operation is rolled back.
- **Idempotency & Duplicate Prevention**: All mutation endpoints require an idempotency key (client-generated UUID) to prevent accidental duplicate postings caused by double-clicks, network retries, or keydown repeats.
- **Rounding and Numeric Precision**: All currency calculations use exact PostgreSQL `NUMERIC(12, 2)` arithmetic. Floating-point conversions in JavaScript must be avoided by using integer cent representations or fixed-point string utilities.

### 3.3. Lending & Credit Rules
- **External Borrower Loans**: External loans are funded directly from the student fund. Every disbursement must post a debit to the cashbook fund, and every recovery must credit the cashbook fund.
- **Internal Student Lending**: Student-to-student borrowing is tracked as an active loan balance. The loan remains open with an outstanding liability until settled via an explicit repayment transaction.
- **Negative Balances**: Overdrafts and negative student balances are technically permitted to prevent operational gridlock, but are automatically flagged with visual health badges (`low`, `negative`) and surfaced in risk dashboards.

---

## 4. User Experience & UI Principles

1. **"What Stays the Same?" Workflow**: Retain the Transaction Composer V2 model for multi-party operations. Users specify shared fields once (Date, Purpose, Type, Amount), and only complete individual missing values in Step 2.
2. **Keyboard-First Efficiency**: Data-entry drawers must support standard keyboard accelerators:
   - `Enter`: Navigate to the next field or step.
   - `Cmd + Enter` / `Ctrl + Enter`: Process and submit immediately.
   - `Escape`: Cancel and close with dirty-state confirmation.
3. **Single Unified Overlay Architecture**: Consolidate all drawers and modal dialogs under a single top-level state provider, eliminating competing stores and stuck backdrops.
4. **Responsive Mobile Ergonomics**: Dense financial tables must gracefully collapse into swipeable, stacked detail cards on mobile screens (`< 768px`).

---

## 5. Reporting & Statement Requirements

| Report | Purpose | Audience | Export Format |
| :--- | :--- | :--- | :--- |
| **Student Account Statement** | Itemized ledger with opening balance, deposits, withdrawals, and closing balance | Students, Parents, Faculty, Admins | PDF (official printable banner) & Excel (.xlsx) |
| **Monthly Financial Summary** | Cash inflows, outflows, transaction volume, and operational breakdown | Admins, Super Admins | PDF & Excel |
| **Cashbook Trial Balance** | Daily and periodic reconciliation of physical cash versus cumulative liabilities | Super Admin, Auditors | On-screen & Excel |
| **Borrower Exposure Report** | Outstanding loan balances, risk tiers, and overdue aging schedules | Admins, Super Admins | On-screen & Excel |
| **System Audit Trail** | Chronological log of administrative actions, reversals, and role adjustments | Super Admin | On-screen & CSV |

---

## 6. Migration and Data Continuity Requirements

1. **Zero Data Loss**: Migrate and reconcile the reported live dataset:
   - `79` active students
   - `303` historical transactions (`201` withdrawals, `102` deposits)
   - `22` borrowers
   - `20` borrower loans (totaling ₹196,562.00)
   - `4` saved batches and `24` batch members
   - `4` transaction presets
   - `13` audit logs
2. **Preserve Primary UUIDs**: Maintain exact historical UUIDs for students, transactions, and loans to ensure paper vouchers, past receipts, and external audit references remain valid.
3. **Standardize Name Formats**: Automatically clean student name prefixes (`Muhammed`, `Muhammad`, `Mohammed`, `Mohamed`) during migration.
4. **Preserve Batch & Preset Associations**: Ensure all student batch memberships and composer presets function seamlessly in the rebuilt interface.

---

## 7. Acceptance Criteria for Complete Rebuild

- [ ] All four user roles (Super Admin, Admin, Faculty, Parent) authenticate via username and password.
- [ ] Database RLS strictly isolates Parent queries to linked children and blocks Faculty from performing mutations.
- [ ] Self-privilege escalation on user profiles is completely prevented at the database policy level.
- [ ] Internal transfers and multi-record bulk transactions execute within atomic PostgreSQL functions with rollback guarantees.
- [ ] Hard deletion of transactions is blocked by database permissions; reversals generate compensating entries with mandatory audit reasons.
- [ ] External borrower loans and repayments post linked entries to the core cashbook ledger.
- [ ] All 79 students and 303 historical transactions reconcile 100% against the live backup dump.
- [ ] Automated test suite verifies ledger calculations, RLS rules, and transfer atomicity.
