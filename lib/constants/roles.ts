/**
 * Role constants used throughout the application.
 * Maps to the user_role PostgreSQL enum.
 */
export const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

/**
 * Human-readable labels for each role (in Indonesian).
 */
export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrator',
  doctor: 'Dokter',
  nurse: 'Perawat/Bidan',
}

/**
 * Dashboard route for each role.
 */
export const ROLE_DASHBOARD: Record<Role, string> = {
  admin: '/admin',
  doctor: '/doctor',
  nurse: '/nurse',
}
