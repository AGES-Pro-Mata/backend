import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const ExperienceSchema = z.object({
  experienceId: z.string(),
});

const PersonSchema = z.object({
  name: z.string(),
  phone: z.string(),
  birthDate: z.string(),
  document: z.string(),
  gender: z.string(),
});

export const FinalizeReservationSchema = z.object({
  userId: z.string(),
  experiences: z.array(ExperienceSchema),
  peopleList: z.array(PersonSchema).optional(),
  notes: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
});

export class CreateFinalizeReservationDto extends createZodDto(FinalizeReservationSchema) {}

const UpdateReservationSchema = z.object({
  action: z.string(),
  text: z.string().optional(),
});

export class UpdateReservationDto extends createZodDto(UpdateReservationSchema) {}
