import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const GetRequestsSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z
    .enum([
      'CREATED',
      'CANCELED',
      'CANCELED_REQUESTED',
      'EDITED',
      'REJECTED',
      'APPROVED',
      'PEOPLE_REQUESTED',
      'PAYMENT_REQUESTED',
      'PEOPLE_SENT',
      'PAYMENT_SENT',
    ])
    .optional(),
});

export class GetRequestsDto extends createZodDto(GetRequestsSchema) {}
