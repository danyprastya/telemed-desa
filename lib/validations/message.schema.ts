import { z } from 'zod'

/**
 * Zod schema for sending a chat message.
 */
export const createMessageSchema = z.object({
  content: z.string()
    .min(1, 'Pesan tidak boleh kosong')
    .max(5000, 'Pesan terlalu panjang'),
})

export type CreateMessageInput = z.infer<typeof createMessageSchema>
