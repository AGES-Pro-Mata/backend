import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserType } from 'generated/prisma';
import { UserSearchParamsDto, UpdateUserFormDto } from './user.model';
import { CurrentUser } from 'src/auth/auth.model';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUserService = {
    deleteUser: jest.fn(),
    updateUser: jest.fn(),
    getUser: jest.fn(),
    searchUser: jest.fn(),
  };

  const mockUser: CurrentUser = {
    id: 'user-123',
    email: 'test@example.com',
    type: UserType.GUEST,
  };

  const mockAdmin: CurrentUser = {
    id: 'admin-123',
    email: 'admin@example.com',
    type: UserType.ADMIN,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      const userId = 'user-to-delete-123';

      mockUserService.deleteUser.mockResolvedValue(undefined);

      await controller.deleteUser(mockAdmin, userId);

      expect(service.deleteUser).toHaveBeenCalledWith(userId, mockAdmin.id);
      expect(service.deleteUser).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when deleting user', async () => {
      const userId = 'user-to-delete-123';

      mockUserService.deleteUser.mockRejectedValue(new Error('Cannot delete user'));

      await expect(controller.deleteUser(mockAdmin, userId)).rejects.toThrow('Cannot delete user');
      expect(service.deleteUser).toHaveBeenCalledWith(userId, mockAdmin.id);
    });

    it('should pass correct admin id when deleting', async () => {
      const userId = 'user-to-delete-123';
      const differentAdmin: CurrentUser = {
        id: 'different-admin-456',
        email: 'different@example.com',
        type: UserType.ADMIN,
      };

      mockUserService.deleteUser.mockResolvedValue(undefined);

      await controller.deleteUser(differentAdmin, userId);

      expect(service.deleteUser).toHaveBeenCalledWith(userId, differentAdmin.id);
    });
  });

  describe('updateUserAsAdmin', () => {
    it('should update user as admin successfully', async () => {
      const userId = 'user-123';
      const updateDto: UpdateUserFormDto = {
        name: 'Updated Name',
        email: 'updated@example.com',
        phone: '11999999999',
        document: '12345678900',
        rg: '123456789',
        gender: 'M',
        zipCode: '12345-678',
        userType: UserType.GUEST,
        city: 'São Paulo',
        country: 'Brasil',
        addressLine: 'Rua Test',
        number: 123,
        institution: 'Test Institution',
        isForeign: false,
      };

      mockUserService.updateUser.mockResolvedValue(undefined);

      await controller.updateUserAsAdmin(userId, updateDto);

      expect(service.updateUser).toHaveBeenCalledWith(userId, updateDto);
      expect(service.updateUser).toHaveBeenCalledTimes(1);
    });

    it('should update user with partial data', async () => {
      const userId = 'user-123';
      const updateDto: UpdateUserFormDto = {
        name: 'Just Name Update',
      };

      mockUserService.updateUser.mockResolvedValue(undefined);

      await controller.updateUserAsAdmin(userId, updateDto);

      expect(service.updateUser).toHaveBeenCalledWith(userId, updateDto);
    });

    it('should update user with nullable fields', async () => {
      const userId = 'user-123';
      const updateDto: UpdateUserFormDto = {
        name: 'Test User',
        document: null,
        rg: null,
        city: null,
        addressLine: null,
        number: null,
        institution: null,
      };

      mockUserService.updateUser.mockResolvedValue(undefined);

      await controller.updateUserAsAdmin(userId, updateDto);

      expect(service.updateUser).toHaveBeenCalledWith(userId, updateDto);
    });

    it('should update user with different userTypes', async () => {
      const userId = 'user-123';
      const updateDto: UpdateUserFormDto = {
        userType: UserType.PROFESSOR,
      };

      mockUserService.updateUser.mockResolvedValue(undefined);

      await controller.updateUserAsAdmin(userId, updateDto);

      expect(service.updateUser).toHaveBeenCalledWith(userId, updateDto);
    });

    it('should update user with foreign flag', async () => {
      const userId = 'user-123';
      const updateDto: UpdateUserFormDto = {
        name: 'Foreign User',
        isForeign: true,
        country: 'USA',
      };

      mockUserService.updateUser.mockResolvedValue(undefined);

      await controller.updateUserAsAdmin(userId, updateDto);

      expect(service.updateUser).toHaveBeenCalledWith(userId, updateDto);
    });

    it('should handle errors when updating user as admin', async () => {
      const userId = 'user-123';
      const updateDto: UpdateUserFormDto = {
        name: 'Test',
      };

      mockUserService.updateUser.mockRejectedValue(new Error('Update failed'));

      await expect(controller.updateUserAsAdmin(userId, updateDto)).rejects.toThrow(
        'Update failed',
      );
    });
  });

  describe('getAdmin', () => {
    it('should get user by id successfully', async () => {
      const userId = 'user-123';
      const expectedUser = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '11999999999',
        document: '12345678900',
        rg: '123456789',
        gender: 'M',
        zipCode: '12345-678',
        userType: UserType.GUEST,
        city: 'São Paulo',
        country: 'Brasil',
        addressLine: 'Rua Test',
        number: 123,
        institution: 'Test Institution',
        isForeign: false,
      };

      mockUserService.getUser.mockResolvedValue(expectedUser);

      const result = await controller.getAdmin(userId);

      expect(result).toEqual(expectedUser);
      expect(service.getUser).toHaveBeenCalledWith(userId);
      expect(service.getUser).toHaveBeenCalledTimes(1);
    });

    it('should get user with nullable fields', async () => {
      const userId = 'user-123';
      const expectedUser = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '11999999999',
        document: null,
        rg: null,
        gender: 'M',
        zipCode: null,
        userType: UserType.GUEST,
        city: null,
        country: 'Brasil',
        addressLine: null,
        number: null,
        institution: null,
        isForeign: false,
      };

      mockUserService.getUser.mockResolvedValue(expectedUser);

      const result = await controller.getAdmin(userId);

      expect(result).toEqual(expectedUser);
      expect(result.document).toBeNull();
      expect(result.rg).toBeNull();
    });

    it('should handle not found error', async () => {
      const userId = 'non-existent';

      mockUserService.getUser.mockRejectedValue(new Error('User not found'));

      await expect(controller.getAdmin(userId)).rejects.toThrow('User not found');
    });

    it('should get user with different userTypes', async () => {
      const userId = 'professor-123';
      const expectedUser = {
        name: 'Professor John',
        email: 'prof@example.com',
        phone: '11999999999',
        document: '12345678900',
        rg: '123456789',
        gender: 'M',
        zipCode: '12345-678',
        userType: UserType.PROFESSOR,
        city: 'São Paulo',
        country: 'Brasil',
        addressLine: 'Rua Test',
        number: 123,
        institution: 'University',
        isForeign: false,
      };

      mockUserService.getUser.mockResolvedValue(expectedUser);

      const result = await controller.getAdmin(userId);

      expect(result.userType).toBe(UserType.PROFESSOR);
    });
  });

  describe('updateUser', () => {
    it('should allow guest to update their own profile', async () => {
      const updateDto: UpdateUserFormDto = {
        name: 'Updated Guest',
        phone: '11999999999',
      };

      mockUserService.updateUser.mockResolvedValue(undefined);

      await controller.updateUser(mockUser, updateDto);

      expect(service.updateUser).toHaveBeenCalledWith(mockUser.id, updateDto);
      expect(service.updateUser).toHaveBeenCalledTimes(1);
    });

    it('should allow admin to update their own profile', async () => {
      const updateDto: UpdateUserFormDto = {
        name: 'Updated Admin',
        email: 'newemail@example.com',
      };

      mockUserService.updateUser.mockResolvedValue(undefined);

      await controller.updateUser(mockAdmin, updateDto);

      expect(service.updateUser).toHaveBeenCalledWith(mockAdmin.id, updateDto);
    });

    it('should update user with full profile data', async () => {
      const updateDto: UpdateUserFormDto = {
        name: 'Complete Update',
        email: 'complete@example.com',
        phone: '11999999999',
        document: '98765432100',
        rg: '987654321',
        gender: 'F',
        zipCode: '98765-432',
        userType: UserType.GUEST,
        city: 'Rio de Janeiro',
        country: 'Brasil',
        addressLine: 'Rua Complete',
        number: 456,
        institution: 'New Institution',
        isForeign: false,
      };

      mockUserService.updateUser.mockResolvedValue(undefined);

      await controller.updateUser(mockUser, updateDto);

      expect(service.updateUser).toHaveBeenCalledWith(mockUser.id, updateDto);
    });

    it('should handle errors when updating own profile', async () => {
      const updateDto: UpdateUserFormDto = {
        name: 'Test',
      };

      mockUserService.updateUser.mockRejectedValue(new Error('Update failed'));

      await expect(controller.updateUser(mockUser, updateDto)).rejects.toThrow('Update failed');
    });

    it('should update with empty optional fields', async () => {
      const updateDto: UpdateUserFormDto = {};

      mockUserService.updateUser.mockResolvedValue(undefined);

      await controller.updateUser(mockUser, updateDto);

      expect(service.updateUser).toHaveBeenCalledWith(mockUser.id, updateDto);
    });

    it('should update foreign user information', async () => {
      const updateDto: UpdateUserFormDto = {
        name: 'Foreign User',
        isForeign: true,
        country: 'Argentina',
        institution: 'Foreign University',
      };

      mockUserService.updateUser.mockResolvedValue(undefined);

      await controller.updateUser(mockUser, updateDto);

      expect(service.updateUser).toHaveBeenCalledWith(mockUser.id, updateDto);
    });
  });

  describe('searchUser', () => {
    it('should search users with default params', async () => {
      const searchParams: UserSearchParamsDto = {
        page: 0,
        limit: 10,
        dir: 'asc',
        sort: 'name',
      };

      const expectedResult = {
        page: 0,
        limit: 10,
        total: 2,
        items: [
          {
            id: 'user-1',
            name: 'User One',
            email: 'user1@example.com',
            createdBy: { id: 'admin-1', name: 'Admin One' },
          },
          {
            id: 'user-2',
            name: 'User Two',
            email: 'user2@example.com',
            createdBy: { id: 'admin-1', name: 'Admin One' },
          },
        ],
      };

      mockUserService.searchUser.mockResolvedValue(expectedResult);

      const result = await controller.searchUser(searchParams);

      expect(result).toEqual(expectedResult);
      expect(service.searchUser).toHaveBeenCalledWith(searchParams);
      expect(service.searchUser).toHaveBeenCalledTimes(1);
    });

    it('should search users with name filter', async () => {
      const searchParams: UserSearchParamsDto = {
        page: 0,
        limit: 10,
        dir: 'asc',
        sort: 'name',
        name: 'John',
      };

      const expectedResult = {
        page: 0,
        limit: 10,
        total: 1,
        items: [
          {
            id: 'user-1',
            name: 'John Doe',
            email: 'john@example.com',
            createdBy: { id: 'admin-1', name: 'Admin One' },
          },
        ],
      };

      mockUserService.searchUser.mockResolvedValue(expectedResult);

      const result = await controller.searchUser(searchParams);

      expect(result).toEqual(expectedResult);
      expect(service.searchUser).toHaveBeenCalledWith(searchParams);
    });

    it('should search users with email filter', async () => {
      const searchParams: UserSearchParamsDto = {
        page: 0,
        limit: 10,
        dir: 'asc',
        sort: 'email',
        email: 'test@',
      };

      const expectedResult = {
        page: 0,
        limit: 10,
        total: 1,
        items: [
          {
            id: 'user-1',
            name: 'Test User',
            email: 'test@example.com',
            createdBy: { id: 'admin-1', name: 'Admin One' },
          },
        ],
      };

      mockUserService.searchUser.mockResolvedValue(expectedResult);

      const result = await controller.searchUser(searchParams);

      expect(result).toEqual(expectedResult);
    });

    it('should search users with createdBy filter', async () => {
      const searchParams: UserSearchParamsDto = {
        page: 0,
        limit: 10,
        dir: 'asc',
        sort: 'createdBy',
        createdBy: 'Admin',
      };

      const expectedResult = {
        page: 0,
        limit: 10,
        total: 2,
        items: [
          {
            id: 'user-1',
            name: 'User One',
            email: 'user1@example.com',
            createdBy: { id: 'admin-1', name: 'Admin One' },
          },
          {
            id: 'user-2',
            name: 'User Two',
            email: 'user2@example.com',
            createdBy: { id: 'admin-1', name: 'Admin One' },
          },
        ],
      };

      mockUserService.searchUser.mockResolvedValue(expectedResult);

      const result = await controller.searchUser(searchParams);

      expect(result).toEqual(expectedResult);
    });

    it('should search users with descending order', async () => {
      const searchParams: UserSearchParamsDto = {
        page: 0,
        limit: 10,
        dir: 'desc',
        sort: 'name',
      };

      const expectedResult = {
        page: 0,
        limit: 10,
        total: 2,
        items: [
          {
            id: 'user-2',
            name: 'User Two',
            email: 'user2@example.com',
            createdBy: { id: 'admin-1', name: 'Admin One' },
          },
          {
            id: 'user-1',
            name: 'User One',
            email: 'user1@example.com',
            createdBy: { id: 'admin-1', name: 'Admin One' },
          },
        ],
      };

      mockUserService.searchUser.mockResolvedValue(expectedResult);

      const result = await controller.searchUser(searchParams);

      expect(result).toEqual(expectedResult);
    });

    it('should search users with pagination', async () => {
      const searchParams: UserSearchParamsDto = {
        page: 1,
        limit: 5,
        dir: 'asc',
        sort: 'name',
      };

      const expectedResult = {
        page: 1,
        limit: 5,
        total: 15,
        items: [
          {
            id: 'user-6',
            name: 'User Six',
            email: 'user6@example.com',
            createdBy: { id: 'admin-1', name: 'Admin One' },
          },
        ],
      };

      mockUserService.searchUser.mockResolvedValue(expectedResult);

      const result = await controller.searchUser(searchParams);

      expect(result).toEqual(expectedResult);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(5);
    });

    it('should search users with combined filters', async () => {
      const searchParams: UserSearchParamsDto = {
        page: 0,
        limit: 10,
        dir: 'asc',
        sort: 'name',
        name: 'John',
        email: 'john@',
        createdBy: 'Admin',
      };

      const expectedResult = {
        page: 0,
        limit: 10,
        total: 1,
        items: [
          {
            id: 'user-1',
            name: 'John Doe',
            email: 'john@example.com',
            createdBy: { id: 'admin-1', name: 'Admin One' },
          },
        ],
      };

      mockUserService.searchUser.mockResolvedValue(expectedResult);

      const result = await controller.searchUser(searchParams);

      expect(result).toEqual(expectedResult);
    });

    it('should return empty results when no users match', async () => {
      const searchParams: UserSearchParamsDto = {
        page: 0,
        limit: 10,
        dir: 'asc',
        sort: 'name',
        name: 'NonExistent',
      };

      const expectedResult = {
        page: 0,
        limit: 10,
        total: 0,
        items: [],
      };

      mockUserService.searchUser.mockResolvedValue(expectedResult);

      const result = await controller.searchUser(searchParams);

      expect(result).toEqual(expectedResult);
      expect(result.items).toHaveLength(0);
    });

    it('should search users sorted by email', async () => {
      const searchParams: UserSearchParamsDto = {
        page: 0,
        limit: 10,
        dir: 'asc',
        sort: 'email',
      };

      const expectedResult = {
        page: 0,
        limit: 10,
        total: 2,
        items: [
          {
            id: 'user-1',
            name: 'User A',
            email: 'a@example.com',
            createdBy: { id: 'admin-1', name: 'Admin One' },
          },
          {
            id: 'user-2',
            name: 'User B',
            email: 'b@example.com',
            createdBy: { id: 'admin-1', name: 'Admin One' },
          },
        ],
      };

      mockUserService.searchUser.mockResolvedValue(expectedResult);

      const result = await controller.searchUser(searchParams);

      expect(result).toEqual(expectedResult);
    });

    it('should handle large page numbers', async () => {
      const searchParams: UserSearchParamsDto = {
        page: 100,
        limit: 10,
        dir: 'asc',
        sort: 'name',
      };

      const expectedResult = {
        page: 100,
        limit: 10,
        total: 50,
        items: [],
      };

      mockUserService.searchUser.mockResolvedValue(expectedResult);

      const result = await controller.searchUser(searchParams);

      expect(result.page).toBe(100);
      expect(result.items).toHaveLength(0);
    });

    it('should handle errors when searching users', async () => {
      const searchParams: UserSearchParamsDto = {
        page: 0,
        limit: 10,
        dir: 'asc',
        sort: 'name',
      };

      mockUserService.searchUser.mockRejectedValue(new Error('Database error'));

      await expect(controller.searchUser(searchParams)).rejects.toThrow('Database error');
    });
  });
});
