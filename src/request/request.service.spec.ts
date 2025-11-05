import { Test, TestingModule } from '@nestjs/testing';
import { RequestService } from './request.service';
import { DatabaseService } from '../database/database.service';
import type { GetRequestsQueryDto } from './request.model';
import { RequestType } from '../../generated/prisma';

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
            id: '1',
            member: { name: 'John Doe', email: 'john@example.com' },
            request: { type: RequestType.CREATED },
          },
          {
            id: '2',
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
          skip: 5,
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

      expect(result.totalPages).toBe(3);
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
          where: {},
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

    it('should sort by member name ascending', async () => {
      const query: GetRequestsQueryDto = {
        page: 1,
        limit: 10,
        sort: 'member.name',
        dir: 'asc',
      };

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue([]);
      mockDatabaseService.reservationGroup.count.mockResolvedValue(0);

      await service.getRequest(query);

      expect(mockDatabaseService.reservationGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { user: { name: 'asc' } },
        }),
      );
    });

    it('should sort by member name descending', async () => {
      const query: GetRequestsQueryDto = {
        page: 1,
        limit: 10,
        sort: 'member.name',
        dir: 'desc',
      };

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue([]);
      mockDatabaseService.reservationGroup.count.mockResolvedValue(0);

      await service.getRequest(query);

      expect(mockDatabaseService.reservationGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { user: { name: 'desc' } },
        }),
      );
    });

    it('should sort by member email ascending', async () => {
      const query: GetRequestsQueryDto = {
        page: 1,
        limit: 10,
        sort: 'member.email',
        dir: 'asc',
      };

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue([]);
      mockDatabaseService.reservationGroup.count.mockResolvedValue(0);

      await service.getRequest(query);

      expect(mockDatabaseService.reservationGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { user: { email: 'asc' } },
        }),
      );
    });

    it('should sort by member email descending', async () => {
      const query: GetRequestsQueryDto = {
        page: 1,
        limit: 10,
        sort: 'member.email',
        dir: 'desc',
      };

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue([]);
      mockDatabaseService.reservationGroup.count.mockResolvedValue(0);

      await service.getRequest(query);

      expect(mockDatabaseService.reservationGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { user: { email: 'desc' } },
        }),
      );
    });

    it('should use default ordering when sort is provided without dir', async () => {
      const query: GetRequestsQueryDto = {
        page: 1,
        limit: 10,
        sort: 'member.name',
      };

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue([]);
      mockDatabaseService.reservationGroup.count.mockResolvedValue(0);

      await service.getRequest(query);

      expect(mockDatabaseService.reservationGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should include id in response data', async () => {
      const query: GetRequestsQueryDto = { page: 1, limit: 10 };

      const mockGroups = [
        {
          id: 'unique-id-123',
          user: { name: 'John Doe', email: 'john@example.com' },
          requests: [{ type: RequestType.CREATED }],
        },
      ];

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue(mockGroups);
      mockDatabaseService.reservationGroup.count.mockResolvedValue(1);

      const result = await service.getRequest(query);

      expect(result.data[0].id).toBe('unique-id-123');
    });

    it('should throw error when database findMany fails', async () => {
      const query: GetRequestsQueryDto = { page: 1, limit: 10 };

      mockDatabaseService.reservationGroup.findMany.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(service.getRequest(query)).rejects.toThrow('Database connection failed');
    });

    it('should throw error when database count fails', async () => {
      const query: GetRequestsQueryDto = { page: 1, limit: 10 };

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue([]);
      mockDatabaseService.reservationGroup.count.mockRejectedValue(new Error('Count query failed'));

      await expect(service.getRequest(query)).rejects.toThrow('Count query failed');
    });

    it('should handle database returning undefined for user name', async () => {
      const query: GetRequestsQueryDto = { page: 1, limit: 10 };

      const mockGroups = [
        {
          id: '1',
          user: { name: undefined, email: 'test@example.com' },
          requests: [{ type: RequestType.CREATED }],
        },
      ];

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue(mockGroups);
      mockDatabaseService.reservationGroup.count.mockResolvedValue(1);

      const result = await service.getRequest(query);

      expect(result.data[0].member.name).toBe('N/A');
      expect(result.data[0].member.email).toBe('test@example.com');
    });

    it('should handle database returning undefined for user email', async () => {
      const query: GetRequestsQueryDto = { page: 1, limit: 10 };

      const mockGroups = [
        {
          id: '1',
          user: { name: 'John Doe', email: undefined },
          requests: [{ type: RequestType.CREATED }],
        },
      ];

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue(mockGroups);
      mockDatabaseService.reservationGroup.count.mockResolvedValue(1);

      const result = await service.getRequest(query);

      expect(result.data[0].member.name).toBe('John Doe');
      expect(result.data[0].member.email).toBe('N/A');
    });

    it('should handle status undefined', async () => {
      const query: GetRequestsQueryDto = {
        page: 1,
        limit: 10,
        status: undefined,
      };

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue([]);
      mockDatabaseService.reservationGroup.count.mockResolvedValue(0);

      await service.getRequest(query);

      expect(mockDatabaseService.reservationGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });

    it('should handle status null', async () => {
      const query: GetRequestsQueryDto = {
        page: 1,
        limit: 10,
        status: null as any,
      };

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue([]);
      mockDatabaseService.reservationGroup.count.mockResolvedValue(0);

      await service.getRequest(query);

      expect(mockDatabaseService.reservationGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });

    it('should handle page 0 with default behavior', async () => {
      const query: GetRequestsQueryDto = { page: 0, limit: 10 };

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue([]);
      mockDatabaseService.reservationGroup.count.mockResolvedValue(0);

      const result = await service.getRequest(query);

      expect(mockDatabaseService.reservationGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: -10,
          take: 10,
        }),
      );
      expect(result.page).toBe(0);
    });

    it('should handle limit 0', async () => {
      const query: GetRequestsQueryDto = { page: 1, limit: 0 };

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue([]);
      mockDatabaseService.reservationGroup.count.mockResolvedValue(0);

      const result = await service.getRequest(query);

      expect(mockDatabaseService.reservationGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 0,
        }),
      );
      expect(result.limit).toBe(0);
    });

    it('should handle extremely high page number', async () => {
      const query: GetRequestsQueryDto = { page: 999999, limit: 10 };

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue([]);
      mockDatabaseService.reservationGroup.count.mockResolvedValue(100);

      const result = await service.getRequest(query);

      expect(mockDatabaseService.reservationGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 9999980,
          take: 10,
        }),
      );
      expect(result.page).toBe(999999);
      expect(result.totalPages).toBe(10);
    });

    it('should handle extremely high limit number', async () => {
      const query: GetRequestsQueryDto = { page: 1, limit: 1000 };

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue([]);
      mockDatabaseService.reservationGroup.count.mockResolvedValue(100);

      const result = await service.getRequest(query);

      expect(mockDatabaseService.reservationGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 1000,
        }),
      );
      expect(result.limit).toBe(1000);
      expect(result.totalPages).toBe(1);
    });

    it('should handle invalid sort field and use default ordering', async () => {
      const query: GetRequestsQueryDto = {
        page: 1,
        limit: 10,
        sort: 'invalid.field',
        dir: 'asc',
      };

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue([]);
      mockDatabaseService.reservationGroup.count.mockResolvedValue(0);

      await service.getRequest(query);

      expect(mockDatabaseService.reservationGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should handle sort with random string value', async () => {
      const query: GetRequestsQueryDto = {
        page: 1,
        limit: 10,
        sort: 'randomSortField',
        dir: 'asc',
      };

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue([]);
      mockDatabaseService.reservationGroup.count.mockResolvedValue(0);

      await service.getRequest(query);

      expect(mockDatabaseService.reservationGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should handle sort with empty string', async () => {
      const query: GetRequestsQueryDto = {
        page: 1,
        limit: 10,
        sort: '',
        dir: 'asc',
      };

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue([]);
      mockDatabaseService.reservationGroup.count.mockResolvedValue(0);

      await service.getRequest(query);

      expect(mockDatabaseService.reservationGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should handle sort with special characters', async () => {
      const query: GetRequestsQueryDto = {
        page: 1,
        limit: 10,
        sort: '@#$%^&*()',
        dir: 'asc',
      };

      mockDatabaseService.reservationGroup.findMany.mockResolvedValue([]);
      mockDatabaseService.reservationGroup.count.mockResolvedValue(0);

      await service.getRequest(query);

      expect(mockDatabaseService.reservationGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });
  
  it('should use default pagination values when query is empty', async () => {
    const query = {} as GetRequestsQueryDto; // Nenhum campo definido

    mockDatabaseService.reservationGroup.findMany.mockResolvedValue([]);
    mockDatabaseService.reservationGroup.count.mockResolvedValue(0);

    const result = await service.getRequest(query);

    expect(mockDatabaseService.reservationGroup.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0, // (1 - 1) * 10
        take: 10,
      }),
    );
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.totalPages).toBe(0);
  });
});
