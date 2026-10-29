# ZLS Security & Role Migration Strategy

**Document Version:** 1.0.0  
**Phase:** 2 (Database Security & Migration Readiness)  
**System:** Zainussunna Ledger System (ZLS)  

---

## 1. Role Value Mapping Matrix

The legacy database uses an enum `user_role` containing `('owner', 'manager', 'staff')`. The rebuild introduces four canonical application roles: `super_admin`, `admin`, `faculty`, and `parent`.

To ensure backwards compatibility during cutover, the enum is non-destructively extended rather than replaced in-place:

| Legacy Role (`user_role`) | Proposed Canonical Target Role | Access Scope | Migration Rationale |
| :--- | :--- | :--- | :--- |
| **`owner`** | **`super_admin`** | Full institutional control; sole user manager | Preserves complete administrative access for primary institutional owner. |
| **`manager`** | **`admin`** | Financial mutations, composer, reversals | Retains operational administrative permissions without user creation rights. |
| **`staff`** | **`faculty`** | Read-only students, balances, rosters | Revokes unverified financial mutation rights; ensures safe read-only access until authorized. |
| *(None)* | **`parent`** | Read-only linked children only | Newly introduced for student guardian access via `parent_students`. |

---

## 2. Handling Verified Production Accounts

The live database export (`zls-data.sql`) verified the presence of two authentication records:

### Account 1: Institutional Owner (`Sinanneyy`)
- **`auth.users.id`**: `3567680f-e34c-42ec-90df-371fc3469a43`
- **Email**: `sinanneyy@zainussunna.com`
- **Current Profile**: `profiles.role = 'owner'`
- **Migration Treatment**:
  - Profile record and foreign key joins remain strictly preserved.
  - Role is migrated from `'owner'` to `'super_admin'`:
    ```sql
    UPDATE public.profiles 
    SET role = 'super_admin' 
    WHERE id = '3567680f-e34c-42ec-90df-371fc3469a43';
    ```
  - This user becomes the designated initial Super Admin authorized to provision subsequent users and assign roles.

### Account 2: Orphaned Auth Account (`ramdash@zainussunna.com`)
- **`auth.users.id`**: `0da2fed7-bbd8-47d9-8ee4-4a0cf2022063`
- **Email**: `ramdash@zainussunna.com`
- **Current Profile**: **Missing** (Zero rows in `public.profiles`).
- **Security Analysis**:
  - The user successfully registered in `auth.users`, but an initial profile record was never created. Under legacy RLS, this user had undefined permissions.
- **Migration Treatment**:
  - Do NOT automatically promote this user or guess their intended permissions.
  - Insert a quarantined, deactivated profile with the lowest privilege until the Super Admin explicitly activates it:
    ```sql
    INSERT INTO public.profiles (id, full_name, role, is_active)
    VALUES (
      '0da2fed7-bbd8-47d9-8ee4-4a0cf2022063',
      'Ramdash (Pending Verification)',
      'faculty',
      false -- Quarantined: inactive until Super Admin review
    )
    ON CONFLICT (id) DO NOTHING;
    ```

---

## 3. Zero-Downtime Atomic Policy Replacement

Replacing Row Level Security policies can inadvertently create a security window if existing policies are dropped before replacement policies are created.

### Safe Policy Replacement Protocol
All policy migrations are executed inside a single atomic DDL transaction:
```sql
BEGIN;

-- 1. Create new comprehensive policies first under new distinct names
CREATE POLICY "Students viewable by authorized roles and parents" ON public.students ...;
CREATE POLICY "Admins can insert students" ON public.students ...;
CREATE POLICY "Super admins can delete students" ON public.students ...;

-- 2. Drop legacy permissive or flawed policies
DROP POLICY IF EXISTS "Students are viewable by authenticated users" ON public.students;
DROP POLICY IF EXISTS "Staff can insert students" ON public.students;
DROP POLICY IF EXISTS "Managers can update students" ON public.students;

COMMIT;
```
Because PostgreSQL transactions are transactional for DDL, there is zero nanosecond interval where tables are left unprotected by RLS.

---

## 4. Rollback and Forward-Recovery Protocol

1. **Pre-Migration Snapshot**:
   - The verified database backup exists at `~/Documents/ZLS-Database-Backup/`.
2. **Forward-Recovery Priority**:
   - If a constraint or RLS evaluation fails during migration execution in staging, the transaction aborts automatically (`ON_ERROR_STOP=1`), leaving the database in its clean original state.
3. **Rollback Script (`rollback_security_foundation.sql`)**:
   - In the event that a migration must be reverted post-commit:
     - Drops `parent_students` table.
     - Restores legacy RLS policies on `profiles`, `students`, and `transactions`.
     - Leaves enum values intact (enum additions in PostgreSQL are non-breaking and cannot be removed without dropping the type).
