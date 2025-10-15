/* eslint-disable @typescript-eslint/unbound-method */

import { BadRequestException, Logger, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { DatabaseService } from 'src/database/database.service';
import { AnalyticsService } from 'src/analytics/analytics.service';
import { CreateUserFormDto, LoginDto, ForgotPasswordDto, ChangePasswordDto } from './auth.model';
import { ReceiptType, UserType } from 'generated/prisma';
import * as argon2 from 'argon2';

// Mock do argon2
jest.mock('argon2');

describe('AuthService', () => {
  let service: AuthService;
  let databaseService: jest.Mocked<DatabaseService>;
  let jwtService: jest.Mocked<JwtService>;
  let analyticsService: jest.Mocked<AnalyticsService>;
  let configService: jest.Mocked<ConfigService>;

  let logSpy: jest.SpiedFunction<typeof Logger.prototype.log>;

  beforeAll(() => {
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  afterAll(() => {
    logSpy.mockRestore();
  });

  beforeEach(async () => {
    const mockDatabaseService = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      passwordResetToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockJwtService = {
      signAsync: jest.fn(),
    };

    const mockAnalyticsService = {
      trackPasswordChange: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    databaseService = module.get(DatabaseService);
    jwtService = module.get(JwtService);
    analyticsService = module.get(AnalyticsService);
    configService = module.get(ConfigService);

    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    it('should throw BadRequestException when passwords do not match', async () => {
      const dto: CreateUserFormDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'a'.repeat(64), // SHA256 hex
        confirmPassword: 'b'.repeat(64), // Different
        phone: '123456789',
        gender: 'M',
        zipCode: '12345-678',
        country: 'Brazil',
        userType: UserType.GUEST,
        isForeign: false,
      } as never;

      await expect(service.createUser(mockFile, dto)).rejects.toThrow(BadRequestException);
      await expect(service.createUser(mockFile, dto)).rejects.toThrow(
        'As senhas não são identicas.',
      );

      expect(databaseService.user.create).not.toHaveBeenCalled();
    });

    it('should create GUEST user with verified=true', async () => {
      const password = 'a'.repeat(64);
      const hashedPassword = 'hashed_password';

      const dto: CreateUserFormDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password,
        confirmPassword: password,
        phone: '123456789',
        document: '12345678900',
        rg: '1234567',
        gender: 'M',
        zipCode: '12345-678',
        country: 'Brazil',
        addressLine: 'Street Name',
        number: 123,
        userType: UserType.GUEST,
        institution: 'University',
        isForeign: false,
      } as never;

      (argon2.hash as jest.Mock).mockResolvedValueOnce(hashedPassword);
      databaseService.user.create.mockResolvedValueOnce({} as never);

      await service.createUser(mockFile, dto);

      expect(argon2.hash).toHaveBeenCalledWith(password, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 1,
      });

      expect(databaseService.user.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          email: dto.email,
          password: hashedPassword,
          phone: dto.phone,
          document: dto.document,
          gender: dto.gender,
          rg: dto.rg,
          userType: dto.userType,
          verified: true, // GUEST é verificado automaticamente
          institution: dto.institution,
          isForeign: dto.isForeign,
          Receipt: {
            create: {
              type: ReceiptType.DOCENCY,
              url: 'url_default',
            },
          },
          address: {
            create: {
              zip: dto.zipCode,
              street: dto.addressLine,
              city: dto.city,
              number: '123',
              country: dto.country,
            },
          },
        },
      });
    });

    it('should create PROFESSOR user with verified=false', async () => {
      const password = 'b'.repeat(64);
      const hashedPassword = 'hashed_password_prof';

      const dto: CreateUserFormDto = {
        name: 'Prof. Smith',
        email: 'smith@example.com',
        password,
        confirmPassword: password,
        phone: '987654321',
        gender: 'F',
        zipCode: '98765-432',
        country: 'Brazil',
        userType: UserType.PROFESSOR,
        isForeign: false,
      } as never;

      (argon2.hash as jest.Mock).mockResolvedValueOnce(hashedPassword);
      databaseService.user.create.mockResolvedValueOnce({} as never);

      await service.createUser(mockFile, dto);

      expect(databaseService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userType: UserType.PROFESSOR,
          verified: false, // PROFESSOR não é verificado automaticamente
        }),
      });
    });

    it('should create user without optional fields', async () => {
      const password = 'c'.repeat(64);
      const hashedPassword = 'hashed_minimal';

      const dto: CreateUserFormDto = {
        name: 'Minimal User',
        email: 'minimal@example.com',
        password,
        confirmPassword: password,
        phone: '111111111',
        gender: 'M',
        zipCode: '00000-000',
        country: 'Brazil',
        userType: UserType.GUEST,
        isForeign: false,
      } as never;

      (argon2.hash as jest.Mock).mockResolvedValueOnce(hashedPassword);
      databaseService.user.create.mockResolvedValueOnce({} as never);

      await service.createUser(mockFile, dto);

      expect(databaseService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          document: undefined,
          rg: undefined,
          institution: undefined,
          address: {
            create: expect.objectContaining({
              street: undefined,
              city: undefined,
              number: undefined,
            }),
          },
        }),
      });
    });
  });

  describe('signIn', () => {
    const userId = '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7';
    const jwtSecret = 'super-secret-key';

    beforeEach(() => {
      configService.get.mockReturnValue(jwtSecret);
    });

    it('should throw BadRequestException when user does not exist', async () => {
      const dto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'a'.repeat(64),
      } as never;

      databaseService.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.signIn(dto)).rejects.toThrow(BadRequestException);
      await expect(service.signIn(dto)).rejects.toThrow(
        'Nenhum usuário encontrado com esse email.',
      );

      expect(databaseService.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
        select: { id: true, password: true },
      });
    });

    it('should return JWT token when credentials are valid', async () => {
      const dto: LoginDto = {
        email: 'user@example.com',
        password: 'correctpassword123',
      } as never;

      const mockUser = {
        id: userId,
        password: 'hashed_password',
      };

      const mockToken = 'jwt.token.here';

      databaseService.user.findUnique.mockResolvedValueOnce(mockUser as never);
      (argon2.verify as jest.Mock).mockResolvedValueOnce(true);
      jwtService.signAsync.mockResolvedValueOnce(mockToken);

      const result = await service.signIn(dto);

      expect(result).toEqual({ token: mockToken });

      expect(argon2.verify).toHaveBeenCalledWith(mockUser.password, dto.password);
      expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: userId }, { secret: jwtSecret });
    });
  });

  describe('forgotPassword', () => {
    it('should log and return when user does not exist', async () => {
      const dto: ForgotPasswordDto = {
        email: 'nonexistent@example.com',
      } as never;

      databaseService.user.findUnique.mockResolvedValueOnce(null);

      await service.forgotPassword(dto);

      expect(databaseService.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(logSpy).toHaveBeenCalledWith('POST /auth/forgot: Email não encontrado!');
      expect(databaseService.passwordResetToken.create).not.toHaveBeenCalled();
    });

    it('should create password reset token when user exists', async () => {
      const userId = '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7';
      const dto: ForgotPasswordDto = {
        email: 'user@example.com',
      } as never;

      const mockUser = { id: userId, email: dto.email };

      databaseService.user.findUnique.mockResolvedValueOnce(mockUser as never);
      databaseService.passwordResetToken.create.mockResolvedValueOnce({} as never);

      await service.forgotPassword(dto);

      expect(databaseService.passwordResetToken.create).toHaveBeenCalledWith({
        data: {
          userId,
          token: expect.any(String),
          createdAt: expect.any(Date),
          expiredAt: expect.any(Date),
        },
      });

      // Verificar que o token tem 40 caracteres (20 bytes em hex)
      const createCall = databaseService.passwordResetToken.create.mock.calls[0][0];
      expect(createCall.data.token).toHaveLength(40);

      // Verificar que expiredAt é 1 hora após createdAt
      const createdAt = createCall.data.createdAt as Date;
      const expiredAt = createCall.data.expiredAt as Date;
      const diffInHours = (expiredAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      expect(diffInHours).toBe(1);
    });
  });

  describe('changePassword', () => {
    const userId = '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7';
    const validToken = 'a'.repeat(40);

    it('should throw BadRequestException when passwords do not match', async () => {
      const dto: ChangePasswordDto = {
        token: validToken,
        password: 'a'.repeat(64),
        confirmPassword: 'b'.repeat(64),
      } as never;

      await expect(service.changePassword(dto)).rejects.toThrow(BadRequestException);
      await expect(service.changePassword(dto)).rejects.toThrow('As senhas não são identicas.');

      expect(databaseService.passwordResetToken.findUnique).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when token is invalid', async () => {
      const dto: ChangePasswordDto = {
        token: 'invalid_token_123456789012345678901234',
        password: 'a'.repeat(64),
        confirmPassword: 'a'.repeat(64),
      } as never;

      databaseService.passwordResetToken.findUnique.mockResolvedValueOnce(null);

      await expect(service.changePassword(dto)).rejects.toThrow(BadRequestException);
      await expect(service.changePassword(dto)).rejects.toThrow('Token inválido.');
    });

    it('should change password and deactivate token when valid', async () => {
      const password = 'a'.repeat(64);
      const hashedPassword = 'hashed_password';

      const dto: ChangePasswordDto = {
        token: validToken,
        password,
        confirmPassword: password,
      } as never;

      const validTokenData = {
        userId,
        token: validToken,
        expiredAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hora no futuro
        isActive: true,
      };

      databaseService.passwordResetToken.findUnique.mockResolvedValueOnce(validTokenData as never);
      databaseService.user.update.mockResolvedValueOnce({} as never);
      databaseService.passwordResetToken.update.mockResolvedValueOnce({} as never);
      analyticsService.trackPasswordChange.mockResolvedValueOnce(undefined);

      (argon2.hash as jest.Mock).mockResolvedValueOnce(hashedPassword);

      await service.changePassword(dto);

      expect(databaseService.passwordResetToken.findUnique).toHaveBeenCalledWith({
        where: { token: validToken, isActive: true },
      });

      expect(databaseService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      expect(databaseService.passwordResetToken.update).toHaveBeenCalledWith({
        where: { token: validToken },
        data: { isActive: false },
      });

      expect(analyticsService.trackPasswordChange).toHaveBeenCalledWith(userId);
    });
  });

  describe('checkToken', () => {
    const validToken = 'a'.repeat(40);
    const userId = '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7';

    it('should throw BadRequestException when token does not exist', async () => {
      databaseService.passwordResetToken.findUnique.mockResolvedValueOnce(null);

      await expect(service.checkToken(validToken)).rejects.toThrow(BadRequestException);
      await expect(service.checkToken(validToken)).rejects.toThrow('Token inválido.');
    });

    it('should return token data when valid', async () => {
      const validTokenData = {
        userId,
        token: validToken,
        expiredAt: new Date(Date.now() + 1000 * 60 * 60),
        isActive: true,
      };

      databaseService.passwordResetToken.findUnique.mockResolvedValueOnce(validTokenData as never);

      const result = await service.checkToken(validToken);

      expect(result).toEqual(validTokenData);
      expect(databaseService.passwordResetToken.findUnique).toHaveBeenCalledWith({
        where: { token: validToken, isActive: true },
      });
    });
  });

  describe('hashPassword', () => {
    it('should hash password with correct argon2 options', async () => {
      const plainPassword = 'my_plain_password';
      const hashedPassword = 'hashed_result';

      (argon2.hash as jest.Mock).mockResolvedValueOnce(hashedPassword);

      const result = await service.hashPassword(plainPassword);

      expect(result).toBe(hashedPassword);
      expect(argon2.hash).toHaveBeenCalledWith(plainPassword, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 1,
      });
    });
  });

  describe('verifyPassword', () => {
    it('should return true when password matches', async () => {
      const hash = 'hashed_password';
      const plain = 'plain_password';

      (argon2.verify as jest.Mock).mockResolvedValueOnce(true);

      const result = await service.verifyPassword(hash, plain);

      expect(result).toBe(true);
      expect(argon2.verify).toHaveBeenCalledWith(hash, plain);
    });

    it('should return false when password does not match', async () => {
      const hash = 'hashed_password';
      const plain = 'wrong_password';

      (argon2.verify as jest.Mock).mockResolvedValueOnce(false);

      const result = await service.verifyPassword(hash, plain);

      expect(result).toBe(false);
      expect(argon2.verify).toHaveBeenCalledWith(hash, plain);
    });
  });

  describe('findProfile', () => {
    const userId = '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7';

    it('should return user profile with address', async () => {
      const mockProfile = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123456789',
        document: '12345678900',
        gender: 'M',
        address: {
          zip: '12345-678',
          street: 'Street Name',
          city: 'City',
          number: '123',
          country: 'Brazil',
        },
      };

      databaseService.user.findUnique.mockResolvedValueOnce(mockProfile as never);

      const result = await service.findProfile(userId);

      expect(result).toEqual(mockProfile);
      expect(databaseService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        omit: {
          id: true,
          password: true,
          createdAt: true,
          addressId: true,
          createdByUserId: true,
          active: true,
        },
        include: {
          address: {
            omit: { id: true, createdAt: true },
          },
        },
      });
    });

    it('should return null when user does not exist', async () => {
      databaseService.user.findUnique.mockResolvedValueOnce(null);

      const result = await service.findProfile(userId);

      expect(result).toBeNull();
    });
  });
});
