import { SetMetadata } from '@nestjs/common';

// TODO: Remove this when the `Role` enum on Prisma
export enum Role {
  User,
  Professor,
  Admin,
  Root,
}

export const Roles = (...args: Role[]) => SetMetadata('roles', args);
