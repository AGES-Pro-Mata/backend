/* eslint-disable @typescript-eslint/unbound-method */

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ReservationService } from './reservation.service';
import { DatabaseService } from 'src/database/database.service';
import {
  CreateReservationGroupDto,
  UpdateReservationDto,
  UpdateReservationByAdminDto,
} from './reservation.model';

describe('ReservationService', () => {
  let service: ReservationService;
  let databaseService: jest.Mocked<DatabaseService>;

  beforeEach(async () => {
    const mockDatabaseService = {
      reservation: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      reservationGroup: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findMany: jest.fn(),
      },
      requests: {
        create: jest.fn(),
      },
      document: {
        create: jest.fn(),
      },
      member: {
        createMany: jest.fn(),
      },
      experience: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ReservationService, { provide: DatabaseService, useValue: mockDatabaseService }],
    }).compile();

    service = module.get<ReservationService>(ReservationService);
    databaseService = module.get(DatabaseService);

    jest.clearAllMocks();
  });

  describe('createRequestAdmin', () => {
    const reservationGroupId = '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7';
    const userId = '2c8c5c1b-2f78-52bg-0g1g-5b22g4f9b0g8';

    it('should throw NotFoundException when reservation group does not exist', async () => {
      const dto: UpdateReservationDto = {
        type: 'MODIFICATION_REQUESTED',
        description: 'Test description',
      } as never;

      databaseService.reservation.count.mockResolvedValueOnce(0);

      await expect(service.createRequestAdmin(reservationGroupId, dto, userId)).rejects.toThrow(
        NotFoundException,
      );

      expect(databaseService.reservation.count).toHaveBeenCalledWith({
        where: { id: reservationGroupId },
      });
      expect(databaseService.requests.create).not.toHaveBeenCalled();
    });

    it('should create request when reservation group exists', async () => {
      const dto: UpdateReservationDto = {
        type: 'MODIFICATION_REQUESTED',
        description: 'Update request',
      } as never;

      databaseService.reservation.count.mockResolvedValueOnce(1);
      databaseService.requests.create.mockResolvedValueOnce({} as never);

      await service.createRequestAdmin(reservationGroupId, dto, userId);

      expect(databaseService.reservation.count).toHaveBeenCalledWith({
        where: { id: reservationGroupId },
      });

      expect(databaseService.requests.create).toHaveBeenCalledWith({
        data: {
          description: dto.description,
          type: dto.type,
          reservationGroupId,
          createdByUserId: userId,
        },
      });
    });

    it('should create request without description', async () => {
      const dto: UpdateReservationDto = {
        type: 'CANCELED_REQUESTED',
      } as never;

      databaseService.reservation.count.mockResolvedValueOnce(1);
      databaseService.requests.create.mockResolvedValueOnce({} as never);

      await service.createRequestAdmin(reservationGroupId, dto, userId);

      expect(databaseService.requests.create).toHaveBeenCalledWith({
        data: {
          description: undefined,
          type: dto.type,
          reservationGroupId,
          createdByUserId: userId,
        },
      });
    });
  });

  describe('attachDocument', () => {
    const reservationId = '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7';
    const userId = '2c8c5c1b-2f78-52bg-0g1g-5b22g4f9b0g8';
    const url = 'https://example.com/document.pdf';

    it('should create and return document', async () => {
      const mockDocument = {
        id: 'doc-id',
        url,
        reservationId,
        uploadedByUserId: userId,
        createdAt: new Date(),
      };

      databaseService.document.create.mockResolvedValueOnce(mockDocument as never);

      const result = await service.attachDocument(reservationId, url, userId);

      expect(result).toEqual(mockDocument);
      expect(databaseService.document.create).toHaveBeenCalledWith({
        data: {
          url,
          reservationId,
          uploadedByUserId: userId,
        },
      });
    });
  });

  describe('createDocumentRequest', () => {
    const reservationGroupId = '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7';
    const userId = '2c8c5c1b-2f78-52bg-0g1g-5b22g4f9b0g8';

    it('should create document request', async () => {
      const mockRequest = {
        id: 'request-id',
        type: 'DOCUMENT_REQUESTED',
        createdByUserId: userId,
        reservationGroupId,
      };

      databaseService.requests.create.mockResolvedValueOnce(mockRequest as never);

      const result = await service.createDocumentRequest(reservationGroupId, userId);

      expect(result).toEqual(mockRequest);
      expect(databaseService.requests.create).toHaveBeenCalledWith({
        data: {
          type: 'DOCUMENT_REQUESTED',
          createdByUserId: userId,
          reservationGroupId,
        },
      });
    });
  });

  describe('createCancelRequest', () => {
    const reservationGroupId = '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7';
    const userId = '2c8c5c1b-2f78-52bg-0g1g-5b22g4f9b0g8';

    it('should throw NotFoundException when user does not own reservation', async () => {
      databaseService.reservation.count.mockResolvedValueOnce(0);

      await expect(service.createCancelRequest(reservationGroupId, userId)).rejects.toThrow(
        NotFoundException,
      );

      expect(databaseService.reservation.count).toHaveBeenCalledWith({
        where: {
          id: reservationGroupId,
          userId,
        },
      });
      expect(databaseService.requests.create).not.toHaveBeenCalled();
    });

    it('should create cancel request when user owns reservation', async () => {
      databaseService.reservation.count.mockResolvedValueOnce(1);
      databaseService.requests.create.mockResolvedValueOnce({} as never);

      await service.createCancelRequest(reservationGroupId, userId);

      expect(databaseService.reservation.count).toHaveBeenCalledWith({
        where: {
          id: reservationGroupId,
          userId,
        },
      });

      expect(databaseService.requests.create).toHaveBeenCalledWith({
        data: {
          type: 'CANCELED_REQUESTED',
          reservationGroupId,
          createdByUserId: userId,
        },
      });
    });
  });

  describe('deleteReservation', () => {
    const reservationId = '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7';

    it('should soft delete reservation group by setting active to false', async () => {
      const mockUpdated = {
        id: reservationId,
        active: false,
        userId: 'user-id',
      };

      databaseService.reservationGroup.update.mockResolvedValueOnce(mockUpdated as never);

      const result = await service.deleteReservation(reservationId);

      expect(result).toEqual(mockUpdated);
      expect(databaseService.reservationGroup.update).toHaveBeenCalledWith({
        where: { id: reservationId },
        data: { active: false },
      });
    });
  });

  describe('getReservations', () => {
    const userId = '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7';

    it('should return list of user reservations', async () => {
      const mockReservations = [
        {
          reservations: {
            id: 'res-1',
            startDate: new Date(),
            endDate: new Date(),
            notes: 'Notes',
            user: {
              name: 'John Doe',
              phone: '123456789',
              document: '12345678900',
              gender: 'M',
            },
            experience: {
              name: 'Trail Experience',
              startDate: new Date(),
              endDate: new Date(),
              price: 100,
              capacity: 10,
              trailLength: 5,
              durationMinutes: 120,
            },
          },
        },
      ];

      databaseService.reservationGroup.findMany.mockResolvedValueOnce(mockReservations as never);

      const result = await service.getReservations(userId);

      expect(result).toEqual(mockReservations);
      expect(databaseService.reservationGroup.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: {
          members: true,
          requests: true,
          reservations: {
            select: {
              id: true,
              startDate: true,
              endDate: true,
              notes: true,
              user: {
                select: {
                  name: true,
                  phone: true,
                  document: true,
                  gender: true,
                },
              },
              experience: {
                select: {
                  name: true,
                  startDate: true,
                  endDate: true,
                  price: true,
                  capacity: true,
                  trailLength: true,
                  durationMinutes: true,
                  image: {
                    select: {
                      url: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    });

    it('should return empty array when user has no reservations', async () => {
      databaseService.reservationGroup.findMany.mockResolvedValueOnce([]);

      const result = await service.getReservations(userId);

      expect(result).toEqual([]);
    });
  });

  describe('createReservationGroup', () => {
    const userId = '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7';
    const experienceId = '2c8c5c1b-2f78-52bg-0g1g-5b22g4f9b0g8';
    const groupId = '3d9d6d2c-3g89-63ch-1h2h-6c33h5g0c1h9';

    it('should throw BadRequestException when experiences are not active', async () => {
      const dto: CreateReservationGroupDto = {
        reservations: [
          {
            experienceId,
            startDate: '2025-01-01T10:00:00Z',
            endDate: '2025-01-01T12:00:00Z',
            members: 1,
          },
        ],
        members: [
          {
            name: 'John Doe',
            document: '12345678900',
            gender: 'M',
          },
        ],
      } as never;

      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          experience: {
            findMany: jest.fn().mockResolvedValue([]), // No active experiences
          },
          reservationGroup: {
            create: jest.fn(),
          },
          member: {
            createMany: jest.fn(),
          },
          reservation: {
            create: jest.fn(),
          },
          requests: {
            create: jest.fn(),
          },
        };
        return callback(tx);
      });

      databaseService.$transaction.mockImplementation(mockTransaction as never);

      await expect(service.createReservationGroup(userId, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createReservationGroup(userId, dto)).rejects.toThrow(
        'Uma ou mais experiências não estão ativas.',
      );
    });

    it('should create reservation group with all related entities', async () => {
      const dto: CreateReservationGroupDto = {
        reservations: [
          {
            experienceId,
            startDate: '2025-01-01T10:00:00Z',
            endDate: '2025-01-01T12:00:00Z',
            notes: 'Test notes',
            membersCount: 1,
          },
        ],
        members: [
          {
            name: 'John Doe',
            document: '12345678900',
            gender: 'M',
          },
        ],
      } as never;

      const mockResult = {
        id: groupId,
        userId,
        reservations: [
          {
            id: 'res-1',
            experienceId,
            startDate: new Date('2025-01-01T10:00:00Z'),
            endDate: new Date('2025-01-01T12:00:00Z'),
            notes: 'Test notes',
            membersCount: 1,
            experience: {},
          },
        ],
        requests: [{ type: 'CREATED' }],
      };

      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          experience: {
            findMany: jest.fn().mockResolvedValue([{ id: experienceId }]),
          },
          reservationGroup: {
            create: jest.fn().mockResolvedValue({ id: groupId }),
            findUniqueOrThrow: jest.fn().mockResolvedValue(mockResult),
          },
          member: {
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          reservation: {
            create: jest.fn().mockResolvedValue({ _count: {} }),
          },
          requests: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });

      databaseService.$transaction.mockImplementation(mockTransaction as never);

      const result = await service.createReservationGroup(userId, dto);

      expect(result).toEqual(mockResult);
      expect(databaseService.$transaction).toHaveBeenCalled();
    });

    it('should handle multiple reservations and members', async () => {
      const dto: CreateReservationGroupDto = {
        reservations: [
          {
            experienceId: 'exp-1',
            startDate: '2025-01-01T10:00:00Z',
            endDate: '2025-01-01T12:00:00Z',
            membersCount: 1,
          },
          {
            experienceId: 'exp-2',
            startDate: '2025-01-02T10:00:00Z',
            endDate: '2025-01-02T12:00:00Z',
            membersCount: 1,
          },
        ],
        members: [
          {
            name: 'Member 1',
            document: '11111111111',
            gender: 'M',
          },
          {
            name: 'Member 2',
            document: '22222222222',
            gender: 'F',
          },
        ],
      } as never;

      const mockTransaction = jest.fn(async (callback) => {
        const tx = {
          experience: {
            findMany: jest.fn().mockResolvedValue([{ id: 'exp-1' }, { id: 'exp-2' }]),
          },
          reservationGroup: {
            create: jest.fn().mockResolvedValue({ id: groupId }),
            findUniqueOrThrow: jest.fn().mockResolvedValue({ id: groupId }),
          },
          member: {
            createMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
          reservation: {
            create: jest.fn().mockResolvedValue({ _count: {} }),
          },
          requests: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });

      databaseService.$transaction.mockImplementation(mockTransaction as never);

      await service.createReservationGroup(userId, dto);

      expect(databaseService.$transaction).toHaveBeenCalled();
    });
  });

  describe('getReservationGroupByIdAdmin', () => {
    const reservationGroupId = '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7';

    it('should return reservation group with all details for admin', async () => {
      const mockGroup = {
        id: reservationGroupId,
        user: {
          id: 'user-id',
          name: 'John Doe',
          email: 'john@example.com',
        },
        reservations: [
          {
            membersCount: 1,
            notes: 'Notes',
            experience: {
              id: 'exp-1',
              name: 'Experience',
            },
          },
        ],
        requests: [
          {
            id: 'req-1',
            type: 'CREATED',
          },
        ],
      };

      databaseService.reservationGroup.findUnique.mockResolvedValueOnce(mockGroup as never);

      const result = await service.getReservationGroupByIdAdmin(reservationGroupId);

      expect(result).toEqual(mockGroup);
      expect(databaseService.reservationGroup.findUnique).toHaveBeenCalledWith({
        where: { id: reservationGroupId },
        select: {
          id: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reservations: {
            select: {
              membersCount: true,
              notes: true,
              experience: {
                omit: {
                  imageId: true,
                  active: true,
                },
              },
            },
          },
          requests: {
            omit: {
              createdAt: true,
              createdByUserId: true,
              reservationGroupId: true,
            },
          },
        },
      });
    });

    it('should return null when reservation group does not exist', async () => {
      databaseService.reservationGroup.findUnique.mockResolvedValueOnce(null);

      const result = await service.getReservationGroupByIdAdmin(reservationGroupId);

      expect(result).toBeNull();
    });
  });

  describe('getReservationGroupById', () => {
    const reservationGroupId = '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7';
    const userId = '2c8c5c1b-2f78-52bg-0g1g-5b22g4f9b0g8';

    it('should throw NotFoundException when reservation group not found', async () => {
      databaseService.reservationGroup.findUnique.mockResolvedValueOnce(null);

      await expect(service.getReservationGroupById(reservationGroupId, userId)).rejects.toThrow(
        NotFoundException,
      );

      expect(databaseService.reservationGroup.findUnique).toHaveBeenCalledWith({
        where: { id: reservationGroupId, userId },
        select: {
          id: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reservations: {
            select: {
              membersCount: true,
              notes: true,
              experience: {
                omit: {
                  imageId: true,
                  active: true,
                },
              },
            },
          },
        },
      });
    });

    it('should return reservation group when user owns it', async () => {
      const mockGroup = {
        id: reservationGroupId,
        user: {
          id: userId,
          name: 'John Doe',
          email: 'john@example.com',
        },
        reservations: [],
      };

      databaseService.reservationGroup.findUnique.mockResolvedValueOnce(mockGroup as never);

      const result = await service.getReservationGroupById(reservationGroupId, userId);

      expect(result).toEqual(mockGroup);
    });
  });

  describe('updateReservationByAdmin', () => {
    const reservationId = '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7';

    it('should throw NotFoundException when reservation does not exist', async () => {
      const dto: UpdateReservationByAdminDto = {
        experienceId: 'exp-id',
        startDate: '2025-01-01T10:00:00Z',
        endDate: '2025-01-01T12:00:00Z',
      } as never;

      databaseService.reservation.findUnique.mockResolvedValueOnce(null);

      await expect(service.updateReservationByAdmin(reservationId, dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.updateReservationByAdmin(reservationId, dto)).rejects.toThrow(
        'Reservation not found',
      );

      expect(databaseService.reservation.update).not.toHaveBeenCalled();
    });

    it('should update reservation with all fields', async () => {
      const dto: UpdateReservationByAdminDto = {
        type: 'MODIFICATION_REQUESTED',
        description: 'Updated',
        experienceId: 'new-exp-id',
        startDate: '2025-01-01T10:00:00Z',
        endDate: '2025-01-01T12:00:00Z',
        notes: 'New notes',
      } as never;

      const mockExisting = {
        id: reservationId,
        experienceId: 'old-exp-id',
      };

      const mockUpdated = {
        ...mockExisting,
        experienceId: dto.experienceId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        notes: dto.notes,
      };

      databaseService.reservation.findUnique.mockResolvedValueOnce(mockExisting as never);
      databaseService.reservation.update.mockResolvedValueOnce(mockUpdated as never);

      const result = await service.updateReservationByAdmin(reservationId, dto);

      expect(result).toEqual(mockUpdated);
      expect(databaseService.reservation.update).toHaveBeenCalledWith({
        where: { id: reservationId },
        data: {
          experienceId: dto.experienceId,
          startDate: dto.startDate,
          endDate: dto.endDate,
          notes: dto.notes,
        },
      });
    });

    it('should update reservation with partial fields', async () => {
      const dto: UpdateReservationByAdminDto = {
        type: 'MODIFICATION_REQUESTED',
        notes: 'Only notes updated',
      } as never;

      const mockExisting = {
        id: reservationId,
        notes: 'Old notes',
      };

      const mockUpdated = {
        ...mockExisting,
        notes: dto.notes,
      };

      databaseService.reservation.findUnique.mockResolvedValueOnce(mockExisting as never);
      databaseService.reservation.update.mockResolvedValueOnce(mockUpdated as never);

      const result = await service.updateReservationByAdmin(reservationId, dto);

      expect(result).toEqual(mockUpdated);
      expect(databaseService.reservation.update).toHaveBeenCalledWith({
        where: { id: reservationId },
        data: {
          experienceId: undefined,
          startDate: undefined,
          endDate: undefined,
          notes: dto.notes,
        },
      });
    });
  });
});
