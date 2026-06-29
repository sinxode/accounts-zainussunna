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
          role: 'owner' | 'manager' | 'staff'
          permissions: Json
          last_login: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          role?: 'owner' | 'manager' | 'staff'
          permissions?: Json
          last_login?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: 'owner' | 'manager' | 'staff'
          permissions?: Json
          last_login?: string | null
          is_active?: boolean
          created_at?: string
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
          operation_id: string | null // Replaces event_id
          transaction_type: 'deposit' | 'withdrawal' | 'adjustment' | 'internal_transfer' | 'external_loan' | 'recovery'
          direction: 'credit' | 'debit'
          purpose: string
          amount: number
          transaction_date: string
          is_reversed: boolean
          reversed_at: string | null
          reversed_by: string | null
          reversal_reason: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          operation_id?: string | null
          transaction_type: 'deposit' | 'withdrawal' | 'adjustment' | 'internal_transfer' | 'external_loan' | 'recovery'
          direction: 'credit' | 'debit'
          purpose: string
          amount: number
          transaction_date?: string
          is_reversed?: boolean
          reversed_at?: string | null
          reversed_by?: string | null
          reversal_reason?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          operation_id?: string | null
          transaction_type?: 'deposit' | 'withdrawal' | 'adjustment' | 'internal_transfer' | 'external_loan' | 'recovery'
          direction?: 'credit' | 'debit'
          purpose?: string
          amount?: number
          transaction_date?: string
          is_reversed?: boolean
          reversed_at?: string | null
          reversed_by?: string | null
          reversal_reason?: string | null
          created_by?: string
          created_at?: string
        }
      }
      operations: { // New table, replaces events
        Row: {
          id: string
          operation_name: string
          operation_type: 'bulk' | 'quick' | 'transfer' | 'loan'
          description: string | null
          metadata: Json
          status: 'draft' | 'pending' | 'completed' | 'archived'
          created_by: string
          completed_by: string | null
          operation_date: string
          completed_at: string | null
          preset_id: string | null
          batch_id: string | null
          total_amount: number
          participant_count: number
          created_at: string
        }
        Insert: {
          id?: string
          operation_name: string
          operation_type: 'bulk' | 'quick' | 'transfer' | 'loan'
          description?: string | null
          metadata?: Json
          status?: 'draft' | 'pending' | 'completed' | 'archived'
          created_by: string
          completed_by?: string | null
          operation_date?: string
          completed_at?: string | null
          preset_id?: string | null
          batch_id?: string | null
          total_amount?: number
          participant_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          operation_name?: string
          operation_type?: 'bulk' | 'quick' | 'transfer' | 'loan'
          description?: string | null
          metadata?: Json
          status?: 'draft' | 'pending' | 'completed' | 'archived'
          created_by?: string
          completed_by?: string | null
          operation_date?: string
          completed_at?: string | null
          preset_id?: string | null
          batch_id?: string | null
          total_amount?: number
          participant_count?: number
          created_at?: string
        }
      }
      // ... other tables remain, but references to event_id would be updated to operation_id in a real migration
    }
  }
}
