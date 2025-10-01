import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const UpdateReservation = z.object({
  action: z.string(),
  text: z.string().optional(),
});

export class UpdateReservationDto extends createZodDto(UpdateReservation) {}

export const ReservationAdminSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(8),
  birthDate: z.coerce.date(),
  document: z.string().min(1),
  gender: z.string().min(1),
  note: z.string().nullable().optional(),
  experience: z.object({
    name: z.string(),
    price: z.number().nullable().optional(),
    startDate: z.coerce.date().nullable().optional(),
    endDate: z.coerce.date().nullable().optional(),
    capacity: z.number(),
    trailLength: z.number().nullable().optional(),
    durationMinutes: z.number().nullable().optional(),
  }),
  actions: z.array(
    z.object({
      type: z.string(),
      date: z.coerce.date(),
      createdBy: z.string(),
      description: z.string().nullable().optional(),
    }),
  ),
});

export class ReservationAdminDto extends createZodDto(ReservationAdminSchema) {}

// For User
export const ReservationUserSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(8),
  birthDate: z.coerce.date(),
  document: z.string().min(1),
  gender: z.string().min(1),
  note: z.string().nullable().optional(),
  experience: z.object({
    name: z.string(),
    price: z.number().nullable().optional(),
    startDate: z.coerce.date().nullable().optional(),
    endDate: z.coerce.date().nullable().optional(),
    capacity: z.number(),
    trailLength: z.number().nullable().optional(),
    durationMinutes: z.number().nullable().optional(),
  }),
});

export class ReservationUserDto extends createZodDto(ReservationUserSchema) {}
