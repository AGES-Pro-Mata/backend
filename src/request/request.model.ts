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
export const GetRequestsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z
    .preprocess((val) => {
      // Normaliza: string → [string], array → array, undefined → undefined
      if (typeof val === "string") return [val];
      if (Array.isArray(val)) return val;
      return undefined;
    }, z.array(z.nativeEnum(RequestType)).optional()),
});

export class GetRequestsQueryDto extends createZodDto(GetRequestsQuerySchema) {}

// Response com paginação
export const PaginatedRequestResponseSchema = z.object({
  data: z.array(RequestAdminDtoSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export class PaginatedRequestResponseDto extends createZodDto(PaginatedRequestResponseSchema) {}