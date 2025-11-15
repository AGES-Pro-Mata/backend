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

const ReservationGroupStatusFilter = z.object({
  status: z.enum([RequestType.APPROVED, RequestType.CANCELED, 'PENDING', 'ALL']).default('ALL'),
});

export class ReservationGroupStatusFilterDto extends createZodDto(ReservationGroupStatusFilter) {}

const RegisterMemberSchema = z.object({
  name: z.string(),
  phone: z.string(),
  document: z.string(),
  gender: z.string(),
});

export class RegisterMemberDto extends createZodDto(RegisterMemberSchema) {}

export const ReservationSearchParamsSchema = z.object({
  page: z.string().transform((val) => parseInt(val, 10)),
  limit: z.string().transform((val) => parseInt(val, 10)),
  dir: z
    .enum(['asc', 'desc'])
    .optional()
    .transform((val) => val ?? 'asc'),
  sort: z.enum(['email', 'status']).optional(),
  experiences: z.string().optional(),
  email: z.string().optional(),
  status: z.enum(Object.values(RequestType)).optional(),
});

export class ReservationSearchParamsDto extends createZodDto(ReservationSearchParamsSchema) {}
