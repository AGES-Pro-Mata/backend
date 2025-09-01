import { UserType } from 'generated/prisma';

export const ROLE_MAP: Record<UserType, Set<UserType>> = {
  [UserType.GUEST]: new Set([UserType.GUEST]),
  [UserType.PROFESSOR]: new Set([UserType.GUEST, UserType.PROFESSOR]),
  [UserType.ADMIN]: new Set([UserType.ADMIN]),
  [UserType.ROOT]: new Set([UserType.ADMIN, UserType.ROOT]),
};
