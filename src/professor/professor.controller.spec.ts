import { Test, TestingModule } from '@nestjs/testing';
import { ProfessorController } from './professor.controller';
import { ProfessorService } from './professor.service';
import { ProfessorRequestSearchParamsDto } from './professor.model';

describe('ProfessorController', () => {
  let controller: ProfessorController;
  let service: jest.Mocked<ProfessorService>;

  beforeEach(async () => {
    const mockProfessorService = {
      searchRequests: jest.fn(),
    } as unknown as jest.Mocked<ProfessorService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfessorController],
      providers: [
        {
          provide: ProfessorService,
          useValue: mockProfessorService,
        },
      ],
    }).compile();

    controller = module.get<ProfessorController>(ProfessorController);
    service = module.get(ProfessorService);

    jest.clearAllMocks();
  });

  describe('searchProfessorsRequests', () => {
    it('should call ProfessorService.searchRequests with query params and return result', async () => {
      const dto: ProfessorRequestSearchParamsDto = {
        page: 0,
        limit: 10,
        name: 'John',
        email: 'john@example.com',
        status: undefined,
      } as never;

      const expectedResult = {
        page: dto.page,
        limit: dto.limit,
        total: 1,
        items: [
          {
            id: 'prof-1',
            name: 'Professor One',
            email: 'john@example.com',
            status: 'DOCUMENT_REQUESTED',
          },
        ],
      };

      service.searchRequests.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.searchProfessorsRequests(dto);

      expect(service.searchRequests).toHaveBeenCalledWith(dto);
      expect(service.searchRequests).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });
  });
});
