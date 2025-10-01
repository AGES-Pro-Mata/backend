import { z } from 'zod';
import { RequestType } from 'generated/prisma';
import { createZodDto } from 'nestjs-zod';

const MemberSchema = z.object({
  name: z.string(),
  document: z.string(),
  gender: z.string(),
});

const MemberDocumentSchema = z.object({
  document: z.string(),
});

const ReservationSchema = z.object({
  notes: z.string().optional(),
  experienceId: z.uuid(),
  startDate: z.iso.datetime(),
  endDate: z.iso.datetime(),
  members: z.array(MemberDocumentSchema),
});

export const CreateReservationGroupSchema = z.object({
  reservations: z.array(ReservationSchema),
  members: z.array(MemberSchema),
});

export class CreateReservationGroupDto extends createZodDto(CreateReservationGroupSchema) {}

const UpdateReservation = z.object({
  type: z.enum(Object.values(RequestType)),
  description: z.string().optional(),
});

export class UpdateReservationDto extends createZodDto(UpdateReservation) {}
