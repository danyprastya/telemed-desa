/**
 * Formats a date string to Indonesian locale date format.
 * @param dateString - ISO date string.
 * @returns Formatted date string, e.g. "29 Mei 2026"
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Formats a date string to short date format.
 * @param dateString - ISO date string.
 * @returns Formatted date string, e.g. "29/05/2026"
 */
export function formatDateShort(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Formats a timestamp to date + time string.
 * @param dateString - ISO date string.
 * @returns e.g. "29/05 14:30"
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}/${month} ${hours}:${minutes}`
}

/**
 * Formats a timestamp to time only.
 * @param dateString - ISO date string.
 * @returns e.g. "14:30"
 */
export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Returns a relative time string like "5 detik lalu", "3 menit lalu".
 * @param dateString - ISO date string.
 * @returns Relative time string in Indonesian.
 */
export function formatRelativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)

  if (diffSeconds < 60) return `${diffSeconds} detik lalu`
  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} jam lalu`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} hari lalu`
}

/**
 * Calculates age from date of birth.
 * @param dob - Date of birth string (ISO format).
 * @returns Age in years.
 */
export function calculateAge(dob: string): number {
  const today = new Date()
  const birthDate = new Date(dob)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

/**
 * Formats gender enum to Indonesian display string.
 * @param gender - 'male' or 'female'.
 * @returns 'Laki-laki' or 'Perempuan'.
 */
export function formatGender(gender: 'male' | 'female'): string {
  return gender === 'male' ? 'Laki-laki' : 'Perempuan'
}

/**
 * Formats consultation status to Indonesian display string.
 * @param status - The consultation status.
 * @returns Indonesian label.
 */
export function formatConsultationStatus(status: 'open' | 'in_progress' | 'closed'): string {
  const labels: Record<string, string> = {
    open: 'Menunggu',
    in_progress: 'Berlangsung',
    closed: 'Selesai',
  }
  return labels[status] || status
}
