import { z } from 'zod';
import { RequestType } from 'generated/prisma';
import { createZodDto } from 'nestjs-zod';

const Id = z.string();
const Email = z.string().email();
const Name = z.string();

const AddressSchema = z.object({
  street: z.string().nullable().optional(),
  number: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  zip: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
});

const SimpleMemberSchema = z.object({
  id: Id,
  name: Name,
  document: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
});

const ExperienceImageSchema = z
  .object({
    url: z.string().nullable(),
  })
  .nullable();

const ExperienceSchema = z.object({
  id: Id,
  name: Name,
  startDate: z.string(),
  endDate: z.string(),
  price: z.number(),
  capacity: z.number(),
  trailLength: z.number().nullable(),
  durationMinutes: z.number(),
  image: ExperienceImageSchema,
});

const ReservationSchema = z.object({
  membersCount: z.number(),
  notes: z.string().nullable(),
  experience: ExperienceSchema,
});

const RequestStatusSchema = z.object({
  id: Id,
  type: z.nativeEnum(RequestType),
  description: z.string().nullable().optional(),
});

const MemberSimpleForAdmin = z.object({
  name: Name,
  email: Email,
});

const TypeSchema = z.object({
  type: z.nativeEnum(RequestType),
});

export const RequestAdminDtoSchema = z.object({
  id: Id,
  member: MemberSimpleForAdmin,
  request: TypeSchema,
});
export class RequestAdminDto extends createZodDto(RequestAdminDtoSchema) {}

export const GetRequestsQueryDtoSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z
    .array(z.nativeEnum(RequestType))
    .or(z.nativeEnum(RequestType).transform((v) => [v]))
    .optional(),
  sort: z.string().optional(),
  dir: z.enum(['asc', 'desc']).optional(),
});
export class GetRequestsQueryDto extends createZodDto(GetRequestsQueryDtoSchema) {}

export const GetRequestsProfessorQueryDtoSchema = GetRequestsQueryDtoSchema.extend({
  status: z
    .array(z.enum(['CREATED', 'APPROVED', 'REJECTED']))
    .or(z.enum(['CREATED', 'APPROVED', 'REJECTED']).transform((v) => [v]))
    .optional(),
});
export class GetRequestsProfessorQueryDto extends createZodDto(
  GetRequestsProfessorQueryDtoSchema,
) {}

export const PaginatedRequestResponseSchema = z.object({
  data: z.array(RequestAdminDtoSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});
export class PaginatedRequestResponseDto extends createZodDto(PaginatedRequestResponseSchema) {}

export const GetRequestByIdAdminDtoSchema = z.object({
  id: Id,
  type: z.string(),
  description: z.string().nullable().optional(),
  user: z
    .object({
      id: Id,
      name: Name,
      email: Email,
      phone: z.string().nullable().optional(),
    })
    .nullable(),
  members: z.array(SimpleMemberSchema),
  reservations: z.array(ReservationSchema),
  requests: z.array(RequestStatusSchema).optional(),
});
export class GetRequestByIdAdminDto extends createZodDto(GetRequestByIdAdminDtoSchema) {}

const ProfessorDetailsSchema = z.object({
  id: Id,
  name: Name,
  email: Email,
  phone: z.string().nullable().optional(),
  document: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  rg: z.string().nullable().optional(),
  institution: z.string().nullable().optional(),
  isForeign: z.boolean().optional(),
  verified: z.boolean().optional(),
  address: AddressSchema.nullable().optional(),
});

export const GetProfessorRequestByIdDtoSchema = z.object({
  id: Id,
  type: z.nativeEnum(RequestType),
  description: z.string().nullable().optional(),
  createdAt: z.string(),
  user: ProfessorDetailsSchema,
  requests: z.array(RequestStatusSchema).optional(),
});
export class GetProfessorRequestByIdDto extends createZodDto(GetProfessorRequestByIdDtoSchema) {}
