import { z } from 'zod'

/**
 * Zod schema for creating a new user (admin action).
 * puskesmas_id is required for nurses, hospital_id for doctors.
 */
export const createUserSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter').max(72, 'Password terlalu panjang'),
  full_name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama terlalu panjang'),
  role: z.enum(['admin', 'doctor', 'nurse'], { required_error: 'Pilih role' }),
  puskesmas_id: z.string().uuid('ID Puskesmas tidak valid').optional().nullable(),
  hospital_id: z.string().uuid('ID Rumah Sakit tidak valid').optional().nullable(),
}).refine(
  (data) => {
    if (data.role === 'nurse') return data.puskesmas_id != null
    return true
  },
  { message: 'Puskesmas wajib dipilih untuk perawat', path: ['puskesmas_id'] }
).refine(
  (data) => {
    if (data.role === 'doctor') return data.hospital_id != null
    return true
  },
  { message: 'Rumah Sakit wajib dipilih untuk dokter', path: ['hospital_id'] }
)

/**
 * Zod schema for updating a user profile (admin action).
 */
export const updateUserSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  role: z.enum(['admin', 'doctor', 'nurse']).optional(),
  puskesmas_id: z.string().uuid().optional().nullable(),
  hospital_id: z.string().uuid().optional().nullable(),
  is_active: z.boolean().optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
