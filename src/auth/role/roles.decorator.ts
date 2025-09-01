import { SetMetadata } from '@nestjs/common';
import { UserType } from 'generated/prisma';

export const Roles = (...args: UserType[]) => SetMetadata('roles', args);
