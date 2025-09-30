import { RequestType } from 'generated/prisma';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const UpdateReservation = z.object({
  type: z.enum(Object.values(RequestType)),
  description: z.string().optional(),
});

export class UpdateReservationDto extends createZodDto(UpdateReservation) {}
