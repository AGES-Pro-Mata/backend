import { UserType } from 'generated/prisma';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export const UpdateUserFormSchema = z.object({
  name: z.string().optional(),
  email: z.email().optional(),
  phone: z.string().optional(),
  document: z.string().nullable().optional(),
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

export const UserSearchParamsSchema = z.object({
  page: z.string().transform((val) => parseInt(val, 10)),
  limit: z.string().transform((val) => parseInt(val, 10)),
  dir: z
    .enum(['asc', 'desc'])
    .optional()
    .transform((val) => val ?? 'asc'),
  sort: z
    .enum(['name', 'email', 'createdBy'])
    .optional()
    .transform((val) => val ?? 'createdAt'),
  name: z.string().optional(),
  email: z.string().optional(),
});

export class UserSearchParamsDto extends createZodDto(UserSearchParamsSchema) {}
