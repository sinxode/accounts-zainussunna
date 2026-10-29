export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          role: 'super_admin' | 'admin' | 'faculty' | 'parent' | 'owner' | 'manager' | 'staff'
          permissions: Json
          last_login: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          role?: 'super_admin' | 'admin' | 'faculty' | 'parent' | 'owner' | 'manager' | 'staff'
          permissions?: Json
          last_login?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: 'super_admin' | 'admin' | 'faculty' | 'parent' | 'owner' | 'manager' | 'staff'
          permissions?: Json
          last_login?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      parent_students: {
        Row: {
          id: string
          parent_profile_id: string
          student_id: string
          relationship_type: string
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          parent_profile_id: string
          student_id: string
          relationship_type?: string
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          parent_profile_id?: string
          student_id?: string
          relationship_type?: string
          created_at?: string
          created_by?: string | null
        }
      }
      students: {
        Row: {
          id: string
          enrolment_no: string
          name: string
          status: 'active' | 'archived'
          notes: string | null
          created_at: string
          updated_at: string
          archived_at: string | null
        }
        Insert: {
          id?: string
          enrolment_no: string
          name: string
          status?: 'active' | 'archived'
          notes?: string | null
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
        Update: {
          id?: string
          enrolment_no?: string
          name?: string
          status?: 'active' | 'archived'
          notes?: string | null
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
      }
      transactions: {
        Row: {
          id: string
          student_id: string
          operation_id: string | null
          transaction_type: 'deposit' | 'withdrawal' | 'adjustment' | 'store_bill' | 'distribution' | 'collection'
          direction: 'credit' | 'debit'
          purpose: string
          amount: number
          transaction_date: string
          is_reversed: boolean
          reversed_at: string | null
          reversed_by: string | null
          reversal_reason: string | null
          reversal_of_id: string | null
          idempotency_key: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          operation_id?: string | null
          transaction_type: 'deposit' | 'withdrawal' | 'adjustment' | 'store_bill' | 'distribution' | 'collection'
          direction: 'credit' | 'debit'
          purpose: string
          amount: number
          transaction_date?: string
          is_reversed?: boolean
          reversed_at?: string | null
          reversed_by?: string | null
          reversal_reason?: string | null
          reversal_of_id?: string | null
          idempotency_key?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          operation_id?: string | null
          transaction_type?: 'deposit' | 'withdrawal' | 'adjustment' | 'store_bill' | 'distribution' | 'collection'
          direction?: 'credit' | 'debit'
          purpose?: string
          amount?: number
          transaction_date?: string
          is_reversed?: boolean
          reversed_at?: string | null
          reversed_by?: string | null
          reversal_reason?: string | null
          reversal_of_id?: string | null
          idempotency_key?: string | null
          created_by?: string
          created_at?: string
        }
      }
      internal_loans: {
        Row: {
          id: string
          operation_id: string
          lender_student_id: string
          borrower_student_id: string
          principal_amount: number
          outstanding_amount: number
          status: 'active' | 'settled' | 'defaulted'
          loan_date: string
          notes: string | null
          idempotency_key: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          operation_id: string
          lender_student_id: string
          borrower_student_id: string
          principal_amount: number
          outstanding_amount: number
          status?: 'active' | 'settled' | 'defaulted'
          loan_date?: string
          notes?: string | null
          idempotency_key?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          operation_id?: string
          lender_student_id?: string
          borrower_student_id?: string
          principal_amount?: number
          outstanding_amount?: number
          status?: 'active' | 'settled' | 'defaulted'
          loan_date?: string
          notes?: string | null
          idempotency_key?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      internal_loan_repayments: {
        Row: {
          id: string
          loan_id: string
          amount: number
          repayment_date: string
          operation_id: string
          notes: string | null
          idempotency_key: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          loan_id: string
          amount: number
          repayment_date?: string
          operation_id: string
          notes?: string | null
          idempotency_key?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          loan_id?: string
          amount?: number
          repayment_date?: string
          operation_id?: string
          notes?: string | null
          idempotency_key?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      borrowers: {
        Row: {
          id: string
          name: string
          phone: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      borrower_loans: {
        Row: {
          id: string
          borrower_id: string
          loan_amount: number
          loan_date: string
          purpose: string | null
          source_type: string
          source_event_id: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          borrower_id: string
          loan_amount: number
          loan_date?: string
          purpose?: string | null
          source_type?: string
          source_event_id?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          borrower_id?: string
          loan_amount?: number
          loan_date?: string
          purpose?: string | null
          source_type?: string
          source_event_id?: string | null
          status?: string
          created_at?: string
        }
      }
      recoveries: {
        Row: {
          id: string
          loan_id: string
          amount: number
          recovery_date: string
          notes: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          loan_id: string
          amount: number
          recovery_date?: string
          notes?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          loan_id?: string
          amount?: number
          recovery_date?: string
          notes?: string | null
          created_by?: string
          created_at?: string
        }
      }
      accounting_periods: {
        Row: {
          id: string
          period_year: number
          period_month: number
          is_locked: boolean
          locked_at: string | null
          locked_by: string | null
        }
        Insert: {
          id?: string
          period_year: number
          period_month: number
          is_locked?: boolean
          locked_at?: string | null
          locked_by?: string | null
        }
        Update: {
          id?: string
          period_year?: number
          period_month?: number
          is_locked?: boolean
          locked_at?: string | null
          locked_by?: string | null
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity: string
          entity_id: string | null
          old_values: Json | null
          new_values: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity: string
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity?: string
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      student_balances: {
        Row: {
          student_id: string
          current_balance: number
          last_transaction_date: string | null
          transaction_count: number
        }
      }
      student_health: {
        Row: {
          id: string
          enrolment_no: string
          name: string
          status: 'active' | 'archived'
          current_balance: number
          last_transaction_date: string | null
          health_status: 'healthy' | 'low' | 'empty' | 'negative'
        }
      }
      student_ledger_view: {
        Row: {
          transaction_id: string
          student_id: string
          student_name: string
          transaction_date: string
          transaction_type: string
          direction: 'credit' | 'debit'
          amount: number
          purpose: string
          operation_id: string | null
          idempotency_key: string | null
          reversal_of_id: string | null
          is_reversed: boolean
          reversal_reason: string | null
          reversed_at: string | null
          reversed_by: string | null
          running_balance: number
        }
      }
      borrower_loan_balances: {
        Row: {
          loan_id: string
          borrower_id: string
          loan_amount: number
          source_type: string
          total_recovered: number
          outstanding_amount: number
        }
      }
    }
    Functions: {
      check_is_financial_admin: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      check_period_unlocked: {
        Args: { p_date: string }
        Returns: void
      }
      rpc_post_transaction: {
        Args: {
          p_student_id: string
          p_transaction_type: 'deposit' | 'withdrawal' | 'adjustment' | 'store_bill' | 'distribution' | 'collection'
          p_direction: 'credit' | 'debit'
          p_amount: number
          p_purpose: string
          p_idempotency_key?: string | null
          p_operation_id?: string | null
        }
        Returns: Json
      }
      rpc_post_bulk_transactions: {
        Args: {
          p_transactions: Json
          p_operation_id?: string | null
          p_idempotency_key?: string | null
        }
        Returns: Json
      }
      rpc_reverse_transaction: {
        Args: {
          p_transaction_id: string
          p_reason: string
        }
        Returns: Json
      }
      rpc_post_internal_transfer: {
        Args: {
          p_lender_student_id: string
          p_borrower_student_id: string
          p_amount: number
          p_purpose: string
          p_operation_id?: string | null
          p_idempotency_key?: string | null
        }
        Returns: Json
      }
      rpc_repay_internal_loan: {
        Args: {
          p_loan_id: string
          p_amount: number
          p_notes?: string | null
          p_idempotency_key?: string | null
        }
        Returns: Json
      }
      rpc_record_borrower_recovery: {
        Args: {
          p_loan_id: string
          p_amount: number
          p_recovery_date?: string
          p_notes?: string | null
        }
        Returns: Json
      }
    }
  }
}
