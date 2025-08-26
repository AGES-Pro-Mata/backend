import { z } from 'zod';

export const UserPayloadSchema = z.object({
  id: z.uuid(),
  role: z.enum(['USER', 'PROFESSOR', 'ADMIN', 'ROOT']),
});

export type UserPayload = z.infer<typeof UserPayloadSchema>;
