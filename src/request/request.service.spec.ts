import { Test, TestingModule } from '@nestjs/testing';
import { RequestService } from './request.service';
import { DatabaseService } from '../database/database.service';
import { RequestType } from 'generated/prisma';
import type { GetRequestsQueryDto } from './request.model';

describe('RequestService', () => {
  let service: RequestService;
  let databaseService: DatabaseService;

  const mockDatabaseService = {
    reservationGroup: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<RequestService>(RequestService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRequest', () => {
    it('should return paginated requests with default parameters', async () => {
      const query: GetRequestsQueryDto = { page: 1, limit: 10 };

      const mockGroups = [
        {
          id: '1',
          user: { name: 'John Doe', email: 'john@example.com' },
          requests: [{ type: RequestType.CREATED }],
        },
        {
          id: '2',
          user: { name: 'Jane Smith', email: 'jane@example.com' },
          requests: [{ type: RequestType.APPROVED }],
        },
      ];

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue(mockGroups);
      mockDatabaseService.reservationGroup.count.mockResolvedValue(2);

      const result = await service.getRequest(query);

      expect(result).toEqual({
        data: [
          {
            member: { name: 'John Doe', email: 'john@example.com' },
            request: { type: RequestType.CREATED },
          },
          {
            member: { name: 'Jane Smith', email: 'jane@example.com' },
            request: { type: RequestType.APPROVED },
          },
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      expect(mockDatabaseService.reservationGroup.findMany).toHaveBeenCalledWith({
        where: {},
        select: {
          id: true,
          user: { select: { email: true, name: true } },
          requests: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { type: true },
          },
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      expect(mockDatabaseService.reservationGroup.count).toHaveBeenCalledWith({ where: {} });
    });

    it('should filter by single status', async () => {
      const query: GetRequestsQueryDto = {
        page: 1,
        limit: 10,
        status: [RequestType.APPROVED],
      };

      const mockGroups = [
        {
          id: '1',
          user: { name: 'John Doe', email: 'john@example.com' },
          requests: [{ type: RequestType.APPROVED }],
        },
      ];

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue(mockGroups);
      mockDatabaseService.reservationGroup.count.mockResolvedValue(1);

      const result = await service.getRequest(query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].request.type).toBe(RequestType.APPROVED);
      expect(mockDatabaseService.reservationGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            requests: {
              some: {
                type: { in: [RequestType.APPROVED] },
              },
            },
          },
        }),
      );
    });

    it('should filter by multiple statuses', async () => {
      const query: GetRequestsQueryDto = {
        page: 1,
        limit: 10,
        status: [RequestType.CREATED, RequestType.APPROVED, RequestType.REJECTED],
      };

      const mockGroups = [
        {
          id: '1',
          user: { name: 'User 1', email: 'user1@example.com' },
          requests: [{ type: RequestType.CREATED }],
        },
        {
          id: '2',
          user: { name: 'User 2', email: 'user2@example.com' },
          requests: [{ type: RequestType.APPROVED }],
        },
      ];

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue(mockGroups);
      mockDatabaseService.reservationGroup.count.mockResolvedValue(2);

      await service.getRequest(query);

      expect(mockDatabaseService.reservationGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            requests: {
              some: {
                type: { in: [RequestType.CREATED, RequestType.APPROVED, RequestType.REJECTED] },
              },
            },
          },
        }),
      );
    });

    it('should handle pagination correctly', async () => {
      const query: GetRequestsQueryDto = { page: 2, limit: 5 };

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue([]);
      mockDatabaseService.reservationGroup.count.mockResolvedValue(15);

      const result = await service.getRequest(query);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.total).toBe(15);
      expect(result.totalPages).toBe(3);
      expect(mockDatabaseService.reservationGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (page - 1) * limit = (2 - 1) * 5 = 5
          take: 5,
        }),
      );
    });

    it('should handle empty results', async () => {
      const query: GetRequestsQueryDto = { page: 1, limit: 10 };

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue([]);
      mockDatabaseService.reservationGroup.count.mockResolvedValue(0);

      const result = await service.getRequest(query);

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });
    });

    it('should handle missing user data with N/A', async () => {
      const query: GetRequestsQueryDto = { page: 1, limit: 10 };

      const mockGroups = [
        {
          id: '1',
          user: null,
          requests: [{ type: RequestType.CREATED }],
        },
      ];

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue(mockGroups);
      mockDatabaseService.reservationGroup.count.mockResolvedValue(1);

      const result = await service.getRequest(query);

      expect(result.data[0].member).toEqual({
        name: 'N/A',
        email: 'N/A',
      });
    });

    it('should handle missing requests with default CREATED type', async () => {
      const query: GetRequestsQueryDto = { page: 1, limit: 10 };

      const mockGroups = [
        {
          id: '1',
          user: { name: 'John Doe', email: 'john@example.com' },
          requests: [],
        },
      ];

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue(mockGroups);
      mockDatabaseService.reservationGroup.count.mockResolvedValue(1);

      const result = await service.getRequest(query);

      expect(result.data[0].request.type).toBe(RequestType.CREATED);
    });

    it('should calculate totalPages correctly with remainder', async () => {
      const query: GetRequestsQueryDto = { page: 1, limit: 10 };

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue([]);
      mockDatabaseService.reservationGroup.count.mockResolvedValue(25);

      const result = await service.getRequest(query);

      expect(result.totalPages).toBe(3); // Math.ceil(25 / 10)
    });

    it('should handle empty status array as no filter', async () => {
      const query: GetRequestsQueryDto = {
        page: 1,
        limit: 10,
        status: [],
      };

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue([]);
      mockDatabaseService.reservationGroup.count.mockResolvedValue(0);

      await service.getRequest(query);

      expect(mockDatabaseService.reservationGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {}, // status vazio = sem filtro
        }),
      );
    });

    it('should order by createdAt desc and take only the most recent request', async () => {
      const query: GetRequestsQueryDto = { page: 1, limit: 10 };

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue([]);
      mockDatabaseService.reservationGroup.count.mockResolvedValue(0);

      await service.getRequest(query);

      expect(mockDatabaseService.reservationGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            requests: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { type: true },
            },
          }),
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });
});