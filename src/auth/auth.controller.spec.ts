/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  CreateRootUserDto,
  CreateUserFormDto,
  CurrentUser,
  ForgotPasswordDto,
  LoginDto,
} from './auth.model';
import { UserType } from 'generated/prisma';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const mockAuthService = {
      createUser: jest.fn(),
      signIn: jest.fn(),
      checkToken: jest.fn(),
      forgotPassword: jest.fn(),
      changePassword: jest.fn(),
      findProfile: jest.fn(),
      createRootUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);

    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should call authService.createUser with file and dto', async () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const dto: CreateUserFormDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'a'.repeat(64),
        confirmPassword: 'a'.repeat(64),
        phone: '123456789',
        gender: 'M',
        zipCode: '12345-678',
        country: 'Brazil',
        userType: UserType.GUEST,
        isForeign: false,
      } as never;

      authService.createUser.mockResolvedValueOnce(undefined);

      await controller.createUser(mockFile, dto);

      expect(authService.createUser).toHaveBeenCalledWith(mockFile, dto);
      expect(authService.createUser).toHaveBeenCalledTimes(1);
    });

    it('should return the result from authService.createUser', async () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const dto: CreateUserFormDto = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'b'.repeat(64),
        confirmPassword: 'b'.repeat(64),
        phone: '987654321',
        gender: 'F',
        zipCode: '98765-432',
        country: 'Brazil',
        userType: UserType.PROFESSOR,
        isForeign: false,
      } as never;

      const expectedResult = { id: '123', email: dto.email };
      authService.createUser.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.createUser(mockFile, dto);

      expect(result).toEqual(expectedResult);
    });
  });

  describe('signIn', () => {
    it('should call authService.signIn with dto', async () => {
      const dto: LoginDto = {
        email: 'user@example.com',
        password: 'password123',
      } as never;

      const expectedResult = { token: 'jwt.token.here', isFirstAccess: false };
      authService.signIn.mockResolvedValueOnce(expectedResult);

      const result = await controller.signIn(dto);

      expect(authService.signIn).toHaveBeenCalledWith(dto);
      expect(authService.signIn).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('should return token with isFirstAccess true when first access', async () => {
      const dto: LoginDto = {
        email: 'newuser@example.com',
        password: 'password123',
      } as never;

      const expectedResult = { token: 'reset.token.here', isFirstAccess: true };
      authService.signIn.mockResolvedValueOnce(expectedResult);

      const result = await controller.signIn(dto);

      expect(result).toEqual(expectedResult);
      expect(result.isFirstAccess).toBe(true);
    });
  });

  describe('checkToken', () => {
    it('should call authService.checkToken with token parameter', async () => {
      const token = 'a'.repeat(40);
      const expectedResult = {
        userId: '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7',
        token,
        expiredAt: new Date(),
        isActive: true,
      };

      authService.checkToken.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.checkToken(token);

      expect(authService.checkToken).toHaveBeenCalledWith(token);
      expect(authService.checkToken).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from authService.checkToken', async () => {
      const token = 'invalid_token';
      const error = new Error('Token inválido.');

      authService.checkToken.mockRejectedValueOnce(error);

      await expect(controller.checkToken(token)).rejects.toThrow('Token inválido.');
    });
  });

  describe('forgotPassword', () => {
    it('should call authService.forgotPassword with dto', async () => {
      const dto: ForgotPasswordDto = {
        email: 'user@example.com',
      } as never;

      authService.forgotPassword.mockResolvedValueOnce(undefined);

      const result = await controller.forgotPassword(dto);

      expect(authService.forgotPassword).toHaveBeenCalledWith(dto);
      expect(authService.forgotPassword).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ message: 'Email de recuperação enviado com sucesso.' });
    });

    it('should return success message even if service throws', async () => {
      const dto: ForgotPasswordDto = {
        email: 'nonexistent@example.com',
      } as never;

      authService.forgotPassword.mockRejectedValueOnce(new Error('Usuário não encontrado.'));

      await expect(controller.forgotPassword(dto)).rejects.toThrow('Usuário não encontrado.');
    });
  });

  describe('changePassword', () => {
    it('should call authService.changePassword with dto', async () => {
      const dto: ChangePasswordDto = {
        token: 'a'.repeat(40),
        password: 'newpassword123',
        confirmPassword: 'newpassword123',
      } as never;

      authService.changePassword.mockResolvedValueOnce(undefined);

      await controller.changePassword(dto);

      expect(authService.changePassword).toHaveBeenCalledWith(dto);
      expect(authService.changePassword).toHaveBeenCalledTimes(1);
    });

    it('should return the result from authService.changePassword', async () => {
      const dto: ChangePasswordDto = {
        token: 'b'.repeat(40),
        password: 'anotherpassword456',
        confirmPassword: 'anotherpassword456',
      } as never;

      const expectedResult = { success: true };
      authService.changePassword.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.changePassword(dto);

      expect(result).toEqual(expectedResult);
    });
  });

  describe('findProfile', () => {
    it('should call authService.findProfile with user id', async () => {
      const currentUser: CurrentUser = {
        id: '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7',
        userType: UserType.GUEST,
      };

      const expectedProfile = {
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

      authService.findProfile.mockResolvedValueOnce(expectedProfile as never);

      const result = await controller.findProfile(currentUser);

      expect(authService.findProfile).toHaveBeenCalledWith(currentUser.id);
      expect(authService.findProfile).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedProfile);
    });

    it('should work with ADMIN user type', async () => {
      const currentUser: CurrentUser = {
        id: '2c8c5c1b-2f78-52bg-0g1g-5b22g4f9b0g8',
        userType: UserType.ADMIN,
      };

      const expectedProfile = {
        name: 'Admin User',
        email: 'admin@example.com',
        phone: '987654321',
        document: '98765432100',
        gender: 'F',
        address: {
          zip: '98765-432',
          street: 'Admin Street',
          city: 'Admin City',
          number: '456',
          country: 'Brazil',
        },
      };

      authService.findProfile.mockResolvedValueOnce(expectedProfile as never);

      const result = await controller.findProfile(currentUser);

      expect(authService.findProfile).toHaveBeenCalledWith(currentUser.id);
      expect(result).toEqual(expectedProfile);
    });

    it('should return null when profile not found', async () => {
      const currentUser: CurrentUser = {
        id: '3d9d6d2c-3g89-63ch-1h2h-6c33h5g0c1h9',
        userType: UserType.GUEST,
      };

      authService.findProfile.mockResolvedValueOnce(null);

      const result = await controller.findProfile(currentUser);

      expect(result).toBeNull();
    });
  });

  describe('createUserAsAdmin', () => {
    it('should call authService.createRootUser with user id and dto', async () => {
      const currentUser: CurrentUser = {
        id: '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7',
        userType: UserType.ADMIN,
      };

      const dto: CreateRootUserDto = {
        name: 'New Admin',
        email: 'newadmin@example.com',
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
        isFirstAccess: true,
      } as never;

      authService.createRootUser.mockResolvedValueOnce(undefined);

      await controller.createUserAsAdmin(currentUser, dto);

      expect(authService.createRootUser).toHaveBeenCalledWith(currentUser.id, dto);
      expect(authService.createRootUser).toHaveBeenCalledTimes(1);
    });

    it('should return the result from authService.createRootUser', async () => {
      const currentUser: CurrentUser = {
        id: '2c8c5c1b-2f78-52bg-0g1g-5b22g4f9b0g8',
        userType: UserType.ADMIN,
      };

      const dto: CreateRootUserDto = {
        name: 'Another Admin',
        email: 'anotheradmin@example.com',
        password: 'password456',
        confirmPassword: 'password456',
        phone: '987654321',
        gender: 'F',
        country: 'Brazil',
        userType: UserType.ADMIN,
        isForeign: false,
        zipCode: '00000-000',
        isFirstAccess: true,
      } as never;

      const expectedResult = { id: '456', email: dto.email };
      authService.createRootUser.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.createUserAsAdmin(currentUser, dto);

      expect(result).toEqual(expectedResult);
    });

    it('should handle creation with minimal fields', async () => {
      const currentUser: CurrentUser = {
        id: '3d9d6d2c-3g89-63ch-1h2h-6c33h5g0c1h9',
        userType: UserType.ADMIN,
      };

      const dto: CreateRootUserDto = {
        name: 'Minimal Admin',
        email: 'minimal@example.com',
        password: 'pass',
        confirmPassword: 'pass',
        phone: '111111111',
        gender: 'M',
        country: 'Brazil',
        userType: UserType.ADMIN,
        isForeign: false,
        zipCode: '00000-000',
        isFirstAccess: false,
      } as never;

      authService.createRootUser.mockResolvedValueOnce(undefined);

      await controller.createUserAsAdmin(currentUser, dto);

      expect(authService.createRootUser).toHaveBeenCalledWith(currentUser.id, dto);
    });
  });
});
