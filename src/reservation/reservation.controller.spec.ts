import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { ReservationController } from './reservation.controller';
import { ReservationService } from './reservation.service';
import { UserType, RequestType } from 'generated/prisma';
import {
  CreateReservationGroupDto,
  UpdateReservationDto,
  UpdateReservationByAdminDto,
  AttachReceiptDto,
  ReservationGroupStatusFilterDto,
  RegisterMemberDto,
} from './reservation.model';
import { CurrentUser } from 'src/auth/auth.model';

describe('ReservationController', () => {
  let controller: ReservationController;
  let service: ReservationService;

  const mockReservationService = {
    createReservationGroup: jest.fn(),
    getReservationGroupByIdAdmin: jest.fn(),
    deleteReservation: jest.fn(),
    getReservationGroups: jest.fn(),
    getReservationGroupById: jest.fn(),
    attachDocument: jest.fn(),
    createDocumentRequest: jest.fn(),
    createRequestAdmin: jest.fn(),
    registerMembers: jest.fn(),
    createCancelRequest: jest.fn(),
    updateReservationByAdmin: jest.fn(),
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
      controllers: [ReservationController],
      providers: [
        {
          provide: ReservationService,
          useValue: mockReservationService,
        },
      ],
    }).compile();

    controller = module.get<ReservationController>(ReservationController);
    service = module.get<ReservationService>(ReservationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createReservationGroup', () => {
    it('should create a reservation group successfully', async () => {
      const createDto: CreateReservationGroupDto = {
        reservations: [
          {
            experienceId: 'exp-123',
            startDate: '2025-12-01T10:00:00Z',
            endDate: '2025-12-01T12:00:00Z',
            membersCount: 2,
            notes: 'Test reservation',
          },
        ],
        members: [
          {
            name: 'John Doe',
            document: '12345678900',
            gender: 'M',
          },
        ],
      };

      const expectedResult = {
        id: 'group-123',
        userId: mockUser.id,
        reservations: [],
        requests: [],
      };

      mockReservationService.createReservationGroup.mockResolvedValue(expectedResult);

      const result = await controller.createReservationGroup(mockUser, createDto);

      expect(result).toEqual(expectedResult);
      expect(service.createReservationGroup).toHaveBeenCalledWith(mockUser.id, createDto);
      expect(service.createReservationGroup).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when creating reservation group', async () => {
      const createDto: CreateReservationGroupDto = {
        reservations: [],
        members: [],
      };

      mockReservationService.createReservationGroup.mockRejectedValue(new Error('Database error'));

      await expect(controller.createReservationGroup(mockUser, createDto)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('getReservationAdmin', () => {
    it('should get reservation group by id for admin', async () => {
      const reservationGroupId = 'group-123';
      const expectedResult = {
        id: reservationGroupId,
        user: { id: 'user-123', name: 'John Doe', email: 'john@example.com' },
        reservations: [],
        requests: [],
      };

      mockReservationService.getReservationGroupByIdAdmin.mockResolvedValue(expectedResult);

      const result = await controller.getReservationAdmin(reservationGroupId);

      expect(result).toEqual(expectedResult);
      expect(service.getReservationGroupByIdAdmin).toHaveBeenCalledWith(reservationGroupId);
      expect(service.getReservationGroupByIdAdmin).toHaveBeenCalledTimes(1);
    });

    it('should handle not found error', async () => {
      const reservationGroupId = 'non-existent';

      mockReservationService.getReservationGroupByIdAdmin.mockResolvedValue(null);

      const result = await controller.getReservationAdmin(reservationGroupId);

      expect(result).toBeNull();
    });
  });

  describe('deleteReservation', () => {
    it('should delete reservation successfully', async () => {
      const reservationGroupId = 'group-123';
      const expectedResult = { id: reservationGroupId, active: false };

      mockReservationService.deleteReservation.mockResolvedValue(expectedResult);

      const result = await controller.deleteReservation(reservationGroupId);

      expect(result).toEqual(expectedResult);
      expect(service.deleteReservation).toHaveBeenCalledWith(reservationGroupId);
      expect(service.deleteReservation).toHaveBeenCalledTimes(1);
    });
  });

  describe('getReservationGroups', () => {
    it('should get all reservation groups for user', async () => {
      const filter: ReservationGroupStatusFilterDto = { status: 'ALL' };
      const expectedResult = [
        {
          id: 'group-1',
          status: RequestType.APPROVED,
          price: 100,
          startDate: new Date('2025-12-01'),
          endDate: new Date('2025-12-02'),
        },
      ];

      mockReservationService.getReservationGroups.mockResolvedValue(expectedResult);

      const result = await controller.getReservationGroups(mockUser, filter);

      expect(result).toEqual(expectedResult);
      expect(service.getReservationGroups).toHaveBeenCalledWith(mockUser.id, filter);
      expect(service.getReservationGroups).toHaveBeenCalledTimes(1);
    });

    it('should get pending reservation groups', async () => {
      const filter: ReservationGroupStatusFilterDto = { status: 'PENDING' };
      const expectedResult = [
        {
          id: 'group-1',
          status: RequestType.CREATED,
          price: 100,
          startDate: new Date('2025-12-01'),
          endDate: new Date('2025-12-02'),
        },
      ];

      mockReservationService.getReservationGroups.mockResolvedValue(expectedResult);

      const result = await controller.getReservationGroups(mockUser, filter);

      expect(result).toEqual(expectedResult);
    });

    it('should get approved reservation groups', async () => {
      const filter: ReservationGroupStatusFilterDto = { status: RequestType.APPROVED };
      const expectedResult = [
        {
          id: 'group-1',
          status: RequestType.APPROVED,
          price: 100,
          startDate: new Date('2025-12-01'),
          endDate: new Date('2025-12-02'),
        },
      ];

      mockReservationService.getReservationGroups.mockResolvedValue(expectedResult);

      const result = await controller.getReservationGroups(mockUser, filter);

      expect(result).toEqual(expectedResult);
    });

    it('should get canceled reservation groups', async () => {
      const filter: ReservationGroupStatusFilterDto = { status: RequestType.CANCELED };
      const expectedResult = [
        {
          id: 'group-1',
          status: RequestType.CANCELED,
          price: 100,
          startDate: new Date('2025-12-01'),
          endDate: new Date('2025-12-02'),
        },
      ];

      mockReservationService.getReservationGroups.mockResolvedValue(expectedResult);

      const result = await controller.getReservationGroups(mockUser, filter);

      expect(result).toEqual(expectedResult);
    });
  });

  describe('getReservationUser', () => {
    it('should get reservation group by id for user', async () => {
      const reservationGroupId = 'group-123';
      const expectedResult = {
        id: reservationGroupId,
        user: { id: mockUser.id, name: 'John Doe', email: mockUser.email },
        reservations: [],
      };

      mockReservationService.getReservationGroupById.mockResolvedValue(expectedResult);

      const result = await controller.getReservationUser(reservationGroupId, mockUser);

      expect(result).toEqual(expectedResult);
      expect(service.getReservationGroupById).toHaveBeenCalledWith(reservationGroupId, mockUser.id);
      expect(service.getReservationGroupById).toHaveBeenCalledTimes(1);
    });

    it('should handle not found for user reservation', async () => {
      const reservationGroupId = 'non-existent';

      mockReservationService.getReservationGroupById.mockRejectedValue(new Error('Not found'));

      await expect(controller.getReservationUser(reservationGroupId, mockUser)).rejects.toThrow(
        'Not found',
      );
    });
  });

  describe('attachReceiptAndRequestApproval', () => {
    it('should attach receipt and create approval request', async () => {
      const reservationGroupId = 'group-123';
      const attachReceiptDto: AttachReceiptDto = {
        url: 'https://example.com/receipt.pdf',
      };

      mockReservationService.attachDocument.mockResolvedValue({
        id: 'doc-123',
        url: attachReceiptDto.url,
      });
      mockReservationService.createDocumentRequest.mockResolvedValue({
        id: 'request-123',
        type: RequestType.DOCUMENT_REQUESTED,
      });

      const result = await controller.attachReceiptAndRequestApproval(
        mockAdmin,
        reservationGroupId,
        attachReceiptDto,
      );

      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
        message: 'Comprovante anexado e solicitação de aprovação enviada.',
      });
      expect(service.attachDocument).toHaveBeenCalledWith(
        reservationGroupId,
        attachReceiptDto.url,
        mockAdmin.id,
      );
      expect(service.createDocumentRequest).toHaveBeenCalledWith(reservationGroupId, mockAdmin.id);
    });

    it('should handle errors when attaching receipt', async () => {
      const reservationGroupId = 'group-123';
      const attachReceiptDto: AttachReceiptDto = {
        url: 'https://example.com/receipt.pdf',
      };

      mockReservationService.attachDocument.mockRejectedValue(new Error('Upload failed'));

      await expect(
        controller.attachReceiptAndRequestApproval(mockAdmin, reservationGroupId, attachReceiptDto),
      ).rejects.toThrow('Upload failed');
    });
  });

  describe('createRequestAdmin', () => {
    it('should create request as admin', async () => {
      const reservationGroupId = 'group-123';
      const updateDto: UpdateReservationDto = {
        type: RequestType.APPROVED,
        description: 'Approved by admin',
      };

      mockReservationService.createRequestAdmin.mockResolvedValue(undefined);

      await controller.createRequestAdmin(mockAdmin, reservationGroupId, updateDto);

      expect(service.createRequestAdmin).toHaveBeenCalledWith(
        reservationGroupId,
        updateDto,
        mockAdmin.id,
      );
      expect(service.createRequestAdmin).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when creating admin request', async () => {
      const reservationGroupId = 'group-123';
      const updateDto: UpdateReservationDto = {
        type: RequestType.APPROVED,
      };

      mockReservationService.createRequestAdmin.mockRejectedValue(new Error('Not found'));

      await expect(
        controller.createRequestAdmin(mockAdmin, reservationGroupId, updateDto),
      ).rejects.toThrow('Not found');
    });
  });

  describe('registerMembers', () => {
    it('should register members successfully', async () => {
      const reservationGroupId = 'group-123';
      const registerMemberDto: RegisterMemberDto[] = [
        {
          name: 'Jane Doe',
          phone: '11999999999',
          document: '98765432100',
          gender: 'F',
        },
      ];

      mockReservationService.registerMembers.mockResolvedValue({ success: true });

      const result = await controller.registerMembers(
        mockUser,
        registerMemberDto,
        reservationGroupId,
      );

      expect(result).toEqual({ success: true });
      expect(service.registerMembers).toHaveBeenCalledWith(
        reservationGroupId,
        mockUser.id,
        registerMemberDto,
      );
      expect(service.registerMembers).toHaveBeenCalledTimes(1);
    });

    it('should register multiple members', async () => {
      const reservationGroupId = 'group-123';
      const registerMemberDto: RegisterMemberDto[] = [
        {
          name: 'Jane Doe',
          phone: '11999999999',
          document: '98765432100',
          gender: 'F',
        },
        {
          name: 'Bob Smith',
          phone: '11988888888',
          document: '11122233344',
          gender: 'M',
        },
      ];

      mockReservationService.registerMembers.mockResolvedValue({ success: true });

      await controller.registerMembers(mockUser, registerMemberDto, reservationGroupId);

      expect(service.registerMembers).toHaveBeenCalledWith(
        reservationGroupId,
        mockUser.id,
        registerMemberDto,
      );
    });
  });

  describe('createCancelReservationRequest', () => {
    it('should create cancel request successfully', async () => {
      const reservationGroupId = 'group-123';

      mockReservationService.createCancelRequest.mockResolvedValue(undefined);

      await controller.createCancelReservationRequest(mockUser, reservationGroupId);

      expect(service.createCancelRequest).toHaveBeenCalledWith(reservationGroupId, mockUser.id);
      expect(service.createCancelRequest).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when creating cancel request', async () => {
      const reservationGroupId = 'non-existent';

      mockReservationService.createCancelRequest.mockRejectedValue(
        new Error('Reservation not found'),
      );

      await expect(
        controller.createCancelReservationRequest(mockUser, reservationGroupId),
      ).rejects.toThrow('Reservation not found');
    });
  });

  describe('requestDocumentApproval', () => {
    it('should request document approval successfully', async () => {
      const reservationGroupId = 'group-123';
      const expectedResult = {
        id: 'request-123',
        type: RequestType.DOCUMENT_REQUESTED,
      };

      mockReservationService.createDocumentRequest.mockResolvedValue(expectedResult);

      const result = await controller.requestDocumentApproval(mockUser, reservationGroupId);

      expect(result).toEqual(expectedResult);
      expect(service.createDocumentRequest).toHaveBeenCalledWith(reservationGroupId, mockUser.id);
      expect(service.createDocumentRequest).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when requesting document approval', async () => {
      const reservationGroupId = 'group-123';

      mockReservationService.createDocumentRequest.mockRejectedValue(new Error('Failed'));

      await expect(
        controller.requestDocumentApproval(mockUser, reservationGroupId),
      ).rejects.toThrow('Failed');
    });
  });

  describe('updateReservationAsAdmin', () => {
    it('should update reservation as admin successfully', async () => {
      const reservationId = 'res-123';
      const updateDto: UpdateReservationByAdminDto = {
        type: RequestType.APPROVED,
        experienceId: 'exp-456',
        startDate: '2025-12-15T10:00:00Z',
        endDate: '2025-12-15T12:00:00Z',
        notes: 'Updated notes',
        price: 150,
      };

      const expectedResult = {
        id: reservationId,
        ...updateDto,
      };

      mockReservationService.updateReservationByAdmin.mockResolvedValue(expectedResult);

      const result = await controller.updateReservationAsAdmin(reservationId, updateDto);

      expect(result).toEqual(expectedResult);
      expect(service.updateReservationByAdmin).toHaveBeenCalledWith(reservationId, updateDto);
      expect(service.updateReservationByAdmin).toHaveBeenCalledTimes(1);
    });

    it('should update reservation with partial data', async () => {
      const reservationId = 'res-123';
      const updateDto: UpdateReservationByAdminDto = {
        type: RequestType.APPROVED,
        notes: 'Just updating notes',
      };

      const expectedResult = {
        id: reservationId,
        notes: updateDto.notes,
      };

      mockReservationService.updateReservationByAdmin.mockResolvedValue(expectedResult);

      const result = await controller.updateReservationAsAdmin(reservationId, updateDto);

      expect(result).toEqual(expectedResult);
    });

    it('should handle not found when updating reservation', async () => {
      const reservationId = 'non-existent';
      const updateDto: UpdateReservationByAdminDto = {
        type: RequestType.APPROVED,
      };

      mockReservationService.updateReservationByAdmin.mockRejectedValue(
        new Error('Reservation not found'),
      );

      await expect(controller.updateReservationAsAdmin(reservationId, updateDto)).rejects.toThrow(
        'Reservation not found',
      );
    });
  });
});
