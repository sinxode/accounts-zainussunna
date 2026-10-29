# ZLS Username Authentication Technical Design & Evaluation

**Document Version:** 1.0.0  
**Phase:** 2 (Database Security & Auth Design)  
**System:** Zainussunna Ledger System (ZLS)  

---

## 1. Context & Business Requirement

Confirmed product requirement:
> **All four application roles (Super Admin, Admin, Faculty, Parent) must authenticate using a username and password.**

However, the Supabase Auth engine (GoTrue) natively requires either an **email address** or a **phone number (E.164)** as the primary identity identifier. 

This document evaluates three viable architectures for implementing username-based login without compromising security, exposing directories, or writing fragile custom password verifiers.

---

## 2. Evaluation of Architectural Approaches

### Approach 1: Deterministic Synthetic Email (`username@internal.zls.local`)

#### Mechanism
1. Every user profile has a validated `username` (e.g. `sinan`, `faculty_ali`, `parent_102`).
2. When creating an account, the backend maps the username to an internal, non-routable synthetic email address:  
   $$\text{email} = \text{lower}(\text{trim}(\text{username})) \mathbin{\Vert} \text{"@internal.zls.local"}$$
3. The client login form displays only **Username** and **Password** inputs. Upon form submission, the client computes the synthetic email address and invokes:
   ```typescript
   supabase.auth.signInWithPassword({
     email: `${username.toLowerCase().trim()}@internal.zls.local`,
     password: password
   });
   ```

#### Security & Operational Analysis
- **Standard GoTrue Compatibility**: 100% native compatibility. Utilizes standard Supabase session management, JWT issuance, refresh tokens, and brute-force protection.
- **Account Enumeration Resistance**: Because the mapping is deterministic ($\text{username} \rightarrow \text{username@internal.zls.local}$), the client makes no pre-flight lookup request to PostgREST. An attacker cannot query a public directory to discover registered usernames.
- **No Plaintext Passwords**: Password hashing (bcrypt) is handled entirely by Supabase Auth's hardened GoTrue service.
- **Password Reset / Account Recovery**: Because `@internal.zls.local` is non-routable, automated self-service email resets cannot function for these synthetic accounts. **Account recovery must be administrative**: a Super Admin issues a temporary one-time password or reset link via the trusted `admin_set_user_password` RPC.

---

### Approach 2: Server-Side Username Resolution (Edge Function / RPC)

#### Mechanism
1. User provides `username` and `password`.
2. The client calls an RPC or Supabase Edge Function: `resolve_username(username)`.
3. The function looks up the internal email associated with the username in a private schema (`auth_identities`) accessible only to service role.
4. The server returns the mapped email or authenticates the user server-side and returns the session tokens.

#### Security & Operational Analysis
- **Enumeration Vulnerability**: If the resolver endpoint returns whether a username exists before verifying credentials, it creates an account enumeration vector.
- **Latency**: Introduces an extra network hop or requires hosting custom serverless Edge Functions.
- **Service Role Exposure Risk**: If written as an RPC, any flaw in the function could expose internal emails to unauthenticated callers.

---

### Approach 3: Independent Auth Table with `pgcrypto`

#### Mechanism
1. Create a custom table `app_credentials(user_id, username, password_hash)`.
2. Verify passwords via `crypt(input_password, password_hash)`.
3. Issue custom signed JWTs.

#### Security & Operational Analysis
- **High Security Risk**: Bypasses the entire tested Supabase Auth ecosystem (session invalidation, rate-limiting, MFA, token rotation).
- **Prohibited by Safety Rules**: Explicitly prohibited by Rebuild Prompt 2 ("Do not store passwords in application tables or write a custom password verifier").

---

## 3. Recommended Approach & Specification

**We recommend Approach 1 (Deterministic Synthetic Email)** with administrative recovery.

### Detailed Specification

#### 1. Username Validation Constraints
Usernames must be enforced at the database level on `profiles`:
```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

ALTER TABLE public.profiles
ADD CONSTRAINT chk_username_format 
CHECK (username ~ '^[a-z0-9_.-]{3,30}$');
```
- Minimum 3 characters, maximum 30 characters.
- Lowercase alphanumeric, underscore, dot, or hyphen only.
- Case-insensitive uniqueness enforced via lowercase normalization.

#### 2. User Creation Flow (Super Admin Only)
1. Super Admin inputs **Full Name**, **Username**, **Temporary Password**, and **Role**.
2. Frontend calls the trusted database function:
   ```sql
   rpc_provision_user(
     p_username TEXT,
     p_full_name TEXT,
     p_temporary_password TEXT,
     p_role user_role
   )
   ```
3. The function:
   - Validates caller is an active Super Admin.
   - Asserts username uniqueness.
   - Provisions the account in `auth.users` with email `[username]@internal.zls.local`.
   - Inserts the matching record in `profiles`.
   - Logs the creation event in `audit_logs`.

#### 3. Administrative Password Reset Flow
Because users do not have public inbox delivery on internal synthetic addresses:
- If a Faculty or Parent user forgets their password, they contact the Academy Super Admin.
- The Super Admin resets the credential via an administrative function (`admin_reset_password`), which generates a temporary password and flags `must_change_password = true` in profile metadata.
- On subsequent login, the client prompts the user to choose a new password.

---

## 4. Unresolved Questions for Academy Leadership

Before finalizing:
1. **Parent Email Addresses**: Do parents want optional real email addresses on file for report card statements, or should guardian accounts strictly use student enrollment IDs as usernames (e.g. `parent_ZLS102`)?
2. **Password Policy**: What is the academy's required minimum password complexity (e.g., minimum 8 characters, alphanumeric)?
