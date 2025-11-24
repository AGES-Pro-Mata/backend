import { RequestType } from 'generated/prisma';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const PROFESSOR_REQUEST_TYPES: RequestType[] = [
  RequestType.DOCUMENT_REQUESTED,
  RequestType.DOCUMENT_APPROVED,
  RequestType.DOCUMENT_REJECTED,
] as const;

export const ProfessorRequestSearchParamsSchema = z.object({
  page: z.string().transform((val) => parseInt(val, 10)),
  limit: z.string().transform((val) => parseInt(val, 10)),
  name: z.string().optional(),
  email: z.string().optional(),
  status: z
    .array(z.enum(PROFESSOR_REQUEST_TYPES))
    .or(z.enum(PROFESSOR_REQUEST_TYPES).transform((v) => [v]))
    .optional(),
});

export class ProfessorRequestSearchParamsDto extends createZodDto(
  ProfessorRequestSearchParamsSchema,
) {}
