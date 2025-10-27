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
  member: MemberSchema,
  request: TypeSchema,
});

export class RequestAdminDto extends createZodDto(RequestAdminDtoSchema) {}

// Query params para filtro e paginação
export const GetRequestsQueryDto = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z
    .array(z.nativeEnum(RequestType)) 
    .or(z.nativeEnum(RequestType).transform(v => [v]))
    .optional(),
  sort: z.string().optional(),
  dir: z.enum(['asc', 'desc']).optional(),
});

export type GetRequestsQueryDto = z.infer<typeof GetRequestsQueryDto>;

// Response com paginação
export const PaginatedRequestResponseSchema = z.object({
  data: z.array(RequestAdminDtoSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export class PaginatedRequestResponseDto extends createZodDto(PaginatedRequestResponseSchema) {}