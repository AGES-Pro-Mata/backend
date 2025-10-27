import { z } from 'zod';
import { RequestType } from 'generated/prisma';
import { createZodDto } from 'nestjs-zod';

const MemberSchema = z.object({
  name: z.string(),
  document: z.string(),
  gender: z.string(),
});

const ReservationSchema = z.object({
  notes: z.string().optional(),
  experienceId: z.uuid(),
  startDate: z.iso.datetime(),
  endDate: z.iso.datetime(),
  membersCount: z.number(),
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

const UpdateReservationByAdmin = z.object({
  type: z.enum(Object.values(RequestType)),
  description: z.string().optional(),
  experienceId: z.string().optional(),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
  notes: z.string().optional(),
});

export class UpdateReservationByAdminDto extends createZodDto(UpdateReservationByAdmin) {}

export const AttachReceiptSchema = z.object({
  url: z.url(),
});

export class AttachReceiptDto extends createZodDto(AttachReceiptSchema) {}
