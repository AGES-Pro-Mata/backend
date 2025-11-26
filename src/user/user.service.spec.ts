/* eslint-disable @typescript-eslint/unbound-method */

import { BadRequestException, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { DatabaseService } from '../database/database.service';
import { ObfuscateService } from '../obfuscate/obfuscate.service';
import { StorageService } from '../storage/storage.service';
import { RequestType, UserType } from 'generated/prisma';
import { UpdateUserFormDto, UserSearchParamsDto } from './user.model';

describe('UserService', () => {
  let service: UserService;
  let databaseService: any;
  let obfuscateService: any;
  let storageService: any;

  beforeEach(async () => {
    const mockDatabaseService = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      address: {
        update: jest.fn(),
      },
      requests: {
        create: jest.fn(),
      },
    };

    const mockObfuscateService = {
      obfuscateField: jest.fn((value: string) => `obf-${value}`),
    };

    const mockStorageService = {
      uploadFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: ObfuscateService, useValue: mockObfuscateService },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    databaseService = module.get(DatabaseService);
    obfuscateService = module.get(ObfuscateService);
    storageService = module.get(StorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('deleteUser', () => {
    const validUserId = '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7';

    it('should throw BadRequestException when userId is not a valid uuid', async () => {
      await expect(service.deleteUser('invalid-id', 'other-id')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.deleteUser('invalid-id', 'other-id')).rejects.toThrow(
        'O `id` deve vir no formato `uuid`.',
      );

      expect(databaseService.user.findUnique).not.toHaveBeenCalled();
    });

    it('should forbid user from deleting themselves', async () => {
      await expect(service.deleteUser(validUserId, validUserId)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.deleteUser(validUserId, validUserId)).rejects.toThrow(
        'Users cannot delete themselves.',
      );

      expect(databaseService.user.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      databaseService.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.deleteUser(validUserId, 'deleter-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.deleteUser(validUserId, 'deleter-id')).rejects.toThrow('User not found');
    });

    it('should forbid deletion of ROOT user', async () => {
      databaseService.user.findUnique.mockResolvedValueOnce({
        userType: UserType.ROOT,
      } as never);

      const deletePromise = service.deleteUser(validUserId, 'deleter-id');

      await expect(deletePromise).rejects.toThrow(ForbiddenException);
      await expect(deletePromise).rejects.toThrow('Root user cannot be deleted.');
    });

    it('should obfuscate sensitive fields and deactivate user when deletion is allowed', async () => {
      const user = {
        email: 'user@example.com',
        document: '12345678900',
        rg: '1234567',
        userType: UserType.ADMIN,
      } as never;

      databaseService.user.findUnique.mockResolvedValueOnce(user);

      await service.deleteUser(validUserId, 'deleter-id');

      expect(obfuscateService.obfuscateField).toHaveBeenCalledTimes(3);
      expect(obfuscateService.obfuscateField).toHaveBeenCalledWith(user.email);
      expect(obfuscateService.obfuscateField).toHaveBeenCalledWith(user.document);
      expect(obfuscateService.obfuscateField).toHaveBeenCalledWith(user.rg);

      expect(databaseService.user.update).toHaveBeenCalledWith({
        where: { id: validUserId },
        data: {
          email: `obf-${user.email}`,
          document: `obf-${user.document}`,
          rg: `obf-${user.rg}`,
          active: false,
        },
      });
    });
  });

  describe('updateUser', () => {
    const userId = '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7';

    const createUpdateDto = (): UpdateUserFormDto => ({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123456789',
      document: '12345678900',
      gender: 'MALE' as never,
      rg: '1234567',
      userType: UserType.NORMAL as never,
      institution: 'PUCRS',
      isForeign: false,
      zipCode: '12345-678',
      addressLine: 'Main St',
      city: 'Porto Alegre',
      number: 100,
      country: 'BR',
    });

    it('should update user and address without file and not create request', async () => {
      const dto = createUpdateDto();

      databaseService.user.update.mockResolvedValueOnce({
        id: userId,
        userType: UserType.NORMAL,
        addressId: 'address-1',
      } as never);

      await service.updateUser(userId, dto, null);

      expect(storageService.uploadFile).not.toHaveBeenCalled();
      expect(databaseService.user.update).toHaveBeenCalledWith({
        where: { id: userId, userType: { not: UserType.ROOT } },
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
          verified: undefined,
        },
      });

      expect(databaseService.address.update).toHaveBeenCalledWith({
        where: { id: 'address-1' },
        data: {
          zip: dto.zipCode,
          street: dto.addressLine,
          city: dto.city,
          number: dto.number.toString(),
          country: dto.country,
        },
      });

      expect(databaseService.requests.create).not.toHaveBeenCalled();
    });

    it('should upload file, create document request and set verified to false', async () => {
      const dto = createUpdateDto();
      const file = {
        mimetype: 'image/jpeg',
      } as Express.Multer.File;

      const uploadedUrl = 'https://s3.example.com/user/avatar.jpg';

      storageService.uploadFile.mockResolvedValueOnce({ url: uploadedUrl });
      databaseService.user.update.mockResolvedValueOnce({
        id: userId,
        userType: UserType.NORMAL,
        addressId: 'address-1',
      } as never);

      await service.updateUser(userId, dto, file);

      expect(storageService.uploadFile).toHaveBeenCalledWith(file, {
        directory: 'user',
        contentType: file.mimetype,
        cacheControl: 'public, max-age=31536000',
      });

      expect(databaseService.requests.create).toHaveBeenCalledWith({
        data: {
          type: RequestType.DOCUMENT_REQUESTED,
          fileUrl: uploadedUrl,
          professorId: userId,
          createdByUserId: userId,
        },
      });

      expect(databaseService.user.update).toHaveBeenCalledWith({
        where: { id: userId, userType: { not: UserType.ROOT } },
        data: expect.objectContaining({
          verified: false,
        }),
      });
    });

    it('should log fatal when updated user has no address', async () => {
      const dto = createUpdateDto();

      const logger = (service as any).logger as Logger;
      // @ts-expect-error Logger typings may not include fatal, but it exists/used at runtime
      logger.fatal = jest.fn();

      databaseService.user.update.mockResolvedValueOnce({
        id: userId,
        userType: UserType.NORMAL,
        addressId: null,
      } as never);

      await service.updateUser(userId, dto, null);

      expect((logger as any).fatal).toHaveBeenCalled();
    });
  });

  describe('searchUser', () => {
    it('should search users with filters and createdBy sort', async () => {
      const searchParams: UserSearchParamsDto = {
        page: 0,
        limit: 10,
        sort: 'createdBy',
        dir: 'asc',
        name: 'John',
        email: '@example.com',
        createdBy: 'Admin',
      } as never;

      const users = [
        {
          id: 'user-1',
          name: 'John',
          email: 'john@example.com',
          createdBy: { id: 'admin-1', name: 'Admin' },
        },
      ];

      databaseService.user.findMany.mockResolvedValueOnce(users as never);
      databaseService.user.count.mockResolvedValueOnce(1);

      const result = await service.searchUser(searchParams);

      expect(result).toEqual({
        page: 0,
        limit: 10,
        total: 1,
        items: users,
      });

      expect(databaseService.user.findMany).toHaveBeenCalledWith({
        where: {
          name: { contains: 'John' },
          email: { contains: '@example.com' },
          createdBy: {
            name: {
              contains: 'Admin',
            },
          },
          active: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdBy: { name: 'asc' } },
        skip: 0,
        take: 10,
      });

      expect(databaseService.user.count).toHaveBeenCalledWith({
        where: {
          name: { contains: 'John' },
          email: { contains: '@example.com' },
          createdBy: {
            name: {
              contains: 'Admin',
            },
          },
          active: true,
        },
      });
    });

    it('should search users without createdBy filter', async () => {
      const searchParams: UserSearchParamsDto = {
        page: 1,
        limit: 5,
        sort: 'email',
        dir: 'desc',
      } as never;

      databaseService.user.findMany.mockResolvedValueOnce([]);
      databaseService.user.count.mockResolvedValueOnce(0);

      await service.searchUser(searchParams);

      expect(databaseService.user.findMany).toHaveBeenCalledWith({
        where: {
          name: { contains: undefined },
          email: { contains: undefined },
          createdBy: undefined,
          active: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { email: 'desc' },
        skip: 5,
        take: 5,
      });
    });
  });

  describe('getUser', () => {
    const userId = 'user-1';

    it('should return mapped user data when user exists', async () => {
      const dbUser = {
        name: 'John',
        email: 'john@example.com',
        phone: '123456789',
        document: '12345678900',
        rg: '1234567',
        gender: 'MALE',
        userType: UserType.NORMAL,
        institution: 'PUCRS',
        isForeign: false,
        address: {
          zip: '12345-678',
          city: 'Porto Alegre',
          country: 'BR',
          street: 'Main St',
          number: '100',
        },
      } as never;

      databaseService.user.findUnique.mockResolvedValueOnce(dbUser);

      const result = await service.getUser(userId);

      expect(result).toEqual({
        name: dbUser.name,
        email: dbUser.email,
        phone: dbUser.phone,
        document: dbUser.document,
        rg: dbUser.rg,
        gender: dbUser.gender,
        zipCode: dbUser.address.zip,
        userType: dbUser.userType,
        city: dbUser.address.city,
        country: dbUser.address.country,
        addressLine: dbUser.address.street,
        number: 100,
        institution: dbUser.institution,
        isForeign: dbUser.isForeign,
      });

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

    it('should throw NotFoundException when user does not exist', async () => {
      databaseService.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.getUser(userId)).rejects.toThrow(NotFoundException);
      await expect(service.getUser(userId)).rejects.toThrow('User not found');
    });
  });
});
