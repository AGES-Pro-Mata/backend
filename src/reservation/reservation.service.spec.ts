import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { DatabaseService } from 'src/database/database.service';
import { RequestType } from 'generated/prisma';
import {
  CreateReservationGroupDto,
  UpdateReservationDto,
  UpdateReservationByAdminDto,
  ReservationGroupStatusFilterDto,
  RegisterMemberDto,
} from './reservation.model';
import { Decimal } from '@prisma/client/runtime/library';

describe('ReservationService', () => {
  let service: ReservationService;
  let databaseService: DatabaseService;

  const mockDatabaseService = {
    reservation: {
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    requests: {
      create: jest.fn(),
    },
    document: {
      create: jest.fn(),
    },
    reservationGroup: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    experience: {
      findMany: jest.fn(),
    },
    member: {
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<ReservationService>(ReservationService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createRequestAdmin', () => {
    it('should create request successfully', async () => {
      const reservationGroupId = 'group-123';
      const userId = 'user-123';
      const updateDto: UpdateReservationDto = {
        type: RequestType.APPROVED,
        description: 'Approved by admin',
      };

      mockDatabaseService.reservation.count.mockResolvedValue(1);
      mockDatabaseService.requests.create.mockResolvedValue({
        id: 'request-123',
        ...updateDto,
      });

      await service.createRequestAdmin(reservationGroupId, updateDto, userId);

      expect(databaseService.reservation.count).toHaveBeenCalledWith({
        where: { id: reservationGroupId },
      });
      expect(databaseService.requests.create).toHaveBeenCalledWith({
        data: {
          description: updateDto.description,
          type: updateDto.type,
          reservationGroupId,
          createdByUserId: userId,
        },
      });
    });

    it('should throw NotFoundException when reservation does not exist', async () => {
      const reservationGroupId = 'non-existent';
      const userId = 'user-123';
      const updateDto: UpdateReservationDto = {
        type: RequestType.APPROVED,
      };

      mockDatabaseService.reservation.count.mockResolvedValue(0);

      await expect(
        service.createRequestAdmin(reservationGroupId, updateDto, userId),
      ).rejects.toThrow(NotFoundException);

      expect(databaseService.reservation.count).toHaveBeenCalled();
      expect(databaseService.requests.create).not.toHaveBeenCalled();
    });
  });

  describe('attachDocument', () => {
    it('should attach document successfully', async () => {
      const reservationId = 'res-123';
      const url = 'https://example.com/receipt.pdf';
      const userId = 'user-123';

      const expectedDocument = {
        id: 'doc-123',
        url,
        reservationId,
        uploadedByUserId: userId,
      };

      mockDatabaseService.document.create.mockResolvedValue(expectedDocument);

      const result = await service.attachDocument(reservationId, url, userId);

      expect(result).toEqual(expectedDocument);
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
    it('should create document request successfully', async () => {
      const reservationGroupId = 'group-123';
      const userId = 'user-123';

      const expectedRequest = {
        id: 'request-123',
        type: RequestType.DOCUMENT_REQUESTED,
        reservationGroupId,
        createdByUserId: userId,
      };

      mockDatabaseService.requests.create.mockResolvedValue(expectedRequest);

      const result = await service.createDocumentRequest(reservationGroupId, userId);

      expect(result).toEqual(expectedRequest);
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
    it('should create CANCELED_REQUESTED when last request is APPROVED', async () => {
      const reservationGroupId = 'group-123';
      const userId = 'user-123';

      mockDatabaseService.reservationGroup.findUnique.mockResolvedValue({
        id: reservationGroupId,
        requests: [{ type: RequestType.APPROVED }],
      });

      mockDatabaseService.requests.create.mockResolvedValue({
        id: 'request-123',
        type: RequestType.CANCELED_REQUESTED,
      });

      await service.createCancelRequest(reservationGroupId, userId);

      expect(databaseService.requests.create).toHaveBeenCalledWith({
        data: {
          type: RequestType.CANCELED_REQUESTED,
          reservationGroupId,
          createdByUserId: userId,
        },
      });
    });
  });

  describe('deleteReservation', () => {
    it('should soft delete reservation by setting active to false', async () => {
      const reservationId = 'res-123';

      const expectedResult = {
        id: reservationId,
        active: false,
      };

      mockDatabaseService.reservationGroup.update.mockResolvedValue(expectedResult);

      const result = await service.deleteReservation(reservationId);

      expect(result).toEqual(expectedResult);
      expect(databaseService.reservationGroup.update).toHaveBeenCalledWith({
        where: { id: reservationId },
        data: { active: false },
      });
    });
  });

  describe('getReservationGroups', () => {
    const mockReservationGroups = [
      {
        id: 'group-1',
        members: [],
        requests: [
          {
            type: RequestType.APPROVED,
            createdAt: new Date('2025-11-10T10:00:00Z'),
          },
        ],
        reservations: [
          {
            id: 'res-1',
            startDate: new Date('2025-12-01T10:00:00Z'),
            endDate: new Date('2025-12-01T12:00:00Z'),
            notes: 'Test',
            membersCount: 2,
            user: {
              name: 'John Doe',
              phone: '11999999999',
              document: '12345678900',
              gender: 'M',
            },
            experience: {
              name: 'Experience 1',
              startDate: new Date('2025-12-01'),
              endDate: new Date('2025-12-31'),
              price: new Decimal(100),
              capacity: 10,
              trailLength: 5,
              durationMinutes: 120,
              image: { url: 'https://example.com/image.jpg' },
            },
          },
        ],
      },
      {
        id: 'group-2',
        members: [],
        requests: [
          {
            type: RequestType.CREATED,
            createdAt: new Date('2025-11-12T10:00:00Z'),
          },
        ],
        reservations: [
          {
            id: 'res-2',
            startDate: new Date('2025-12-15T10:00:00Z'),
            endDate: new Date('2025-12-15T12:00:00Z'),
            notes: null,
            membersCount: 3,
            user: {
              name: 'Jane Doe',
              phone: '11988888888',
              document: '98765432100',
              gender: 'F',
            },
            experience: {
              name: 'Experience 2',
              startDate: new Date('2025-12-01'),
              endDate: new Date('2025-12-31'),
              price: new Decimal(150),
              capacity: 8,
              trailLength: 3,
              durationMinutes: 90,
              image: { url: 'https://example.com/image2.jpg' },
            },
          },
        ],
      },
    ];

    it('should get all reservation groups with ALL filter', async () => {
      const userId = 'user-123';
      const filter: ReservationGroupStatusFilterDto = { status: 'ALL' };

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue(mockReservationGroups);

      const result = await service.getReservationGroups(userId, filter);

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe(RequestType.CREATED);
      expect(result[1].status).toBe(RequestType.APPROVED);
      expect(result[0].price).toBeInstanceOf(Decimal);
      expect(databaseService.reservationGroup.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          requests: {
            some: {},
          },
        },
        select: expect.any(Object),
      });
    });

    it('should filter PENDING reservation groups', async () => {
      const userId = 'user-123';
      const filter: ReservationGroupStatusFilterDto = { status: 'PENDING' };

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue(mockReservationGroups);

      const result = await service.getReservationGroups(userId, filter);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(RequestType.CREATED);
    });

    it('should filter APPROVED reservation groups', async () => {
      const userId = 'user-123';
      const filter: ReservationGroupStatusFilterDto = { status: RequestType.APPROVED };

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue(mockReservationGroups);

      const result = await service.getReservationGroups(userId, filter);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(RequestType.APPROVED);
    });

    it('should filter CANCELED reservation groups', async () => {
      const userId = 'user-123';
      const filter: ReservationGroupStatusFilterDto = { status: RequestType.CANCELED };

      const canceledGroup = [
        {
          ...mockReservationGroups[0],
          requests: [
            {
              type: RequestType.CANCELED,
              createdAt: new Date('2025-11-10T10:00:00Z'),
            },
          ],
        },
      ];

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue(canceledGroup);

      const result = await service.getReservationGroups(userId, filter);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(RequestType.CANCELED);
    });

    it('should sort by startDate descending', async () => {
      const userId = 'user-123';
      const filter: ReservationGroupStatusFilterDto = { status: 'ALL' };

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue(mockReservationGroups);

      const result = await service.getReservationGroups(userId, filter);

      expect(result[0].startDate.getTime()).toBeGreaterThan(result[1].startDate.getTime());
    });

    it('should calculate total price correctly', async () => {
      const userId = 'user-123';
      const filter: ReservationGroupStatusFilterDto = { status: 'ALL' };

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue(mockReservationGroups);

      const result = await service.getReservationGroups(userId, filter);

      // group-1: 100 * 2 = 200
      expect(result[1].price.toNumber()).toBe(200);
      // group-2: 150 * 3 = 450
      expect(result[0].price.toNumber()).toBe(450);
    });

    it('should filter out groups without status', async () => {
      const userId = 'user-123';
      const filter: ReservationGroupStatusFilterDto = { status: 'ALL' };

      const groupsWithoutStatus = [
        {
          ...mockReservationGroups[0],
          requests: [],
        },
      ];

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue(groupsWithoutStatus);

      await expect(service.getReservationGroups(userId, filter)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should handle multiple requests and pick the latest', async () => {
      const userId = 'user-123';
      const filter: ReservationGroupStatusFilterDto = { status: 'ALL' };

      const groupWithMultipleRequests = [
        {
          ...mockReservationGroups[0],
          requests: [
            {
              type: RequestType.CREATED,
              createdAt: new Date('2025-11-01T10:00:00Z'),
            },
            {
              type: RequestType.PAYMENT_REQUESTED,
              createdAt: new Date('2025-11-05T10:00:00Z'),
            },
            {
              type: RequestType.APPROVED,
              createdAt: new Date('2025-11-10T10:00:00Z'),
            },
          ],
        },
      ];

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue(groupWithMultipleRequests);

      const result = await service.getReservationGroups(userId, filter);

      expect(result[0].status).toBe(RequestType.APPROVED);
    });

    it('should handle reservations without prices', async () => {
      const userId = 'user-123';
      const filter: ReservationGroupStatusFilterDto = { status: 'ALL' };

      const groupWithoutPrice = [
        {
          ...mockReservationGroups[0],
          reservations: [
            {
              ...mockReservationGroups[0].reservations[0],
              experience: {
                ...mockReservationGroups[0].reservations[0].experience,
                price: null,
              },
            },
          ],
        },
      ];

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue(groupWithoutPrice);

      const result = await service.getReservationGroups(userId, filter);

      expect(result[0].price.toNumber()).toBe(0);
    });
  });

  describe('createReservationGroup', () => {
    it('should create reservation group successfully', async () => {
      const userId = 'user-123';
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

      const mockTransaction = async (callback: any) => {
        const tx = {
          experience: {
            findMany: jest.fn().mockResolvedValue([{ id: 'exp-123' }]),
          },
          reservationGroup: {
            create: jest.fn().mockResolvedValue({ id: 'group-123' }),
            findUniqueOrThrow: jest.fn().mockResolvedValue({
              id: 'group-123',
              reservations: [],
              requests: [],
            }),
          },
          member: {
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
          reservation: {
            create: jest.fn().mockResolvedValue({ _count: {} }),
          },
          requests: {
            create: jest.fn().mockResolvedValue({
              id: 'request-123',
              type: RequestType.CREATED,
            }),
          },
        };
        return callback(tx);
      };

      mockDatabaseService.$transaction.mockImplementation(mockTransaction);

      const result = await service.createReservationGroup(userId, createDto);

      expect(result).toBeDefined();
      expect(result.id).toBe('group-123');
      expect(databaseService.$transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException when experience is not active', async () => {
      const userId = 'user-123';
      const createDto: CreateReservationGroupDto = {
        reservations: [
          {
            experienceId: 'exp-inactive',
            startDate: '2025-12-01T10:00:00Z',
            endDate: '2025-12-01T12:00:00Z',
            membersCount: 2,
          },
        ],
        members: [],
      };

      const mockTransaction = async (callback: any) => {
        const tx = {
          experience: {
            findMany: jest.fn().mockResolvedValue([]),
          },
        };
        return callback(tx);
      };

      mockDatabaseService.$transaction.mockImplementation(mockTransaction);

      await expect(service.createReservationGroup(userId, createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createReservationGroup(userId, createDto)).rejects.toThrow(
        'Uma ou mais experiências não estão ativas.',
      );
    });

    it('should create multiple reservations and members', async () => {
      const userId = 'user-123';
      const createDto: CreateReservationGroupDto = {
        reservations: [
          {
            experienceId: 'exp-1',
            startDate: '2025-12-01T10:00:00Z',
            endDate: '2025-12-01T12:00:00Z',
            membersCount: 2,
          },
          {
            experienceId: 'exp-2',
            startDate: '2025-12-02T10:00:00Z',
            endDate: '2025-12-02T12:00:00Z',
            membersCount: 3,
          },
        ],
        members: [
          { name: 'John Doe', document: '111', gender: 'M' },
          { name: 'Jane Doe', document: '222', gender: 'F' },
        ],
      };

      const mockTransaction = async (callback: any) => {
        const tx = {
          experience: {
            findMany: jest.fn().mockResolvedValue([{ id: 'exp-1' }, { id: 'exp-2' }]),
          },
          reservationGroup: {
            create: jest.fn().mockResolvedValue({ id: 'group-123' }),
            findUniqueOrThrow: jest.fn().mockResolvedValue({
              id: 'group-123',
              reservations: [],
              requests: [],
            }),
          },
          member: {
            createMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
          reservation: {
            create: jest.fn().mockResolvedValue({ _count: {} }),
          },
          requests: {
            create: jest.fn().mockResolvedValue({
              id: 'request-123',
              type: RequestType.CREATED,
            }),
          },
        };
        return callback(tx);
      };

      mockDatabaseService.$transaction.mockImplementation(mockTransaction);

      const result = await service.createReservationGroup(userId, createDto);

      expect(result).toBeDefined();
    });
  });

  describe('getReservationGroupByIdAdmin', () => {
    it('should get reservation group by id for admin', async () => {
      const reservationGroupId = 'group-123';

      const expectedResult = {
        id: reservationGroupId,
        user: {
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
        },
        reservations: [],
        requests: [],
      };

      mockDatabaseService.reservationGroup.findUnique.mockResolvedValue(expectedResult);

      const result = await service.getReservationGroupByIdAdmin(reservationGroupId);

      expect(result).toEqual(expectedResult);
      expect(databaseService.reservationGroup.findUnique).toHaveBeenCalledWith({
        where: { id: reservationGroupId },
        select: expect.any(Object),
      });
    });

    it('should return null when reservation group not found', async () => {
      const reservationGroupId = 'non-existent';

      mockDatabaseService.reservationGroup.findUnique.mockResolvedValue(null);

      const result = await service.getReservationGroupByIdAdmin(reservationGroupId);

      expect(result).toBeNull();
    });
  });

  describe('getReservationGroupById', () => {
    it('should get reservation group by id for user', async () => {
      const reservationGroupId = 'group-123';
      const userId = 'user-123';

      const expectedResult = {
        id: reservationGroupId,
        user: {
          id: userId,
          name: 'John Doe',
          email: 'john@example.com',
        },
        reservations: [],
      };

      mockDatabaseService.reservationGroup.findUnique.mockResolvedValue(expectedResult);

      const result = await service.getReservationGroupById(reservationGroupId, userId);

      expect(result).toEqual(expectedResult);
      expect(databaseService.reservationGroup.findUnique).toHaveBeenCalledWith({
        where: { id: reservationGroupId, userId },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when reservation group not found', async () => {
      const reservationGroupId = 'non-existent';
      const userId = 'user-123';

      mockDatabaseService.reservationGroup.findUnique.mockResolvedValue(null);

      await expect(service.getReservationGroupById(reservationGroupId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateReservationByAdmin', () => {
    it('should update reservation successfully', async () => {
      const reservationId = 'res-123';
      const updateDto: UpdateReservationByAdminDto = {
        type: RequestType.APPROVED,
        experienceId: 'exp-456',
        startDate: '2025-12-15T10:00:00Z',
        endDate: '2025-12-15T12:00:00Z',
        price: 150,
      };

      mockDatabaseService.reservation.findUnique.mockResolvedValue({
        id: reservationId,
      });

      mockDatabaseService.reservation.update.mockResolvedValue({
        id: reservationId,
        ...updateDto,
      });

      const result = await service.updateReservationByAdmin(reservationId, updateDto);

      expect(result).toBeDefined();
      expect(result.id).toBe(reservationId);
      expect(databaseService.reservation.findUnique).toHaveBeenCalledWith({
        where: { id: reservationId },
      });
      expect(databaseService.reservation.update).toHaveBeenCalledWith({
        where: { id: reservationId },
        data: {
          experienceId: updateDto.experienceId,
          startDate: updateDto.startDate,
          endDate: updateDto.endDate,
          price: updateDto.price,
        },
      });
    });

    it('should throw NotFoundException when reservation not found', async () => {
      const reservationId = 'non-existent';
      const updateDto: UpdateReservationByAdminDto = {
        type: RequestType.APPROVED,
      };

      mockDatabaseService.reservation.findUnique.mockResolvedValue(null);

      await expect(service.updateReservationByAdmin(reservationId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.updateReservationByAdmin(reservationId, updateDto)).rejects.toThrow(
        'Reservation not found',
      );
    });

    it('should update reservation with partial data', async () => {
      const reservationId = 'res-123';
      const updateDto: UpdateReservationByAdminDto = {
        type: RequestType.APPROVED,
        notes: 'Just updating notes',
      };

      mockDatabaseService.reservation.findUnique.mockResolvedValue({
        id: reservationId,
      });

      mockDatabaseService.reservation.update.mockResolvedValue({
        id: reservationId,
        notes: updateDto.notes,
      });

      const result = await service.updateReservationByAdmin(reservationId, updateDto);

      expect(result.notes).toBe(updateDto.notes);
    });
  });

  describe('registerMembers', () => {
    it('should register members successfully', async () => {
      const reservationGroupId = 'group-123';
      const userId = 'user-123';
      const registerMemberDto: RegisterMemberDto[] = [
        {
          name: 'Jane Doe',
          phone: '11999999999',
          document: '98765432100',
          gender: 'F',
        },
      ];

      mockDatabaseService.reservationGroup.update.mockResolvedValue({
        id: reservationGroupId,
      });

      await service.registerMembers(reservationGroupId, userId, registerMemberDto);

      expect(databaseService.reservationGroup.update).toHaveBeenCalledWith({
        where: {
          id: reservationGroupId,
          userId,
        },
        data: {
          requests: {
            create: {
              type: 'PAYMENT_REQUESTED',
              createdByUserId: userId,
            },
          },
          members: {
            createMany: {
              data: registerMemberDto,
            },
          },
        },
      });
    });

    it('should register multiple members', async () => {
      const reservationGroupId = 'group-123';
      const userId = 'user-123';
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

      mockDatabaseService.reservationGroup.update.mockResolvedValue({
        id: reservationGroupId,
      });

      await service.registerMembers(reservationGroupId, userId, registerMemberDto);

      expect(databaseService.reservationGroup.update).toHaveBeenCalledWith({
        where: {
          id: reservationGroupId,
          userId,
        },
        data: {
          requests: {
            create: {
              type: 'PAYMENT_REQUESTED',
              createdByUserId: userId,
            },
          },
          members: {
            createMany: {
              data: registerMemberDto,
            },
          },
        },
      });
    });
  });
});
