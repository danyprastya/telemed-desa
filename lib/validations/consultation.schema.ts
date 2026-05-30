import { z } from 'zod'

/**
 * Zod schema for creating a new consultation.
 * vital_sign_id is optional — links to a specific vital reading.
 */
export const createConsultationSchema = z.object({
  doctor_id: z.string().uuid('Pilih dokter yang dituju'),
  vital_sign_id: z.string().uuid('ID tanda vital tidak valid').optional().nullable(),
  initial_message: z.string().max(2000, 'Pesan terlalu panjang').optional(),
})

/**
 * Zod schema for updating a consultation (doctor actions).
 */
export const updateConsultationSchema = z.object({
  doctor_id: z.string().uuid().optional(),
  status: z.enum(['open', 'in_progress', 'closed']).optional(),
  closing_notes: z.string().max(5000, 'Catatan terlalu panjang').optional().nullable(),
  referral_needed: z.boolean().optional(),
  closed_at: z.string().optional().nullable(),
})

export type CreateConsultationInput = z.infer<typeof createConsultationSchema>
export type UpdateConsultationInput = z.infer<typeof updateConsultationSchema>
