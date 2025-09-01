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
  city: z.string(),
  address: z.string(),
  number: z.number(),
  password: z.hash('sha256'),
  confirmPassword: z.hash('sha256'),
  institution: z.string(),
  isForeign: z.boolean(),
});

export class CreateUserFormDto extends createZodDto(CreateUserFormSchema) {}
