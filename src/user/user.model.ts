import { UserType } from 'generated/prisma';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const UpdateUserFormSchema = z.object({
  name: z.string().optional(),
  email: z.email().optional(),
  phone: z.string().optional(),
  cpf: z.string().nullable().optional(),
  rg: z.string().nullable().optional(),
  gender: z.string().optional(),
  zipCode: z.string().optional(),
  userType: z.enum([UserType.GUEST, UserType.PROFESSOR]).optional(),
  city: z.string().nullable().optional(),
  country: z.string().optional(),
  addressLine: z.string().nullable().optional(),
  number: z
    .string()
    .nullable()
    .transform((val) => (val ? parseInt(val, 10) : null))
    .optional(),
  institution: z.string().nullable().optional(),
  isForeign: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
});

export class UpdateUserFormDto extends createZodDto(UpdateUserFormSchema) {}

export const SearchParamsSchema = z.object({
  page: z.string().transform((val) => parseInt(val, 10)),
  limit: z.string().transform((val) => parseInt(val, 10)),
  dir: z.enum(['asc', 'desc']),
  sort: z.enum(['name', 'email', 'createdBy']),
  name: z.string().optional(),
  email: z.email().optional(),
});

export class SearchParamsDto extends createZodDto(SearchParamsSchema) {}
