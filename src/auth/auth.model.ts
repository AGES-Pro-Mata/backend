import { UserType } from 'generated/prisma';
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
