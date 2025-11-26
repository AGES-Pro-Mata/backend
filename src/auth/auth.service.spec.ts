/* eslint-disable @typescript-eslint/unbound-method */

import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import argon2 from 'argon2';
import { AuthService } from './auth.service';
import { DatabaseService } from '../database/database.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { MailService } from '../mail/mail.service';
import { StorageService } from '../storage/storage.service';
import {
  ChangePasswordDto,
  CreateRootUserDto,
  CreateUserFormDto,
  ForgotPasswordDto,
  LoginDto,
} from './auth.model';
import { RequestType } from 'generated/prisma';

jest.mock('argon2');

const mockedArgon2 = argon2 as unknown as {
  hash: jest.Mock;
  verify: jest.Mock;
};

describe('AuthService', () => {
  let service: AuthService;
  let databaseService: any;
  let jwtService: any;
  let analyticsService: any;
  let configService: any;
  let mailService: any;
  let storageService: any;

  beforeEach(async () => {
    const mockDatabaseService = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      passwordResetToken: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      requests: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn(),
    };

    const mockAnalyticsService = {
      trackPasswordChange: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'jwt-secret';
        if (key === 'FRONTEND_URL') return 'https://frontend.example.com';
        return undefined;
      }),
    };

    const mockMailService = {
      sendTemplateMail: jest.fn(),
    };

    const mockStorageService = {
      uploadFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MailService, useValue: mockMailService },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    databaseService = module.get(DatabaseService);
    jwtService = module.get(JwtService);
    analyticsService = module.get(AnalyticsService);
    configService = module.get(ConfigService);
    mailService = module.get(MailService);
    storageService = module.get(StorageService);

    databaseService.$transaction.mockImplementation(async (callback: (tx: any) => Promise<any>) => {
      return callback(databaseService);
    });

    mockedArgon2.hash.mockReset();
    mockedArgon2.verify.mockReset();
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const baseDto: CreateUserFormDto = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'a'.repeat(64),
      confirmPassword: 'a'.repeat(64),
      phone: '123456789',
      document: '12345678900',
      gender: 'M',
      rg: '1234567',
      userType: 'GUEST',
      institution: 'PUCRS',
      isForeign: false,
      zipCode: '12345-678',
      addressLine: 'Main St',
      city: 'Porto Alegre',
      number: 123,
      country: 'BR',
    } as never;

    it('should throw BadRequestException when passwords do not match', async () => {
      const dto = { ...baseDto, confirmPassword: 'b'.repeat(64) } as CreateUserFormDto;

      await expect(service.createUser(null, dto)).rejects.toThrow(BadRequestException);
      await expect(service.createUser(null, dto)).rejects.toThrow('As senhas não são identicas.');

      expect(databaseService.$transaction).not.toHaveBeenCalled();
    });

    it('should create user without file and set verified true for non professor', async () => {
      const dto = { ...baseDto, userType: 'GUEST' } as CreateUserFormDto;

      const hashSpy = jest.spyOn(service, 'hashPassword').mockResolvedValueOnce('hashed-password');
      databaseService.user.create.mockResolvedValueOnce({ id: 'user-1' } as never);

      await service.createUser(null, dto);

      expect(hashSpy).toHaveBeenCalledWith(dto.password);

      expect(databaseService.user.create).toHaveBeenCalledWith({
        select: { id: true },
        data: expect.objectContaining({
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          document: dto.document,
          gender: dto.gender,
          rg: dto.rg,
          userType: dto.userType,
          verified: true,
          institution: dto.institution,
          isForeign: dto.isForeign,
          address: {
            create: {
              zip: dto.zipCode,
              street: dto.addressLine,
              city: dto.city,
              number: dto.number?.toString(),
              country: dto.country,
            },
          },
        }),
      });

      expect(databaseService.requests.create).not.toHaveBeenCalled();
      expect(storageService.uploadFile).not.toHaveBeenCalled();
    });

    it('should upload file and create DOCUMENT_REQUESTED request for professor', async () => {
      const dto: CreateUserFormDto = {
        ...baseDto,
        userType: 'PROFESSOR',
      } as never;

      const mockFile = {
        mimetype: 'application/pdf',
      } as Express.Multer.File;

      const hashSpy = jest.spyOn(service, 'hashPassword').mockResolvedValueOnce('hashed-password');
      storageService.uploadFile.mockResolvedValueOnce({ url: 'https://s3.test/user/doc.pdf' });

      databaseService.user.create.mockResolvedValueOnce({ id: 'user-2' } as never);

      await service.createUser(mockFile, dto);

      expect(hashSpy).toHaveBeenCalledWith(dto.password);

      expect(storageService.uploadFile).toHaveBeenCalledWith(mockFile, {
        directory: 'user',
        contentType: mockFile.mimetype,
        cacheControl: 'public, max-age=31536000',
      });

      expect(databaseService.requests.create).toHaveBeenCalledWith({
        data: {
          type: RequestType.DOCUMENT_REQUESTED,
          createdByUserId: 'user-2',
          professorId: 'user-2',
          fileUrl: 'https://s3.test/user/doc.pdf',
        },
      });
    });
  });

  describe('signIn', () => {
    const loginDto: LoginDto = {
      email: 'user@example.com',
      password: 'password123',
    } as never;

    it('should throw BadRequestException when user is not found', async () => {
      databaseService.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.signIn(loginDto)).rejects.toThrow(BadRequestException);
      await expect(service.signIn(loginDto)).rejects.toThrow(
        'Nenhum usuário encontrado com esse email.',
      );
    });

    it('should throw BadRequestException when password is incorrect', async () => {
      databaseService.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        password: 'hash',
        isFirstAccess: false,
      } as never);

      const verifySpy = jest.spyOn(service, 'verifyPassword').mockResolvedValue(false);

      const signInPromise = service.signIn(loginDto);

      await expect(signInPromise).rejects.toThrow(BadRequestException);
      await expect(signInPromise).rejects.toThrow('Senha incorreta.');

      expect(verifySpy).toHaveBeenCalledWith('hash', loginDto.password);
    });

    it('should return reset token when first access', async () => {
      databaseService.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        password: 'hash',
        isFirstAccess: true,
      } as never);

      jest.spyOn(service, 'verifyPassword').mockResolvedValueOnce(true);
      jest.spyOn(service, 'createResetToken').mockResolvedValueOnce('reset-token');

      const result = await service.signIn(loginDto);

      expect(service.createResetToken).toHaveBeenCalledWith('user-1');
      expect(jwtService.signAsync).not.toHaveBeenCalled();
      expect(result).toEqual({ token: 'reset-token', isFirstAccess: true });
    });

    it('should sign jwt when not first access', async () => {
      databaseService.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        password: 'hash',
        isFirstAccess: false,
      } as never);

      jest.spyOn(service, 'verifyPassword').mockResolvedValueOnce(true);
      jwtService.signAsync.mockResolvedValueOnce('jwt-token');

      const result = await service.signIn(loginDto);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: 'user-1' },
        { secret: 'jwt-secret' },
      );
      expect(result).toEqual({ token: 'jwt-token', isFirstAccess: false });
    });
  });

  describe('forgotPassword', () => {
    it('should throw BadRequestException when user is not found', async () => {
      const dto: ForgotPasswordDto = { email: 'missing@example.com' } as never;
      databaseService.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.forgotPassword(dto)).rejects.toThrow(BadRequestException);
      await expect(service.forgotPassword(dto)).rejects.toThrow('Usuário não encontrado.');
    });

    it('should create reset token and send email when user exists', async () => {
      const dto: ForgotPasswordDto = { email: 'user@example.com' } as never;
      const user = { id: 'user-1', email: dto.email, name: 'User Name' } as never;

      databaseService.user.findUnique.mockResolvedValueOnce(user);
      jest.spyOn(service, 'createResetToken').mockResolvedValueOnce('reset-token');

      await service.forgotPassword(dto);

      expect(service.createResetToken).toHaveBeenCalledWith('user-1');
      expect(configService.get).toHaveBeenCalledWith('FRONTEND_URL');
      expect(mailService.sendTemplateMail).toHaveBeenCalledWith(
        user.email,
        'Recuperação de senha',
        'forgot-password',
        {
          name: user.name,
          resetUrl: 'https://frontend.example.com/auth/redefine/reset-token',
        },
      );
    });
  });

  describe('changePassword', () => {
    const dto: ChangePasswordDto = {
      token: 'reset-token',
      password: 'new-password',
      confirmPassword: 'new-password',
    } as never;

    it('should throw BadRequestException when passwords do not match', async () => {
      const mismatchDto = { ...dto, confirmPassword: 'another' } as ChangePasswordDto;
      const compareSpy = jest
        .spyOn(service as any, 'comparePasswords')
        .mockReturnValue(false as never);

      const changePromise = service.changePassword(mismatchDto);

      await expect(changePromise).rejects.toThrow(BadRequestException);
      await expect(changePromise).rejects.toThrow('As senhas não são identicas.');

      compareSpy.mockRestore();
    });

    it('should update password, deactivate token and track analytics on success', async () => {
      const compareSpy = jest
        .spyOn(service as any, 'comparePasswords')
        .mockReturnValueOnce(true as never);

      const passwordResetToken = {
        userId: 'user-1',
        token: dto.token,
        expiredAt: new Date(Date.now() + 60_000),
        isActive: true,
      } as never;

      jest.spyOn(service, 'checkToken').mockResolvedValueOnce(passwordResetToken as never);
      const hashSpy = jest.spyOn(service, 'hashPassword').mockResolvedValueOnce('hashed-new');

      databaseService.user.update.mockResolvedValueOnce({} as never);
      databaseService.passwordResetToken.update.mockResolvedValueOnce({} as never);

      await service.changePassword(dto);

      expect(compareSpy).toHaveBeenCalled();
      expect(service.checkToken).toHaveBeenCalledWith(dto.token);
      expect(hashSpy).toHaveBeenCalledWith(dto.password);
      expect(databaseService.user.update).toHaveBeenCalledWith({
        where: { id: passwordResetToken.userId },
        data: {
          password: 'hashed-new',
          isFirstAccess: false,
        },
      });
      expect(databaseService.passwordResetToken.update).toHaveBeenCalledWith({
        where: { token: dto.token },
        data: { isActive: false },
      });
      expect(analyticsService.trackPasswordChange).toHaveBeenCalledWith('user-1');

      compareSpy.mockRestore();
    });
  });

  describe('checkToken', () => {
    it('should throw BadRequestException when token is not found', async () => {
      databaseService.passwordResetToken.findUnique.mockResolvedValueOnce(null);

      await expect(service.checkToken('token')).rejects.toThrow(BadRequestException);
      await expect(service.checkToken('token')).rejects.toThrow('Token inválido.');
    });

    it('should throw UnauthorizedException when token is expired', async () => {
      const expiredToken = {
        token: 'token',
        userId: 'user-1',
        expiredAt: new Date(Date.now() - 1000),
        isActive: true,
      } as never;

      databaseService.passwordResetToken.findUnique.mockResolvedValue(expiredToken);

      const checkPromise = service.checkToken('token');

      await expect(checkPromise).rejects.toThrow(UnauthorizedException);
      await expect(checkPromise).rejects.toThrow('Token expirado.');
    });

    it('should return token when it is valid and active', async () => {
      const validToken = {
        token: 'token',
        userId: 'user-1',
        expiredAt: new Date(Date.now() + 60_000),
        isActive: true,
      } as never;

      databaseService.passwordResetToken.findUnique.mockResolvedValueOnce(validToken);

      const result = await service.checkToken('token');

      expect(result).toBe(validToken);
    });
  });

  describe('hashPassword & verifyPassword', () => {
    it('should hash password using argon2 with correct options', async () => {
      mockedArgon2.hash.mockResolvedValueOnce('hashed');

      const result = await service.hashPassword('plain');

      expect(mockedArgon2.hash).toHaveBeenCalledWith('plain', {
        type: expect.any(Number),
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 1,
      });
      expect(result).toBe('hashed');
    });

    it('should verify password using argon2', async () => {
      mockedArgon2.verify.mockResolvedValueOnce(true);

      const result = await service.verifyPassword('hash', 'plain');

      expect(mockedArgon2.verify).toHaveBeenCalledWith('hash', 'plain');
      expect(result).toBe(true);
    });
  });

  describe('findProfile', () => {
    it('should call databaseService.user.findUnique with correct where and omit/include', async () => {
      const profile = { name: 'John', email: 'john@example.com' } as never;
      databaseService.user.findUnique.mockResolvedValueOnce(profile);

      const result = await service.findProfile('user-1');

      expect(databaseService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        omit: {
          id: true,
          password: true,
          createdAt: true,
          addressId: true,
          createdByUserId: true,
          active: true,
          isFirstAccess: true,
        },
        include: {
          address: {
            omit: { id: true, createdAt: true },
          },
        },
      });
      expect(result).toBe(profile);
    });
  });

  describe('createResetToken', () => {
    it('should return existing active token if present', async () => {
      const activeToken = { token: 'existing-token' } as never;
      databaseService.passwordResetToken.findFirst.mockResolvedValueOnce(activeToken);

      const result = await service.createResetToken('user-1');

      expect(databaseService.passwordResetToken.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', isActive: true, expiredAt: { gt: expect.any(Date) } },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toBe('existing-token');
      expect(databaseService.passwordResetToken.create).not.toHaveBeenCalled();
    });

    it('should create new token when there is no active one', async () => {
      databaseService.passwordResetToken.findFirst.mockResolvedValueOnce(null);
      databaseService.passwordResetToken.create.mockResolvedValueOnce({} as never);

      const result = await service.createResetToken('user-1');

      expect(databaseService.passwordResetToken.create).toHaveBeenCalledTimes(1);
      const call = databaseService.passwordResetToken.create.mock.calls[0][0];

      expect(call.data.userId).toBe('user-1');
      expect(typeof call.data.token).toBe('string');
      expect(call.data.createdAt).toBeInstanceOf(Date);
      expect(call.data.expiredAt).toBeInstanceOf(Date);

      expect(result).toBe(call.data.token);
    });
  });

  describe('createRootUser', () => {
    const baseDto: CreateRootUserDto = {
      name: 'Root User',
      email: 'root@example.com',
      password: 'rootpass',
      confirmPassword: 'rootpass',
      phone: '123456789',
      document: '12345678900',
      gender: 'M',
      rg: '1234567',
      userType: 'ADMIN' as never,
      institution: 'PUCRS',
      isForeign: false,
      zipCode: '12345-678',
      addressLine: 'Main St',
      city: 'Porto Alegre',
      number: 123,
      country: 'BR',
      isFirstAccess: true,
    } as never;

    it('should throw BadRequestException when passwords do not match', async () => {
      const dto = { ...baseDto, confirmPassword: 'different' } as CreateRootUserDto;

      await expect(service.createRootUser('creator-1', dto)).rejects.toThrow(BadRequestException);
      await expect(service.createRootUser('creator-1', dto)).rejects.toThrow(
        'As senhas não são identicas.',
      );
    });

    it('should create root user with hashed password and address', async () => {
      const dto = { ...baseDto } as CreateRootUserDto;
      const hashSpy = jest.spyOn(service, 'hashPassword').mockResolvedValueOnce('hashed-root');
      databaseService.user.create.mockResolvedValueOnce({} as never);

      await service.createRootUser('creator-1', dto);

      expect(hashSpy).toHaveBeenCalledWith(dto.password);
      expect(databaseService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: dto.name,
          email: dto.email,
          password: 'hashed-root',
          phone: dto.phone,
          document: dto.document,
          gender: dto.gender,
          userType: dto.userType,
          isForeign: false,
          verified: true,
          rg: dto.rg,
          institution: dto.institution,
          createdBy: {
            connect: { id: 'creator-1' },
          },
          isFirstAccess: true,
          address: {
            create: {
              zip: dto.zipCode,
              street: dto.addressLine,
              city: dto.city,
              number: dto.number?.toString(),
              country: dto.country,
            },
          },
        }),
      });
    });
  });
});
