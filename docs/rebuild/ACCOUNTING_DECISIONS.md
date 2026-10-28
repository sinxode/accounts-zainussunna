# ZLS Accounting Decisions & Financial Model

**Document Version:** 1.0.0  
**Status:** Approved Foundation  
**System:** Zainussunna Ledger System (ZLS)  

---

## 1. Confirmed Accounting Rules

The following financial rules are confirmed for the ZLS rebuild:

1. **Immediate Posting**: Transactions authored by authorized Admins or Super Admins post immediately to the ledger. There is no intermediate "unposted draft" state.
2. **Immutable Ledger Entries**: Posted transactions are never edited in place or hard-deleted. Corrections occur strictly via linked compensating reversal transactions.
3. **Mandatory Reversal Justifications**: Reversing a posted transaction requires a documented explanation (minimum 10 characters) and is recorded in `audit_logs` with the authorizing user ID.
4. **Funding of External Loans**: External loans disbursed to outside borrowers are funded directly from the academy's student cash fund.
5. **Tracking of Peer-to-Peer Loans**: Student-to-student internal lending is tracked as a loan receivable/payable pair with an outstanding balance until explicit repayment.
6. **Negative Balance Tolerance**: Negative student balances are permitted to prevent blocking urgent campus operations, but are flagged visually in all views as requiring recovery.
7. **Atomic Multi-Record Execution**: Operations with multiple legs (such as internal transfers or bulk composer distributions) must post atomically. Partial commits are prohibited.

---

## 2. Unresolved Accounting Decisions

To ensure financial integrity, the rebuild team must not guess or fabricate institutional financial conventions. The following seven matters remain **strictly unresolved** and require explicit written determination by academy leadership:

### Decision 1: Fundamental Meaning of a Student Balance
- **Question**: In the academy's financial arrangement, what does a positive student balance legally represent?
  - *Option A (Academy Liability / Student Trust Deposit)*: The academy holds the student's money in trust. A positive balance means the academy owes that money back to the student. Deposits increase liability; withdrawals decrease liability.
  - *Option B (Prepaid Tuition / Fee Asset)*: The balance represents prepaid credits against future academy tuition, mess bills, and store expenses.
- **Impact on Schema**: Determines whether student statements display balances as credits (liabilities) or debits (assets) in standard accounting terminology.

### Decision 2: Mechanism of Internal Student Loans
- **Question**: When Student A lends ₹500 to Student B, how does the money move?
  - *Option A (Virtual Account Reallocation)*: Student A's ledger balance decreases by ₹500, and Student B's ledger balance increases by ₹500. No physical cash leaves the academy office.
  - *Option B (Physical Cash Lending with Academy Guarantee)*: Student B takes ₹500 in physical cash from the office against Student A's written voucher. The academy acts as guarantor.
- **Impact on Schema**: Determines whether internal loans create linked accounts receivable records or pure ledger balance shifts.

### Decision 3: Completeness of Historical Ledger & Opening Balances
- **Question**: Are the 303 historical transactions the complete financial record since academy inception, or do students have pre-existing opening balances?
  - *Option A (Complete Inception Record)*: Transactions represent all cash movements from Day 1; opening balances are exactly ₹0.00.
  - *Option B (Cutoff Migration)*: ZLS started tracking transactions after a prior paper/Excel ledger was closed, meaning students had non-zero starting balances.
- **Impact on Schema**: If Option B, we must add an `opening_balance` column to `students` with an `opening_balance_date` before reconciling statements.

### Decision 4: External Loan Repayments Collected Outside ZLS
- **Question**: The live database records 20 active borrower loans totaling ₹196,562.00, but **zero recovery repayment records**. Did borrowers make cash repayments that were recorded only on physical paper receipts?
  - *Action Required*: The academy finance administrator must verify whether any of the 22 borrowers made partial or full cash settlements that need to be backfilled.

### Decision 5: Accounting Treatment of Legacy Transaction Types
- **Question**: Legacy code defined six transaction types: `deposit`, `withdrawal`, `distribution`, `store_bill`, `collection`, `adjustment`. What are their precise accounting impacts?
  - In legacy data, only `deposit` (102 rows) and `withdrawal` (201 rows) exist.
  - The team must define whether `store_bill` is an expense debit, whether `collection` is a student contribution or an administrative inflow, and whether `distribution` is an academy grant.

### Decision 6: Historical Treatment of Existing Reversed Records
- **Question**: Legacy code settled internal transfers by setting `is_reversed = true` on the original transactions. How should these historical rows be presented in new statements?
  - *Option A*: Maintain them as historically canceled transactions.
  - *Option B*: Re-interpret them as completed loans with matched historical repayments.

### Decision 7: Period Locking Authority and Exception Protocols
- **Question**: Once an accounting period is locked, can a Super Admin ever unlock it, or must adjustments for closed months be posted in the currently open period?

---

## 3. Proposed Accounting Model: Dual-Ledger Cashbook

To resolve the decoupling of external loans and prevent double-counting of student fund cash, the rebuild implements a **Dual-Ledger Cashbook Model**:

```
+-----------------------------------------------------------------------------------+
|                        CENTRAL ACADEMY CASH POOL (CASHBOOK)                       |
|           Debit = Cash Received into Academy Office / Bank                        |
|           Credit = Cash Disbursed from Academy Office / Bank                      |
+-----------------------------------------------------------------------------------+
           |                                                      |
           v (Source of Funds)                                    v (Loan Disbursement)
+-----------------------------------+                  +----------------------------+
|      STUDENT LIABILITY LEDGER     |                  |   BORROWER ASSET LEDGER    |
|  - Student Deposits (Credit)      |                  |  - Loan Principal (Debit)  |
|  - Student Withdrawals (Debit)    |                  |  - Recoveries (Credit)     |
|  - Net Balance = Current Funds    |                  |  - Outstanding Receivables |
+-----------------------------------+                  +----------------------------+
```

### Flow A: Student Cash Deposit
1. Cash enters the office: Central Cash Pool increases by ₹1,000 (Debit Cash).
2. Student Account is credited: Student Liability increases by ₹1,000 (Credit Student).
3. **Net Cash Impact**: +₹1,000 in office; +₹1,000 owed to student.

### Flow B: External Borrower Loan Disbursement
1. Outside borrower receives loan: Central Cash Pool decreases by ₹5,000 (Credit Cash).
2. Borrower Loan Receivable is established: Borrower Asset increases by ₹5,000 (Debit Loan Receivable).
3. **No Double-Counting**: Student accounts are NOT debited individually. The total student cash pool backs the loan, and the institution's balance sheet reflects ₹5,000 in cash transformed into ₹5,000 in loan receivables.

### Flow C: External Borrower Repayment
1. Borrower repays ₹2,000 in cash: Central Cash Pool increases by ₹2,000 (Debit Cash).
2. Borrower Loan Receivable decreases: Outstanding loan balance reduced by ₹2,000 (Credit Loan Receivable).
3. **Net Cash Impact**: Physical cash restored; student fund liquidity replenished.
