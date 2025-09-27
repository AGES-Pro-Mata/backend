const ExperienceSchema = z.object({
  experienceId: z.string(),
  peopleCount: z.number().int().min(1),
  date: z.string(),
});

const PersonSchema = z.object({
  name: z.string(),
  phone: z.string(),
  birthDate: z.string(),
  document: z.string(),
  gender: z.string(),
});

export const FinalizeReservationSchema = z.object({
  experiences: z.array(ExperienceSchema),
  totalPeople: z.number().int().min(1),
  peopleList: z.array(PersonSchema).optional(),
  note: z.string().optional(),
  clientId: z.string(),
});

export class CreateFinalizeReservationDto extends createZodDto(FinalizeReservationSchema) {}
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

const UpdateReservation = z.object({
  action: z.string(),
  text: z.string().optional(),
});

export class UpdateReservationDto extends createZodDto(UpdateReservation) {}
