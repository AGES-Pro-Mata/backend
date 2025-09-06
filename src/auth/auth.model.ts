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

export const CreateUserFormSchema = z
  .object({
    name: z.string(),
    email: z.email(),
    phone: z.string(),
    cpf: z.string().nullable(),
    rg: z.string().nullable(),
    gender: z.string(),
    zipCode: z.string(),
    city: z.string(),
    address: z.string(),
    number: z.number(),
    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
    institution: z.string(),  
    isForeign: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export class CreateUserFormDto extends createZodDto(CreateUserFormSchema) {}

export const ForgotPasswordSchema = z.object({
  email: z.email(),
});

export class ForgotPasswordDto extends createZodDto(ForgotPasswordSchema) {}

export const ChangePasswordSchema = z
  .object({
    token: z.string().length(40),
    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) {}
