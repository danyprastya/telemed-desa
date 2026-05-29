/**
 * Placeholder for Supabase-generated database types.
 * Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts
 * to generate the actual types from your Supabase schema.
 *
 * For now, we define a minimal Database type that satisfies the Supabase client generics.
 */
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
      puskesmas: {
        Row: {
          id: string
          name: string
          location: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          location: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string
          created_at?: string
        }
      }
      hospitals: {
        Row: {
          id: string
          name: string
          location: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          location: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          role: 'admin' | 'doctor' | 'nurse'
          puskesmas_id: string | null
          hospital_id: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          full_name: string
          role: 'admin' | 'doctor' | 'nurse'
          puskesmas_id?: string | null
          hospital_id?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: 'admin' | 'doctor' | 'nurse'
          puskesmas_id?: string | null
          hospital_id?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          full_name: string
          nik: string
          date_of_birth: string
          gender: 'male' | 'female'
          address: string
          medical_record_no: string
          puskesmas_id: string
          created_by: string
          is_deleted: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          nik: string
          date_of_birth: string
          gender: 'male' | 'female'
          address: string
          medical_record_no: string
          puskesmas_id: string
          created_by: string
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          nik?: string
          date_of_birth?: string
          gender?: 'male' | 'female'
          address?: string
          medical_record_no?: string
          puskesmas_id?: string
          created_by?: string
          is_deleted?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      vital_signs: {
        Row: {
          id: string
          patient_id: string
          temperature: number
          heart_rate: number
          spo2: number
          systolic_bp: number | null
          diastolic_bp: number | null
          is_flagged: boolean
          flag_reasons: string[] | null
          recorded_by: string
          recorded_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          temperature: number
          heart_rate: number
          spo2: number
          systolic_bp?: number | null
          diastolic_bp?: number | null
          is_flagged?: boolean
          flag_reasons?: string[] | null
          recorded_by: string
          recorded_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          temperature?: number
          heart_rate?: number
          spo2?: number
          systolic_bp?: number | null
          diastolic_bp?: number | null
          is_flagged?: boolean
          flag_reasons?: string[] | null
          recorded_by?: string
          recorded_at?: string
        }
      }
      consultations: {
        Row: {
          id: string
          patient_id: string
          nurse_id: string
          doctor_id: string | null
          vital_sign_id: string | null
          status: 'open' | 'in_progress' | 'closed'
          closing_notes: string | null
          referral_needed: boolean
          created_at: string
          closed_at: string | null
        }
        Insert: {
          id?: string
          patient_id: string
          nurse_id: string
          doctor_id?: string | null
          vital_sign_id?: string | null
          status?: 'open' | 'in_progress' | 'closed'
          closing_notes?: string | null
          referral_needed?: boolean
          created_at?: string
          closed_at?: string | null
        }
        Update: {
          id?: string
          patient_id?: string
          nurse_id?: string
          doctor_id?: string | null
          vital_sign_id?: string | null
          status?: 'open' | 'in_progress' | 'closed'
          closing_notes?: string | null
          referral_needed?: boolean
          created_at?: string
          closed_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          consultation_id: string
          sender_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          consultation_id: string
          sender_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          consultation_id?: string
          sender_id?: string
          content?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'new_consultation' | 'new_message' | 'consultation_claimed' | 'consultation_closed'
          title: string
          body: string
          link: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'new_consultation' | 'new_message' | 'consultation_claimed' | 'consultation_closed'
          title: string
          body: string
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'new_consultation' | 'new_message' | 'consultation_claimed' | 'consultation_closed'
          title?: string
          body?: string
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          target_table: string
          target_id: string | null
          details: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          target_table: string
          target_id?: string | null
          details?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          target_table?: string
          target_id?: string | null
          details?: Json | null
          ip_address?: string | null
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: 'admin' | 'doctor' | 'nurse'
      patient_gender: 'male' | 'female'
      consultation_status: 'open' | 'in_progress' | 'closed'
      notification_type: 'new_consultation' | 'new_message' | 'consultation_claimed' | 'consultation_closed'
    }
  }
}
