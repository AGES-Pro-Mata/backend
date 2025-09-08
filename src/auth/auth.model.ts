import { UserType } from 'generated/prisma';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UserPayloadSchema = z.object({
  sub: z.uuid(),
  userType: z.enum(Object.values(UserType)),
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
  cpf: z.string().nullable(),
  rg: z.string().nullable(),
  gender: z.string(),
  zipCode: z.string(),
  userType: z.enum([UserType.GUEST, UserType.PROFESSOR]),
  city: z.string().nullable(),
  country: z.string(),
  addressLine: z.string().nullable(),
  number: z
    .string()
    .nullable()
    .transform((val) => (val ? parseInt(val, 10) : null)),
  password: z.hash('sha256'),
  confirmPassword: z.hash('sha256'),
  institution: z.string().nullable(),
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
  cpf: z.string().nullable(),
  rg: z.string().nullable(),
  country: z.string(),
  userType: z.enum(Object.values(UserType)),
  institution: z.string().nullable(),
  isForeign: z.boolean(),
  addressLine: z.string().nullable(),
  city: z.string().nullable(),
  zipCode: z.string(),
  number: z.number().nullable(),
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
