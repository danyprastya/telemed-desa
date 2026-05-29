import { z } from 'zod'

/**
 * Zod schema for recording vital signs.
 * systolic_bp and diastolic_bp are optional.
 */
export const createVitalSignSchema = z.object({
  temperature: z.number()
    .min(30, 'Suhu minimal 30°C')
    .max(45, 'Suhu maksimal 45°C'),
  heart_rate: z.number()
    .int('Denyut nadi harus bilangan bulat')
    .min(20, 'Denyut nadi minimal 20 bpm')
    .max(250, 'Denyut nadi maksimal 250 bpm'),
  spo2: z.number()
    .int('SpO2 harus bilangan bulat')
    .min(0, 'SpO2 minimal 0%')
    .max(100, 'SpO2 maksimal 100%'),
  systolic_bp: z.number()
    .int('Tekanan sistolik harus bilangan bulat')
    .min(40, 'Tekanan sistolik minimal 40 mmHg')
    .max(300, 'Tekanan sistolik maksimal 300 mmHg')
    .optional()
    .nullable(),
  diastolic_bp: z.number()
    .int('Tekanan diastolik harus bilangan bulat')
    .min(20, 'Tekanan diastolik minimal 20 mmHg')
    .max(200, 'Tekanan diastolik maksimal 200 mmHg')
    .optional()
    .nullable(),
}).refine(
  (data) => {
    // If one BP value is provided, both must be provided
    if (data.systolic_bp !== undefined && data.systolic_bp !== null) {
      return data.diastolic_bp !== undefined && data.diastolic_bp !== null
    }
    if (data.diastolic_bp !== undefined && data.diastolic_bp !== null) {
      return data.systolic_bp !== undefined && data.systolic_bp !== null
    }
    return true
  },
  { message: 'Jika mengisi tekanan darah, isi keduanya (sistolik dan diastolik)' }
)

export type CreateVitalSignInput = z.infer<typeof createVitalSignSchema>
