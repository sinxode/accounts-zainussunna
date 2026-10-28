# ZLS System Architecture & Technical Design

**Document Version:** 1.0.0  
**Status:** Approved Foundation  
**System:** Zainussunna Ledger System (ZLS)  

---

## 1. Architectural Overview

The Zainussunna Ledger System is architected as a **secure client-to-database platform** using React 19, TypeScript, and Vite on the frontend, powered by **Supabase PostgreSQL 17** as the authoritative financial backend.

```
+-----------------------------------------------------------------------------------+
|                           PRESENTATION LAYER (SPA)                               |
|   React 19  |  TypeScript  |  Vite  |  SCSS Modules + Tailwind  |  Lucide Icons   |
+-----------------------------------------------------------------------------------+
        |                                                   |
        | Reads (SELECT via Views & RLS)                    | Mutations (Atomic RPCs)
        v                                                   v
+-----------------------------------------------------------------------------------+
|                        TRUSTED BOUNDARY & DATA ACCESS                             |
|       TanStack React Query v5 (Caching, Optimistic Updates, Invalidation)         |
|       Supabase Client SDK (@supabase/supabase-js v2)                              |
+-----------------------------------------------------------------------------------+
        |                                                   |
        v                                                   v
+-----------------------------------------------------------------------------------+
|                        SUPABASE POSTGRESQL 17 ENGINE                              |
|                                                                                   |
|  +----------------------------+       +----------------------------------------+  |
|  |     Row Level Security     |       |       SECURITY DEFINER RPCs            |  |
|  | Strict Role Isolation      |       | - post_transaction_atomic()           |  |
|  | Parent-Child Scoping       |       | - post_internal_transfer()             |  |
|  | Read-Only Faculty Guard    |       | - reverse_transaction_atomic()         |  |
|  +----------------------------+       | - post_borrower_loan_atomic()          |  |
|                                       +----------------------------------------+  |
|                                                           |                       |
|  +--------------------------------------------------------v--------------------+  |
|  |                     IMMUTABLE CORE TABLES & LEDGER                         |  |
|  | transactions (Append-Only) | students | borrowers | borrower_loans          |  |
|  | audit_logs (System-Triggered) | saved_batches | accounting_periods          |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Trusted Financial-Operation Boundary

In the legacy implementation, multi-step operations were performed client-side using sequential HTTP requests (e.g. debited student A, then credited student B). 

### Rebuilt Invariant
**All financial writes must occur inside atomic PostgreSQL stored procedures (`SECURITY DEFINER` RPC functions).** Direct `INSERT`, `UPDATE`, or `DELETE` on the `transactions` table from client connections is prohibited by RLS policies.

### Core Financial RPC Functions
1. `rpc_post_transaction(p_student_id, p_type, p_direction, p_amount, p_purpose, p_idempotency_key)`:
   - Validates caller role (`admin` or `super_admin`).
   - Checks if transaction date falls in a locked accounting period.
   - Inserts transaction record with idempotency deduplication.
   - Writes an immutable event to `audit_logs`.
2. `rpc_post_internal_transfer(p_from_student_id, p_to_student_id, p_amount, p_purpose, p_operation_id)`:
   - Executes inside a single database transaction.
   - Inserts the debit leg for the lender and the credit leg for the borrower.
   - Inserts a linked internal loan tracking entry (`internal_loans`).
   - Writes an audit log entry referencing the atomic pair.
3. `rpc_reverse_transaction(p_transaction_id, p_reason)`:
   - Validates caller role and mandatory reason string (minimum 10 characters).
   - Generates an exact inverted compensating transaction linked via `reversal_of_id`.
   - Flags the original transaction as reversed without altering historical monetary amounts.
   - Writes the reversal reason and author ID to `audit_logs`.
4. `rpc_disburse_borrower_loan(p_borrower_id, p_amount, p_purpose, p_source_fund)`:
   - Records the loan under `borrower_loans`.
   - Posts a corresponding cash withdrawal in the institutional ledger.
   - Writes an audit record.

---

## 3. Secure Username Authentication Design

Supabase GoTrue Auth natively relies on email addresses for authentication. However, confirmed academy requirements mandate **username-and-password login**.

### Recommended Secure Architecture
To avoid exposing an unauthenticated directory, storing plaintext credentials, or relying on client-side role validation:

1. **Virtual Internal Email Domain**:
   - Every username is deterministically mapped to a non-routable internal identity format:
     `username` $\rightarrow$ `username@internal.zls.local`
2. **Normalized Username Store**:
   - The `profiles` table stores `username TEXT UNIQUE NOT NULL CHECK (username ~ '^[a-zA-Z0-9_.-]{3,30}$')`.
3. **Login Execution**:
   - When a user inputs their username in the login form, the client converts it to `[normalized_username]@internal.zls.local` and invokes standard `supabase.auth.signInWithPassword({ email: mappedEmail, password })`.
   - No public lookup table is queried prior to authentication.
   - Brute-force protection and rate-limiting are handled by Supabase Auth engine.
4. **Super-Admin User Provisioning RPC**:
   - Only the Super Admin can create users. User creation executes through a secure database function (`rpc_create_user`) that verifies caller permissions before creating the `auth.users` and `profiles` records.

---

## 4. Server-Side Authorization & RLS Model

### Role Architecture
The database enum `user_role` is structured as:
```sql
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'faculty', 'parent');
```

### Row Level Security (RLS) Policies

#### `profiles` Table
- **SELECT**: Authenticated users can view basic profile data (full name, role) of colleagues.
- **UPDATE**: Users can only update their own non-sensitive profile information (`avatar_url`). Role elevation is strictly restricted:
  ```sql
  CREATE POLICY "Super admin can update roles" ON profiles
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'));
  ```

#### `students` & `transactions` Tables
- **Super Admin & Admin**: Full read access; mutations routed via RPCs.
- **Faculty**: Read-only `SELECT` access to all students and non-confidential transactions.
- **Parent**: Strictly scoped `SELECT` access using an explicit junction table:
  ```sql
  CREATE POLICY "Parents view linked children only" ON students
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM parent_students ps
        WHERE ps.student_id = students.id
          AND ps.parent_profile_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'faculty')
      )
    );
  ```

---

## 5. Data Access Layer & State Management

### Client Data Access
- **TanStack React Query v5**: Central cache manager. All read queries are typed and configured with stale-time heuristics (e.g. 30 seconds for student health summary, 5 minutes for batches).
- **Service Layer**: Decoupled service modules (`studentService.ts`, `transactionService.ts`, `reportService.ts`) contain typed wrapper functions that call either Supabase query builders (reads) or RPC functions (writes).
- **Optimistic Updates**: For rapid single deposit/withdrawal entry, UI states update optimistically with rollback on mutation error.

### UI State Management
- **Consolidated Zustand Store (`useUIStore.ts`)**: Replaces the competing `OperationsDrawerContext` and legacy modal states with a single state container:
  ```typescript
  interface UIStoreState {
    activeDrawer: 'composer' | 'deposit' | 'withdrawal' | 'transfer' | 'loan' | 'batch' | 'preset' | null;
    drawerContextData: Record<string, any> | null;
    isCommandPaletteOpen: boolean;
    openDrawer: (drawer: DrawerType, data?: any) => void;
    closeDrawer: () => void;
  }
  ```

---

## 6. Hosting & Mobile Packaging

- **Web Hosting**: Hosted as a static Single Page Application (SPA) on **Vercel** with global CDN distribution and SPA rewrite rules (`/* -> /index.html`).
- **Mobile Container**: Packaged via **Capacitor 8** for iOS and Android, wrapping the authenticated web application with native hardware access, offline error screens, and secure biometric session resumption.
