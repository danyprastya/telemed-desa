/**
 * API request and response types.
 * Used for consistent typing across frontend fetch calls and API route handlers.
 */

/** Standard API success response wrapper */
export interface ApiResponse<T> {
  data: T
  error: null
}

/** Standard API error response wrapper */
export interface ApiErrorResponse {
  data: null
  error: string
}

/** Paginated list response */
export interface PaginatedResponse<T> {
  data: {
    items: T[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
  error: null
}

/** Pagination query parameters */
export interface PaginationParams {
  page?: number
  limit?: number
}

/** Patient list query parameters */
export interface PatientListParams extends PaginationParams {
  search?: string
}

/** Consultation list query parameters */
export interface ConsultationListParams extends PaginationParams {
  status?: 'open' | 'in_progress' | 'closed'
}

/** User list query parameters (admin) */
export interface UserListParams extends PaginationParams {
  role?: string
  search?: string
}

/** Notification list query parameters */
export interface NotificationListParams extends PaginationParams {
  unread_only?: boolean
}

/** Admin system stats */
export interface SystemStats {
  total_patients: number
  total_nurses: number
  total_doctors: number
  open_consultations: number
  in_progress_consultations: number
  closed_consultations_today: number
  total_puskesmas: number
  total_hospitals: number
}
