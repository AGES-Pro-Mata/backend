import { SetMetadata } from '@nestjs/common';

// TODO: Replace with the Prisma `User.Role` type once it's available.
export enum Role {
  User,
  Professor,
  Admin,
  Root,
}

export const Roles = (...args: Role[]) => SetMetadata('roles', args);
