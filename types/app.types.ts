/**
 * Application-level shared types.
 * These types are used across both frontend and backend.
 */

/** Vital sign clinical status */
export type VitalStatus = 'normal' | 'warning' | 'critical'

/** Consultation status matching the DB enum */
export type ConsultationStatus = 'open' | 'in_progress' | 'closed'

/** Notification types matching the DB enum */
export type NotificationType =
  | 'new_consultation'
  | 'new_message'
  | 'consultation_claimed'
  | 'consultation_closed'

/** Patient gender matching the DB enum */
export type PatientGender = 'male' | 'female'

/** User role matching the DB enum */
export type UserRole = 'admin' | 'doctor' | 'nurse'

/** Profile shape used across the app */
export interface Profile {
  id: string
  full_name: string
  role: UserRole
  puskesmas_id: string | null
  hospital_id: string | null
  is_active: boolean
  created_at: string
}

/** Patient record */
export interface Patient {
  id: string
  full_name: string
  nik: string
  date_of_birth: string
  gender: PatientGender
  address: string
  medical_record_no: string
  puskesmas_id: string
  created_by: string
  is_deleted: boolean
  created_at: string
  updated_at: string
  puskesmas?: Puskesmas
  latest_vital?: VitalSign
}

/** Vital sign record */
export interface VitalSign {
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
  recorder?: Profile
}

/** Consultation record */
export interface Consultation {
  id: string
  patient_id: string
  nurse_id: string
  doctor_id: string | null
  vital_sign_id: string | null
  status: ConsultationStatus
  closing_notes: string | null
  referral_needed: boolean
  created_at: string
  closed_at: string | null
  patient?: Patient
  nurse?: Profile
  doctor?: Profile
  vital_sign?: VitalSign
}

/** Chat message record */
export interface Message {
  id: string
  consultation_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: Profile
}

/** Notification record */
export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  link: string | null
  is_read: boolean
  created_at: string
}

/** Puskesmas (remote health center) */
export interface Puskesmas {
  id: string
  name: string
  location: string
  created_at: string
}

/** Hospital */
export interface Hospital {
  id: string
  name: string
  location: string
  created_at: string
}

/** Audit log entry */
export interface AuditLog {
  id: string
  user_id: string | null
  action: string
  target_table: string
  target_id: string | null
  details: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}
