import { RequestType } from 'generated/prisma';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const InsertRequestScheme = z.object({
  description: z.string().nullable().optional(),
  type: z.enum(Object.values(RequestType)),
  professorId: z.string().optional(),
  reservationGroupId: z.string().optional(),
});

export class InsertRequestDto extends createZodDto(InsertRequestScheme) {}
