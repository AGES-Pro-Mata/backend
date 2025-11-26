/* eslint-disable @typescript-eslint/unbound-method */

import { UpdateUserFormSchema, UserSearchParamsSchema } from './user.model';
import { UserType } from 'generated/prisma';

describe('User model Zod schemas', () => {
  describe('UpdateUserFormSchema', () => {
    it('should parse full data and convert number and isForeign correctly', () => {
      const result = UpdateUserFormSchema.parse({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123456789',
        document: '12345678900',
        rg: '1234567',
        gender: 'Masculino',
        zipCode: '12345-678',
        userType: UserType.ADMIN,
        city: 'Porto Alegre',
        country: 'BR',
        addressLine: 'Main St',
        number: '10',
        institution: 'PUCRS',
        isForeign: 'true',
      } as any);

      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
      expect(result.userType).toBe(UserType.ADMIN);
      expect(result.number).toBe(10);
      expect(result.isForeign).toBe(true);
    });

    it('should handle null number and nullable fields correctly', () => {
      const result = UpdateUserFormSchema.parse({
        document: null,
        rg: null,
        number: null,
        isForeign: 'false',
      } as any);

      expect(result.document).toBeNull();
      expect(result.rg).toBeNull();
      expect(result.number).toBeNull();
      expect(result.isForeign).toBe(false);
    });
  });

  describe('UserSearchParamsSchema', () => {
    it('should default dir to asc and sort to createdAt when omitted', () => {
      const result = UserSearchParamsSchema.parse({
        page: '0',
        limit: '10',
      } as any);

      expect(result.page).toBe(0);
      expect(result.limit).toBe(10);
      expect(result.dir).toBe('asc');
      expect(result.sort).toBe('createdAt');
    });

    it('should keep provided dir and sort', () => {
      const result = UserSearchParamsSchema.parse({
        page: '1',
        limit: '5',
        dir: 'desc',
        sort: 'email',
        name: 'John',
        email: 'john@example.com',
        createdBy: 'Admin',
      } as any);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(5);
      expect(result.dir).toBe('desc');
      expect(result.sort).toBe('email');
      expect(result.name).toBe('John');
      expect(result.email).toBe('john@example.com');
      expect(result.createdBy).toBe('Admin');
    });
  });
});
