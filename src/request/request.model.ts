import { z } from 'zod';
import { RequestType } from 'generated/prisma';
import { createZodDto } from 'nestjs-zod';

const MemberSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

const TypeSchema = z.object({
  type: z.nativeEnum(RequestType),
});

export const RequestAdminDtoSchema = z.object({
  id: z.string(),
  member: MemberSchema,
  request: TypeSchema,
});

export class RequestAdminDto extends createZodDto(RequestAdminDtoSchema) {}

const RequestStatusSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(RequestType),
  description: z.string().nullable().optional(),
});

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

export const GetRequestsProfessorQueryDtoSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z
    .array(z.enum(['CREATED', 'APPROVED', 'REJECTED']))
    .or(z.enum(['CREATED', 'APPROVED', 'REJECTED']).transform((v) => [v]))
    .optional(),
  sort: z.string().optional(),
  dir: z.enum(['asc', 'desc']).optional(),
});

export class GetRequestsProfessorQueryDto extends createZodDto(
  GetRequestsProfessorQueryDtoSchema
) {}

export const PaginatedRequestResponseSchema = z.object({
  data: z.array(RequestAdminDtoSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export class PaginatedRequestResponseDto extends createZodDto(
  PaginatedRequestResponseSchema
) {}

export const GetRequestByIdAdminDtoSchema = z.object({
  id: z.string(),
  type: z.string(),
  description: z.string().nullable().optional(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    phone: z.string().nullable().optional(),
  }),
  members: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      document: z.string().nullable(),
      gender: z.string().nullable(),
      phone: z.string().nullable(),
      birthDate: z.string().nullable(),
    })
  ),
  reservations: z.array(
    z.object({
      membersCount: z.number(),
      notes: z.string().nullable(),
      experience: z.object({
        id: z.string(),
        name: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        price: z.number(),
        capacity: z.number(),
        trailLength: z.number().nullable(),
        durationMinutes: z.number(),
        image: z
          .object({
            url: z.string().nullable(),
          })
          .nullable(),
      }),
    })
  ),
  requests: z.array(RequestStatusSchema).optional(),
});

export class GetRequestByIdAdminDto extends createZodDto(
  GetRequestByIdAdminDtoSchema
) {}
