import { Test, TestingModule } from '@nestjs/testing';
import { ProfessorService } from './professor.service';
import { DatabaseService } from 'src/database/database.service';
import { ProfessorRequestSearchParamsDto } from './professor.model';
import { RequestType } from 'generated/prisma';

describe('ProfessorService', () => {
  let service: ProfessorService;
  let databaseService: jest.Mocked<Pick<DatabaseService, '$queryRawUnsafe'>>;

  beforeEach(async () => {
    const mockDatabaseService = {
      $queryRawUnsafe: jest.fn(),
    } as unknown as jest.Mocked<Pick<DatabaseService, '$queryRawUnsafe'>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfessorService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<ProfessorService>(ProfessorService);
    databaseService = module.get(DatabaseService);

    jest.clearAllMocks();
  });

  describe('searchRequests', () => {
    it('should query with filters and map results correctly', async () => {
      const dto: ProfessorRequestSearchParamsDto = {
        page: 1,
        limit: 10,
        name: 'John',
        email: 'prof@example.com',
        status: [RequestType.DOCUMENT_APPROVED, RequestType.DOCUMENT_REJECTED],
      } as never;

      const rows = [
        {
          id: 'prof-1',
          name: 'Professor One',
          email: 'prof1@example.com',
          status: RequestType.DOCUMENT_APPROVED,
        },
      ];

      const totalRows = [{ count: BigInt(1) }];

      const rawMock = databaseService.$queryRawUnsafe as jest.Mock;
      rawMock.mockResolvedValueOnce(rows);
      rawMock.mockResolvedValueOnce(totalRows as never);

      const result = await service.searchRequests(dto);

      expect(databaseService.$queryRawUnsafe).toHaveBeenCalledTimes(2);

      const firstCallArgs = rawMock.mock.calls[0];
      expect(firstCallArgs[1]).toBe(dto.name);
      expect(firstCallArgs[2]).toBe(dto.email);
      expect(firstCallArgs[3]).toEqual(dto.status);
      expect(firstCallArgs[4]).toBe(dto.page * dto.limit);
      expect(firstCallArgs[5]).toBe(dto.limit);

      const secondCallArgs = rawMock.mock.calls[1];
      expect(secondCallArgs[1]).toBe(dto.name);
      expect(secondCallArgs[2]).toBe(dto.email);
      expect(secondCallArgs[3]).toEqual(dto.status);

      expect(result).toEqual({
        page: dto.page,
        limit: dto.limit,
        total: 1,
        items: [
          {
            id: 'prof-1',
            name: 'Professor One',
            email: 'prof1@example.com',
            status: RequestType.DOCUMENT_APPROVED,
          },
        ],
      });
    });

    it('should handle empty filters and no results', async () => {
      const dto: ProfessorRequestSearchParamsDto = {
        page: 0,
        limit: 5,
        name: undefined,
        email: undefined,
        status: [],
      } as never;

      const rawMock = databaseService.$queryRawUnsafe as jest.Mock;
      rawMock.mockResolvedValueOnce([]);
      rawMock.mockResolvedValueOnce([]);

      const result = await service.searchRequests(dto);

      const firstCallArgs = rawMock.mock.calls[0];
      expect(firstCallArgs[1]).toBeNull();
      expect(firstCallArgs[2]).toBeNull();
      expect(firstCallArgs[3]).toBeNull();

      expect(result.page).toBe(0);
      expect(result.limit).toBe(5);
      expect(result.total).toBe(0);
      expect(result.items).toEqual([]);
    });
  });
});
