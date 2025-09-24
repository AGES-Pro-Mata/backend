import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const UpdateReservation = z.object({
  action: z.string(),
  text: z.string().optional(),
});

export class UpdateReservationDto extends createZodDto(UpdateReservation) {}
