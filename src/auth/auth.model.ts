import { UserType } from 'generated/prisma';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UserPayloadSchema = z.object({
  sub: z.uuid(),
});

export type UserPayload = z.infer<typeof UserPayloadSchema>;

export type CurrentUser = {
  id: string;
  userType: UserType;
};

export const CreateUserFormSchema = z.object({
  name: z.string(),
  email: z.email(),
  phone: z.string(),
  document: z.string().optional(),
  rg: z.string().optional(),
  gender: z.string(),
  zipCode: z.string(),
  userType: z.enum([UserType.GUEST, UserType.PROFESSOR]),
  city: z.string().optional(),
  country: z.string(),
  addressLine: z.string().optional(),
  number: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : null)),
  password: z.hash('sha256'),
  confirmPassword: z.hash('sha256'),
  institution: z.string().optional(),
  isForeign: z.string().transform((val) => val === 'true'),
});

export class CreateUserFormDto extends createZodDto(CreateUserFormSchema) {}

export const CreateRootUserSchema = z.object({
  name: z.string(),
  email: z.email(),
  password: z.hash('sha256'),
  confirmPassword: z.hash('sha256'),
  phone: z.string(),
  gender: z.string(),
  document: z.string().optional(),
  rg: z.string().optional(),
  country: z.string(),
  userType: z.enum(Object.values(UserType)),
  institution: z.string().optional(),
  isForeign: z.boolean(),
  addressLine: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string(),
  number: z.number().optional(),
});

export class CreateRootUserDto extends createZodDto(CreateRootUserSchema) {}

export const LoginSchema = z.object({
  email: z.email(),
  password: z.hash('sha256'),
});

export class LoginDto extends createZodDto(LoginSchema) {}

export const ForgotPasswordSchema = z.object({
  email: z.email(),
});

export class ForgotPasswordDto extends createZodDto(ForgotPasswordSchema) {}

export const ChangePasswordSchema = z.object({
  token: z.string().length(40),
  password: z.hash('sha256'),
  confirmPassword: z.hash('sha256'),
});

export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) {}

export const GetRequestsSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum([
    "CREATED",
    "CANCELED",
    "CANCELED_REQUESTED",
    "EDITED",
    "REJECTED",
    "APPROVED",
    "PEOPLE_REQUESTED",
    "PAYMENT_REQUESTED",
    "PEOPLE_SENT",
    "PAYMENT_SENT",
  ]).optional(),
});

export class GetRequestsDto extends createZodDto(GetRequestsSchema) {}