import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import type { PrismaClient } from 'generated/prisma';
import type { DatabaseService } from './database.service';

export type PrismaDeepMock = DeepMockProxy<PrismaClient>;

export const createDatabaseServiceMock = (): PrismaDeepMock & Partial<DatabaseService> => {
  const prisma = mockDeep<PrismaClient>();

  (prisma.$connect as any) = jest.fn();
  (prisma.$disconnect as any) = jest.fn();

  return prisma as unknown as PrismaDeepMock & Partial<DatabaseService>;
};
