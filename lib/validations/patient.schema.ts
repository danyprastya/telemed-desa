import { z } from 'zod'

/**
 * Zod schema for creating a new patient.
 * puskesmas_id is set server-side from the nurse's profile — not sent by client.
 */
export const createPatientSchema = z.object({
  full_name: z.string().min(2, 'Nama lengkap minimal 2 karakter').max(100, 'Nama terlalu panjang'),
  nik: z.string().length(16, 'NIK harus 16 digit').regex(/^\d+$/, 'NIK harus berupa angka'),
  date_of_birth: z.string().refine((val) => !isNaN(Date.parse(val)), 'Tanggal lahir tidak valid'),
  gender: z.enum(['male', 'female']),
  address: z.string().min(5, 'Alamat minimal 5 karakter').max(500, 'Alamat terlalu panjang'),
  medical_record_no: z.string().min(1, 'Nomor rekam medis wajib diisi').max(50, 'Nomor terlalu panjang'),
})

/**
 * Zod schema for updating a patient.
 * All fields are optional.
 */
export const updatePatientSchema = z.object({
  full_name: z.string().min(2, 'Nama lengkap minimal 2 karakter').max(100).optional(),
  date_of_birth: z.string().refine((val) => !isNaN(Date.parse(val)), 'Tanggal lahir tidak valid').optional(),
  gender: z.enum(['male', 'female']).optional(),
  address: z.string().min(5).max(500).optional(),
})

export type CreatePatientInput = z.infer<typeof createPatientSchema>
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>
