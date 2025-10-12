/* eslint-disable @typescript-eslint/unbound-method */

import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserType } from 'generated/prisma';
import { UserService } from './user.service';
import { DatabaseService } from 'src/database/database.service';
import { ObfuscateService } from 'src/obfuscate/obfuscate.service';
import { UpdateUserFormDto, UserSearchParamsDto, CreateRootUserDto } from './user.model';

describe('UserService', () => {
  let service: UserService;
  let databaseService: jest.Mocked<DatabaseService>;
  let obfuscateService: jest.Mocked<ObfuscateService>;

  let fatalSpy: jest.SpiedFunction<typeof Logger.prototype.fatal>;

  beforeAll(() => {
    fatalSpy = jest.spyOn(Logger.prototype, 'fatal').mockImplementation(() => undefined);
  });

  afterAll(() => {
    fatalSpy.mockRestore();
  });

  beforeEach(async () => {
    const mockDatabaseService = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      address: {
        update: jest.fn(),
      },
    };

    const mockObfuscateService = {
      obfuscateField: jest.fn((value: string) => `obfuscated_${value}`),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: ObfuscateService, useValue: mockObfuscateService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    databaseService = module.get(DatabaseService);
    obfuscateService = module.get(ObfuscateService);

    jest.clearAllMocks();
  });

  describe('deleteUser', () => {
    const userId = '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7';

    it('should throw BadRequestException when userId is not a valid UUID', async () => {
      await expect(service.deleteUser('invalid-id')).rejects.toThrow(BadRequestException);
      await expect(service.deleteUser('invalid-id')).rejects.toThrow(
        'O `id` deve vir no formato `uuid`.',
      );
    });

    it('should throw NotFoundException when user does not exist', async () => {
      databaseService.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.deleteUser(userId)).rejects.toThrow(NotFoundException);
      await expect(service.deleteUser(userId)).rejects.toThrow('User not found');
    });

    it('should soft delete user by obfuscating fields and setting active to false', async () => {
      const mockUser = {
        email: 'user@example.com',
        document: '12345678900',
        rg: '1234567',
      };

      databaseService.user.findUnique.mockResolvedValueOnce(mockUser as never);
      databaseService.user.update.mockResolvedValueOnce({} as never);

      await service.deleteUser(userId);

      expect(databaseService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { email: true, document: true, rg: true },
      });

      expect(obfuscateService.obfuscateField).toHaveBeenCalledWith(mockUser.email);
      expect(obfuscateService.obfuscateField).toHaveBeenCalledWith(mockUser.document);
      expect(obfuscateService.obfuscateField).toHaveBeenCalledWith(mockUser.rg);

      expect(databaseService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          email: 'obfuscated_user@example.com',
          document: 'obfuscated_12345678900',
          rg: 'obfuscated_1234567',
          active: false,
        },
      });
    });

    it('should handle null document and rg fields', async () => {
      const mockUser = {
        email: 'user@example.com',
        document: null,
        rg: null,
      };

      databaseService.user.findUnique.mockResolvedValueOnce(mockUser as never);
      databaseService.user.update.mockResolvedValueOnce({} as never);

      await service.deleteUser(userId);

      expect(databaseService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          email: 'obfuscated_user@example.com',
          document: null,
          rg: null,
          active: false,
        },
      });
    });
  });

  describe('updateUser', () => {
    const userId = '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7';
    const addressId = '2c8c5c1b-2f78-52bg-0g1g-5b22g4f9b0g8';

    it('should throw BadRequestException when userId is not a valid UUID', async () => {
      const dto: UpdateUserFormDto = { name: 'John Doe' };

      await expect(service.updateUser('invalid-id', dto)).rejects.toThrow(BadRequestException);
    });

    it('should update ADMIN user without updating address', async () => {
      const dto: UpdateUserFormDto = {
        name: 'Admin User',
        email: 'admin@example.com',
        userType: UserType.GUEST,
      };

      const mockUser = {
        id: userId,
        userType: UserType.ADMIN,
        addressId: null,
      };

      databaseService.user.update.mockResolvedValueOnce(mockUser as never);

      await service.updateUser(userId, dto);

      expect(databaseService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          document: dto.document,
          gender: dto.gender,
          rg: dto.rg,
          userType: dto.userType,
          institution: dto.institution,
          isForeign: dto.isForeign,
        },
      });

      expect(databaseService.address.update).not.toHaveBeenCalled();
    });

    it('should update ROOT user without updating address', async () => {
      const dto: UpdateUserFormDto = {
        name: 'Root User',
        email: 'root@example.com',
      };

      const mockUser = {
        id: userId,
        userType: UserType.ROOT,
        addressId: null,
      };

      databaseService.user.update.mockResolvedValueOnce(mockUser as never);

      await service.updateUser(userId, dto);

      expect(databaseService.address.update).not.toHaveBeenCalled();
    });

    it('should log fatal error when GUEST user has no addressId', async () => {
      const dto: UpdateUserFormDto = {
        name: 'Guest User',
        zipCode: '12345-678',
      };

      const mockUser = {
        id: userId,
        userType: UserType.GUEST,
        addressId: null,
      };

      databaseService.user.update.mockResolvedValueOnce(mockUser as never);

      await service.updateUser(userId, dto);

      expect(fatalSpy).toHaveBeenCalledWith(
        `The common user (GEST or PROFESSOR) ${userId} must have an Address`,
      );
      expect(databaseService.address.update).not.toHaveBeenCalled();
    });

    it('should update GUEST user with address', async () => {
      const dto: UpdateUserFormDto = {
        name: 'Guest User',
        email: 'guest@example.com',
        zipCode: '12345-678',
        addressLine: 'Street Name',
        city: 'City',
        number: 123,
        country: 'Country',
      };

      const mockUser = {
        id: userId,
        userType: UserType.GUEST,
        addressId,
      };

      databaseService.user.update.mockResolvedValueOnce(mockUser as never);
      databaseService.address.update.mockResolvedValueOnce({} as never);

      await service.updateUser(userId, dto);

      expect(databaseService.user.update).toHaveBeenCalled();
      expect(databaseService.address.update).toHaveBeenCalledWith({
        where: { id: addressId },
        data: {
          zip: dto.zipCode,
          street: dto.addressLine,
          city: dto.city,
          number: '123',
          country: dto.country,
        },
      });
    });

    it('should update PROFESSOR user with address', async () => {
      const dto: UpdateUserFormDto = {
        name: 'Professor User',
        userType: UserType.PROFESSOR,
        zipCode: '98765-432',
      };

      const mockUser = {
        id: userId,
        userType: UserType.PROFESSOR,
        addressId,
      };

      databaseService.user.update.mockResolvedValueOnce(mockUser as never);
      databaseService.address.update.mockResolvedValueOnce({} as never);

      await service.updateUser(userId, dto);

      expect(databaseService.address.update).toHaveBeenCalledWith({
        where: { id: addressId },
        data: {
          zip: dto.zipCode,
          street: dto.addressLine,
          city: dto.city,
          number: undefined,
          country: dto.country,
        },
      });
    });
  });

  describe('searchUser', () => {
    it('should search users with default sorting (createdAt, asc)', async () => {
      const searchParams: UserSearchParamsDto = {
        page: 0,
        limit: 10,
        dir: 'asc',
        sort: 'createdAt',
      } as never;

      const mockUsers = [
        {
          id: '1',
          name: 'User 1',
          email: 'user1@example.com',
          createdBy: { id: '2', name: 'Creator' },
        },
      ];

      databaseService.user.findMany.mockResolvedValueOnce(mockUsers as never);
      databaseService.user.count.mockResolvedValueOnce(1);

      const result = await service.searchUser(searchParams);

      expect(result).toEqual({
        page: 0,
        limit: 10,
        total: 1,
        items: mockUsers,
      });

      expect(databaseService.user.findMany).toHaveBeenCalledWith({
        where: {
          name: { contains: undefined },
          email: { contains: undefined },
          createdBy: { name: { contains: undefined } },
          active: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'asc' },
        skip: 0,
        take: 10,
      });
    });

    it('should search users by name with pagination', async () => {
      const searchParams: UserSearchParamsDto = {
        page: 1,
        limit: 5,
        dir: 'desc',
        sort: 'name',
        name: 'John',
      } as never;

      databaseService.user.findMany.mockResolvedValueOnce([] as never);
      databaseService.user.count.mockResolvedValueOnce(15);

      const result = await service.searchUser(searchParams);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(5);
      expect(result.total).toBe(15);

      expect(databaseService.user.findMany).toHaveBeenCalledWith({
        where: {
          name: { contains: 'John' },
          email: { contains: undefined },
          createdBy: { name: { contains: undefined } },
          active: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { name: 'desc' },
        skip: 5,
        take: 5,
      });
    });

    it('should search users sorting by createdBy name', async () => {
      const searchParams: UserSearchParamsDto = {
        page: 0,
        limit: 10,
        dir: 'asc',
        sort: 'createdBy',
        createdBy: 'Admin',
      } as never;

      databaseService.user.findMany.mockResolvedValueOnce([] as never);
      databaseService.user.count.mockResolvedValueOnce(0);

      await service.searchUser(searchParams);

      expect(databaseService.user.findMany).toHaveBeenCalledWith({
        where: {
          name: { contains: undefined },
          email: { contains: undefined },
          createdBy: { name: { contains: 'Admin' } },
          active: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdBy: { name: 'asc' } },
        skip: 0,
        take: 10,
      });
    });

    it('should search users with multiple filters', async () => {
      const searchParams: UserSearchParamsDto = {
        page: 0,
        limit: 20,
        dir: 'desc',
        sort: 'email',
        name: 'John',
        email: 'john@',
        createdBy: 'Admin',
      } as never;

      databaseService.user.findMany.mockResolvedValueOnce([] as never);
      databaseService.user.count.mockResolvedValueOnce(3);

      await service.searchUser(searchParams);

      expect(databaseService.user.findMany).toHaveBeenCalledWith({
        where: {
          name: { contains: 'John' },
          email: { contains: 'john@' },
          createdBy: { name: { contains: 'Admin' } },
          active: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { email: 'desc' },
        skip: 0,
        take: 20,
      });
    });
  });

  describe('getUser', () => {
    const userId = '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7';

    it('should throw NotFoundException when user does not exist', async () => {
      databaseService.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.getUser(userId)).rejects.toThrow(NotFoundException);
      await expect(service.getUser(userId)).rejects.toThrow('User not found');

      expect(databaseService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId, active: true },
        select: {
          name: true,
          email: true,
          phone: true,
          document: true,
          rg: true,
          gender: true,
          userType: true,
          institution: true,
          isForeign: true,
          address: {
            select: {
              zip: true,
              city: true,
              country: true,
              street: true,
              number: true,
            },
          },
        },
      });
    });

    it('should return user without address', async () => {
      const mockUser = {
        name: 'Admin User',
        email: 'admin@example.com',
        phone: '123456789',
        document: '12345678900',
        rg: '1234567',
        gender: 'M',
        userType: UserType.ADMIN,
        institution: null,
        isForeign: false,
        address: null,
      };

      databaseService.user.findUnique.mockResolvedValueOnce(mockUser as never);

      const result = await service.getUser(userId);

      expect(result).toEqual({
        name: mockUser.name,
        email: mockUser.email,
        phone: mockUser.phone,
        document: mockUser.document,
        rg: mockUser.rg,
        gender: mockUser.gender,
        zipCode: undefined,
        userType: mockUser.userType,
        city: undefined,
        country: undefined,
        addressLine: undefined,
        number: null,
        institution: mockUser.institution,
        isForeign: mockUser.isForeign,
      });
    });

    it('should return user with address', async () => {
      const mockUser = {
        name: 'Guest User',
        email: 'guest@example.com',
        phone: '987654321',
        document: '98765432100',
        rg: null,
        gender: 'F',
        userType: UserType.GUEST,
        institution: 'University',
        isForeign: true,
        address: {
          zip: '12345-678',
          city: 'City Name',
          country: 'Country',
          street: 'Street Name',
          number: '123',
        },
      };

      databaseService.user.findUnique.mockResolvedValueOnce(mockUser as never);

      const result = await service.getUser(userId);

      expect(result).toEqual({
        name: mockUser.name,
        email: mockUser.email,
        phone: mockUser.phone,
        document: mockUser.document,
        rg: mockUser.rg,
        gender: mockUser.gender,
        zipCode: mockUser.address.zip,
        userType: mockUser.userType,
        city: mockUser.address.city,
        country: mockUser.address.country,
        addressLine: mockUser.address.street,
        number: 123,
        institution: mockUser.institution,
        isForeign: mockUser.isForeign,
      });
    });

    it('should parse address number correctly when null', async () => {
      const mockUser = {
        name: 'User',
        email: 'user@example.com',
        phone: '111111111',
        document: null,
        rg: null,
        gender: 'M',
        userType: UserType.PROFESSOR,
        institution: null,
        isForeign: false,
        address: {
          zip: '00000-000',
          city: 'City',
          country: 'Country',
          street: 'Street',
          number: null,
        },
      };

      databaseService.user.findUnique.mockResolvedValueOnce(mockUser as never);

      const result = await service.getUser(userId);

      expect(result.number).toBeNull();
    });
  });

  describe('createRootUser', () => {
    const creatorUserId = '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7';

    it('should throw BadRequestException when passwords do not match', async () => {
      const dto: CreateRootUserDto = {
        name: 'Root User',
        email: 'root@example.com',
        password: 'password123',
        confirmPassword: 'different_password',
        phone: '123456789',
        gender: 'M',
        document: '12345678900',
        rg: '1234567',
        country: 'Country',
        userType: UserType.ADMIN,
        institution: null,
        isForeign: false,
        addressLine: null,
        city: null,
        zipCode: '00000-000',
        number: null,
      } as never;

      await expect(service.createRootUser(creatorUserId, dto)).rejects.toThrow(BadRequestException);
      await expect(service.createRootUser(creatorUserId, dto)).rejects.toThrow(
        'As senhas não são identicas.',
      );

      expect(databaseService.user.create).not.toHaveBeenCalled();
    });

    it('should create root user with matching passwords', async () => {
      const dto: CreateRootUserDto = {
        name: 'Root User',
        email: 'root@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        phone: '123456789',
        gender: 'M',
        document: '12345678900',
        rg: '1234567',
        country: 'Brazil',
        userType: UserType.ADMIN,
        institution: 'Institution',
        isForeign: false,
        addressLine: 'Street',
        city: 'City',
        zipCode: '12345-678',
        number: 123,
      } as never;

      databaseService.user.create.mockResolvedValueOnce({} as never);

      await service.createRootUser(creatorUserId, dto);

      expect(databaseService.user.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          email: dto.email,
          password: dto.password,
          phone: dto.phone,
          document: dto.document,
          gender: dto.gender,
          userType: UserType.ADMIN,
          isForeign: false,
          verified: true,
          createdByUserId: creatorUserId,
        },
      });
    });

    it('should create root user without optional fields', async () => {
      const dto: CreateRootUserDto = {
        name: 'Root User',
        email: 'root@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        phone: '123456789',
        gender: 'F',
        country: 'Brazil',
        userType: UserType.ADMIN,
        isForeign: false,
        zipCode: '00000-000',
      } as never;

      databaseService.user.create.mockResolvedValueOnce({} as never);

      await service.createRootUser(creatorUserId, dto);

      expect(databaseService.user.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          email: dto.email,
          password: dto.password,
          phone: dto.phone,
          document: undefined,
          gender: dto.gender,
          userType: UserType.ADMIN,
          isForeign: false,
          verified: true,
          createdByUserId: creatorUserId,
        },
      });
    });
  });
});
