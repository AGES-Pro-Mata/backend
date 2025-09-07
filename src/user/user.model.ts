import { UserType } from 'generated/prisma';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const UpdateUserFormSchema = z.object({
  name: z.string().optional(),
  email: z.email().optional(),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  gender: z.string().optional(),
  zipCode: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  number: z.number().optional(),
  institution: z.string().optional(),
  isForeign: z.boolean().optional(),
  userType: z.enum(Object.values(UserType)).optional(),
});

export class UpdateUserFormDto extends createZodDto(UpdateUserFormSchema) {}

export const SearchParamsSchema = z.object({
  page: z.number(),
  limit: z.number(),
  dir: z.enum(['ASC', 'DESC']),
  sort: z.enum(['name', 'email', 'cratedBy']),
  name: z.string(),
  email: z.email(),
  createdBy: z.uuid(),
});

export class SearchParamsDto extends createZodDto(SearchParamsSchema) {}
