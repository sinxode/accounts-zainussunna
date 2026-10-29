# ZLS Rebuild — Human UAT Staging Execution Checklist

**Document Version:** 1.0  
**Target Environment:** Isolated Local Staging Application  
**Execution Purpose:** Operational user acceptance validation by Academy Administrators prior to production cutover  
**Important Notice:** This checklist must be executed by designated human academy personnel. Do not fabricate or simulate human signatures. Retain physical or digital evidence for all test items.

---

## 1. Designated User Personas & Test Credentials

| Persona Role | Intended Tester | Test Account / Identifier | Purpose |
| :--- | :--- | :--- | :--- |
| **Super Admin** | Lead Academy Trustee / IT Director | `superadmin@zls.test` | System administration & user roles |
| **Finance Admin** | Academy Accountant / Cashier | `admin@zls.test` | Daily deposits, withdrawals, loans |
| **Academic Faculty**| Headmaster / Teacher | `faculty@zls.test` | Student attendance & read-only directory |
| **Guardian / Parent**| Parent Volunteer | `parent@zls.test` | Student statements & fee history |

---

## 2. Step-by-Step Test Scenarios

### Scenario 1: Single Deposit and Withdrawal
- **Assigned Tester:** Finance Admin (`admin@zls.test`)
- **Action Steps:**
  1. Navigate to `/students` and select a test student (e.g., `Synthetic Student Alpha`).
  2. Click **New Deposit**, enter Amount `₹1,000.00`, Purpose `"Term 1 Fees"`, and submit.
  3. Verify the balance increases by exactly ₹1,000.00.
  4. Click **New Withdrawal**, enter Amount `₹300.00`, Purpose `"Canteen Books"`, and submit.
  5. Verify the balance decreases to ₹700.00.
- **Evidence to Retain:** Screenshot of the student balance card showing ₹700.00 and the two ledger rows.

---

### Scenario 2: Transaction Reversal with Reason Enforcement
- **Assigned Tester:** Finance Admin (`admin@zls.test`)
- **Action Steps:**
  1. On the student ledger, locate the `₹300.00` withdrawal from Scenario 1.
  2. Click the **Reverse Transaction** button.
  3. Attempt to submit with a short reason: `"error"`. Confirm the system blocks submission requiring at least 10 characters.
  4. Enter valid reason: `"Erroneous duplicate entry recorded in error"`, and submit.
  5. Confirm original transaction displays `Reversed` badge and a new `+₹300.00` reversal credit appears.
  6. Confirm student balance restores to `₹1,000.00`.
- **Evidence to Retain:** Screenshot showing both the strikethrough/badge on the original row and the compensating leg.

---

### Scenario 3: Bulk Posting & Atomic Failure Rejection
- **Assigned Tester:** Finance Admin (`admin@zls.test`)
- **Action Steps:**
  1. Navigate to `/operations/bulk`.
  2. Compose a 3-leg distribution:
     - Student A: `₹500.00`
     - Student B: `₹500.00`
     - Student C (Archived/Inactive): `₹500.00`
  3. Submit the bulk batch.
  4. Verify the system rejects the entire submission atomically with an error notice.
  5. Check Student A's balance to confirm **zero** partial funds were credited.
- **Evidence to Retain:** Error notification screenshot and student ledger showing zero change.

---

### Scenario 4: Internal Peer Student Loan & Repayment
- **Assigned Tester:** Finance Admin (`admin@zls.test`)
- **Action Steps:**
  1. Navigate to `/operations/loans` -> **Internal Loans**.
  2. Record loan from Student Alpha to Student Beta for `₹200.00` (Purpose: `"Textbook borrow"`).
  3. Confirm Student Alpha balance decreases by ₹200.00 and Student Beta increases by ₹200.00.
  4. Click **Record Repayment** on the active loan; enter partial repayment of `₹100.00`.
  5. Confirm loan status stays `active` with remaining outstanding balance of `₹100.00`.
  6. Record remaining repayment of `₹100.00`.
  7. Confirm loan status transitions to `settled` with `₹0.00` outstanding.
- **Evidence to Retain:** Screenshot of the settled internal loan summary card.

---

### Scenario 5: External Contractor Loan & Recovery
- **Assigned Tester:** Finance Admin (`admin@zls.test`)
- **Action Steps:**
  1. Navigate to `/borrowers` and select an active contractor (e.g., `Synthetic Contractor Nasir`).
  2. View active loan details (`₹5,000.00`).
  3. Click **Record Recovery**, enter Amount `₹1,500.00`, Date, and Receipt Note.
  4. Confirm outstanding loan balance decrements to `₹3,500.00`.
  5. Verify that no erroneous transaction was inserted into the student cashbook.
- **Evidence to Retain:** Screenshot of the updated borrower loan balance.

---

### Scenario 6: Parent Multi-Child Statement Isolation
- **Assigned Tester:** Parent Tester (`parent@zls.test`)
- **Action Steps:**
  1. Log into the application using the Parent test credentials.
  2. Verify that the parent dashboard only lists the linked student(s).
  3. Attempt to navigate directly via URL to an unlinked student ID (e.g., `/students/<unlinked-id>`).
  4. Verify the system displays an Access Denied / 404 message and discloses zero data.
- **Evidence to Retain:** Screenshot of linked student statement and Access Denied screen on unlinked URL.

---

### Scenario 7: Faculty Read-Only Directory Access
- **Assigned Tester:** Faculty Member (`faculty@zls.test`)
- **Action Steps:**
  1. Log into the application using Faculty credentials.
  2. Navigate to `/students` and verify student names and enrolment numbers are visible.
  3. Verify that **Deposit**, **Withdrawal**, **Delete**, and **Role Management** buttons are hidden or disabled.
  4. Attempt to navigate to `/borrowers` or `/settings/users`.
  5. Confirm access is denied.
- **Evidence to Retain:** Screenshot of the read-only student directory interface.

---

### Scenario 8: Cashbook Report & Arithmetic Reconciliation
- **Assigned Tester:** Academy Accountant (`admin@zls.test`)
- **Action Steps:**
  1. Navigate to `/reports/cashbook`.
  2. Verify that:
     $$\text{Total Deposits} - \text{Total Withdrawals} = \text{Net Movement}$$
  3. Compare Net Movement against the **Sum of All Student Balances** on the summary widget.
  4. Confirm Variance reads exactly `₹0.00`.
- **Evidence to Retain:** Screenshot of the Cashbook Reconciliation summary widget.

---

### Scenario 9: Branded Export Generation (PDF & CSV)
- **Assigned Tester:** Finance Admin (`admin@zls.test`)
- **Action Steps:**
  1. On the Student Statement page, click **Export PDF**.
  2. Confirm the generated PDF includes the official Zainussunna Academy header, logo, student metadata, date range, and statement balance.
  3. On the Cashbook page, click **Export CSV**.
  4. Open the CSV in Excel or Numbers and confirm columns and amounts format correctly.
- **Evidence to Retain:** Downloaded PDF statement file and CSV file.

---

### Scenario 10: Audit Log Verification
- **Assigned Tester:** Super Admin (`superadmin@zls.test`)
- **Action Steps:**
  1. Navigate to `/settings/audit`.
  2. Verify that all transactions, reversals, loans, and role assignments executed during Scenarios 1–9 appear chronologically with timestamps, user IDs, and before/after metadata.
- **Evidence to Retain:** Screenshot of the recent audit log event list.

---

## 3. Human UAT Sign-Off Template

*(To be printed and physically signed following staging completion)*

```
I hereby confirm that I have personally executed the test scenarios assigned above in the 
isolated ZLS Staging Environment and have verified that the system operates in accordance with 
academy financial requirements and security standards.

Finance Administrator Signature: _______________________ Date: ______________
Lead Trustee / Super Admin Signature: __________________ Date: ______________
```
