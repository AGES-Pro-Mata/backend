/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { ExperienceController } from './experience.controller';
import { ExperienceService } from './experience.service';
import {
  CreateExperienceFormDto,
  ExperienceSearchParamsDto,
  GetExperienceFilterDto,
  UpdateExperienceFormDto,
} from './experience.model';
import { Category, TrailDifficulty, WeekDay } from 'generated/prisma';

describe('ExperienceController', () => {
  let controller: ExperienceController;
  let experienceService: jest.Mocked<ExperienceService>;

  beforeEach(async () => {
    const mockExperienceService = {
      getExperience: jest.fn(),
      deleteExperience: jest.fn(),
      toggleExperienceStatus: jest.fn(),
      updateExperience: jest.fn(),
      searchExperience: jest.fn(),
      createExperience: jest.fn(),
      getExperienceFilter: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExperienceController],
      providers: [{ provide: ExperienceService, useValue: mockExperienceService }],
    }).compile();

    controller = module.get<ExperienceController>(ExperienceController);
    experienceService = module.get(ExperienceService);

    jest.clearAllMocks();
  });

  describe('getExperience', () => {
    it('should call experienceService.getExperience with experienceId', async () => {
      const experienceId = '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7';
      const expectedExperience = {
        id: experienceId,
        name: 'Trilha da Cachoeira',
        description: 'Linda trilha até a cachoeira',
        category: Category.TRAIL,
        capacity: 20,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        price: 50.0,
        weekDays: [WeekDay.MONDAY, WeekDay.FRIDAY],
        durationMinutes: 120,
        trailDifficulty: TrailDifficulty.MEDIUM,
        trailLength: 5.5,
        professorShouldPay: false,
        image: {
          url: 'https://example.com/image.jpg',
        },
      };

      experienceService.getExperience.mockResolvedValueOnce(expectedExperience as never);

      const result = await controller.getExperience(experienceId);

      expect(experienceService.getExperience).toHaveBeenCalledWith(experienceId);
      expect(experienceService.getExperience).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedExperience);
    });

    it('should propagate errors from experienceService.getExperience', async () => {
      const experienceId = 'non-existent-id';
      const error = new Error('Experiência não encontrada');

      experienceService.getExperience.mockRejectedValueOnce(error);

      await expect(controller.getExperience(experienceId)).rejects.toThrow(
        'Experiência não encontrada',
      );
    });
  });

  describe('deleteExperience', () => {
    it('should call experienceService.deleteExperience with experienceId', async () => {
      const experienceId = '2c8c5c1b-2f78-52bg-0g1g-5b22g4f9b0g8';

      experienceService.deleteExperience.mockResolvedValueOnce(undefined);

      await controller.deleteExperience(experienceId);

      expect(experienceService.deleteExperience).toHaveBeenCalledWith(experienceId);
      expect(experienceService.deleteExperience).toHaveBeenCalledTimes(1);
    });

    it('should not return any value (NO_CONTENT)', async () => {
      const experienceId = '3d9d6d2c-3g89-63ch-1h2h-6c33h5g0c1h9';

      experienceService.deleteExperience.mockResolvedValueOnce(undefined);

      const result = await controller.deleteExperience(experienceId);

      expect(result).toBeUndefined();
    });

    it('should propagate errors from experienceService.deleteExperience', async () => {
      const experienceId = 'invalid-id';
      const error = new Error('Experiência não encontrada');

      experienceService.deleteExperience.mockRejectedValueOnce(error);

      await expect(controller.deleteExperience(experienceId)).rejects.toThrow(
        'Experiência não encontrada',
      );
    });
  });

  describe('toggleExperienceStatus', () => {
    it('should call experienceService.toggleExperienceStatus with true when active is "true"', async () => {
      const experienceId = '4e0e7e3d-4h90-74di-2i3i-7d44i6h1d2i0';
      const active = 'true';

      experienceService.toggleExperienceStatus.mockResolvedValueOnce(undefined);

      await controller.toggleExperienceStatus(experienceId, active);

      expect(experienceService.toggleExperienceStatus).toHaveBeenCalledWith(experienceId, true);
      expect(experienceService.toggleExperienceStatus).toHaveBeenCalledTimes(1);
    });

    it('should call experienceService.toggleExperienceStatus with false when active is "false"', async () => {
      const experienceId = '5f1f8f4e-5i01-85ej-3j4j-8e55j7i2e3j1';
      const active = 'false';

      experienceService.toggleExperienceStatus.mockResolvedValueOnce(undefined);

      await controller.toggleExperienceStatus(experienceId, active);

      expect(experienceService.toggleExperienceStatus).toHaveBeenCalledWith(experienceId, false);
      expect(experienceService.toggleExperienceStatus).toHaveBeenCalledTimes(1);
    });

    it('should call experienceService.toggleExperienceStatus with false when active is any other string', async () => {
      const experienceId = '6g2g9g5f-6j12-96fk-4k5k-9f66k8j3f4k2';
      const active = 'anything-else';

      experienceService.toggleExperienceStatus.mockResolvedValueOnce(undefined);

      await controller.toggleExperienceStatus(experienceId, active);

      expect(experienceService.toggleExperienceStatus).toHaveBeenCalledWith(experienceId, false);
    });

    it('should not return any value (NO_CONTENT)', async () => {
      const experienceId = '7h3h0h6g-7k23-07gl-5l6l-0g77l9k4g5l3';
      const active = 'true';

      experienceService.toggleExperienceStatus.mockResolvedValueOnce(undefined);

      const result = await controller.toggleExperienceStatus(experienceId, active);

      expect(result).toBeUndefined();
    });
  });

  describe('updateExperienceAsAdmin', () => {
    it('should call experienceService.updateExperience with experienceId, dto and file', async () => {
      const experienceId = '8i4i1i7h-8l34-18hm-6m7m-1h88m0l5h6m4';
      const mockFile = {
        fieldname: 'image',
        originalname: 'trail.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('fake-image-data'),
        size: 12345,
      } as Express.Multer.File;

      const dto: UpdateExperienceFormDto = {
        experienceName: 'Trilha Atualizada',
        experienceDescription: 'Descrição atualizada',
        experienceCategory: Category.TRAIL,
        experienceCapacity: 25,
        experienceStartDate: new Date('2025-02-01'),
        experienceEndDate: new Date('2025-11-30'),
        experiencePrice: 75.0,
        experienceWeekDays: [WeekDay.SATURDAY, WeekDay.SUNDAY],
        trailDurationMinutes: 180,
        trailDifficulty: TrailDifficulty.HARD,
        trailLength: 8.5,
        professorShouldPay: true,
      } as never;

      experienceService.updateExperience.mockResolvedValueOnce(undefined);

      await controller.updateExperienceAsAdmin(experienceId, dto, mockFile);

      expect(experienceService.updateExperience).toHaveBeenCalledWith(experienceId, dto, mockFile);
      expect(experienceService.updateExperience).toHaveBeenCalledTimes(1);
    });

    it('should call experienceService.updateExperience with null file when no file is uploaded', async () => {
      const experienceId = '9j5j2j8i-9m45-29in-7n8n-2i99n1m6i7n5';
      const dto: UpdateExperienceFormDto = {
        experienceName: 'Trilha Sem Imagem',
        experienceDescription: 'Sem upload de imagem',
        experienceCategory: Category.WORKSHOP,
        experienceCapacity: 15,
        experienceStartDate: new Date('2025-03-01'),
        experienceEndDate: new Date('2025-10-31'),
        experiencePrice: 40.0,
        experienceWeekDays: [WeekDay.WEDNESDAY],
        trailDurationMinutes: 90,
        trailDifficulty: TrailDifficulty.EASY,
        trailLength: 3.0,
        professorShouldPay: false,
      } as never;

      experienceService.updateExperience.mockResolvedValueOnce(undefined);

      await controller.updateExperienceAsAdmin(experienceId, dto, null);

      expect(experienceService.updateExperience).toHaveBeenCalledWith(experienceId, dto, null);
    });

    it('should not return any value (NO_CONTENT)', async () => {
      const experienceId = '0k6k3k9j-0n56-30jo-8o9o-3j00o2n7j8o6';
      const dto: UpdateExperienceFormDto = {
        experienceName: 'Test',
        experienceDescription: 'Test',
        experienceCategory: Category.TRAIL,
        experienceCapacity: 10,
        experienceStartDate: new Date(),
        experienceEndDate: new Date(),
        experiencePrice: 0,
        experienceWeekDays: [],
        trailDurationMinutes: 60,
        trailDifficulty: TrailDifficulty.EASY,
        trailLength: 1.0,
        professorShouldPay: false,
      } as never;

      experienceService.updateExperience.mockResolvedValueOnce(undefined);

      const result = await controller.updateExperienceAsAdmin(experienceId, dto, null);

      expect(result).toBeUndefined();
    });
  });

  describe('searchExperience', () => {
    it('should call experienceService.searchExperience with query params', async () => {
      const dto: ExperienceSearchParamsDto = {
        page: 0,
        limit: 10,
        dir: 'asc',
        sort: 'name',
        name: 'Trilha',
        description: 'test@email.com',
        date: new Date('2025-06-15'),
      } as never;

      const expectedResult = {
        page: 0,
        limit: 10,
        total: 1,
        items: [
          {
            id: '1l7l4l0k-1o67-41kp-9p0p-4k11p3o8k9p7',
            name: 'Trilha da Mata',
            description: 'Trilha ecológica',
            startDate: new Date('2025-01-01'),
            endDate: new Date('2025-12-31'),
            active: true,
            category: Category.TRAIL,
            price: 30.0,
          },
        ],
      };

      experienceService.searchExperience.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.searchExperience(dto);

      expect(experienceService.searchExperience).toHaveBeenCalledWith(dto);
      expect(experienceService.searchExperience).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('should return empty items when no experiences match', async () => {
      const dto: ExperienceSearchParamsDto = {
        page: 0,
        limit: 10,
        dir: 'desc',
        sort: 'description',
        name: 'Non-existent',
        description: undefined,
        date: undefined,
      } as never;

      const expectedResult = {
        page: 0,
        limit: 10,
        total: 0,
        items: [],
      };

      experienceService.searchExperience.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.searchExperience(dto);

      expect(result).toEqual(expectedResult);
      expect(result.items).toHaveLength(0);
    });

    it('should handle pagination correctly', async () => {
      const dto: ExperienceSearchParamsDto = {
        page: 2,
        limit: 5,
        dir: 'asc',
        sort: 'startDate',
        name: undefined,
        description: undefined,
        date: undefined,
      } as never;

      const expectedResult = {
        page: 2,
        limit: 5,
        total: 15,
        items: [
          {
            id: '2m8m5m1l-2p78-52lq-0q1q-5l22q4p9l0q8',
            name: 'Experience 11',
            description: 'Description 11',
            startDate: new Date('2025-05-01'),
            endDate: new Date('2025-05-31'),
            active: true,
            category: Category.WORKSHOP,
            price: 100.0,
          },
        ],
      };

      experienceService.searchExperience.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.searchExperience(dto);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
    });
  });

  describe('createExperienceAsAdmin', () => {
    it('should call experienceService.createExperience with dto and file', async () => {
      const mockFile = {
        fieldname: 'image',
        originalname: 'new-trail.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('new-image-data'),
        size: 54321,
      } as Express.Multer.File;

      const dto: CreateExperienceFormDto = {
        experienceName: 'Nova Trilha',
        experienceDescription: 'Descrição da nova trilha',
        experienceCategory: Category.TRAIL,
        experienceCapacity: 30,
        experienceStartDate: new Date('2025-04-01'),
        experienceEndDate: new Date('2025-09-30'),
        experiencePrice: 60.0,
        experienceWeekDays: [WeekDay.MONDAY, WeekDay.WEDNESDAY, WeekDay.FRIDAY],
        trailDurationMinutes: 150,
        trailDifficulty: TrailDifficulty.MEDIUM,
        trailLength: 6.5,
        professorShouldPay: true,
      } as never;

      experienceService.createExperience.mockResolvedValueOnce(undefined);

      await controller.createExperienceAsAdmin(dto, mockFile);

      expect(experienceService.createExperience).toHaveBeenCalledWith(dto, mockFile);
      expect(experienceService.createExperience).toHaveBeenCalledTimes(1);
    });

    it('should call experienceService.createExperience with null file when no file is uploaded', async () => {
      const dto: CreateExperienceFormDto = {
        experienceName: 'Workshop Online',
        experienceDescription: 'Workshop sem necessidade de imagem',
        experienceCategory: Category.WORKSHOP,
        experienceCapacity: 50,
        experienceStartDate: new Date('2025-05-01'),
        experienceEndDate: new Date('2025-08-31'),
        experiencePrice: 0,
        experienceWeekDays: [WeekDay.TUESDAY, WeekDay.THURSDAY],
        trailDurationMinutes: 120,
        trailDifficulty: undefined,
        trailLength: undefined,
        professorShouldPay: false,
      } as never;

      experienceService.createExperience.mockResolvedValueOnce(undefined);

      await controller.createExperienceAsAdmin(dto, null);

      expect(experienceService.createExperience).toHaveBeenCalledWith(dto, null);
    });

    it('should return the result from experienceService.createExperience', async () => {
      const dto: CreateExperienceFormDto = {
        experienceName: 'Experiência Teste',
        experienceDescription: 'Teste de criação',
        experienceCategory: Category.TRAIL,
        experienceCapacity: 20,
        experienceStartDate: new Date('2025-06-01'),
        experienceEndDate: new Date('2025-07-31'),
        experiencePrice: 45.0,
        experienceWeekDays: [WeekDay.SUNDAY],
        trailDurationMinutes: 100,
        trailDifficulty: TrailDifficulty.EASY,
        trailLength: 4.0,
        professorShouldPay: false,
      } as never;

      const expectedResult = {
        id: '3n9n6n2m-3q89-63mr-1r2r-6m33r5q0m1r9',
        name: dto.experienceName,
      };

      experienceService.createExperience.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.createExperienceAsAdmin(dto, null);

      expect(result).toEqual(expectedResult);
    });

    it('should handle minimal required fields', async () => {
      const dto: CreateExperienceFormDto = {
        experienceName: 'Minimal Experience',
        experienceDescription: 'Minimal description',
        experienceCategory: Category.WORKSHOP,
        experienceCapacity: 10,
        experienceStartDate: new Date('2025-01-01'),
        experienceEndDate: new Date('2025-01-31'),
        experiencePrice: undefined,
        experienceWeekDays: undefined,
        trailDurationMinutes: undefined,
        trailDifficulty: undefined,
        trailLength: undefined,
        professorShouldPay: false,
      } as never;

      experienceService.createExperience.mockResolvedValueOnce(undefined);

      await controller.createExperienceAsAdmin(dto, null);

      expect(experienceService.createExperience).toHaveBeenCalledWith(dto, null);
    });
  });

  describe('getExperienceFilter', () => {
    it('should call experienceService.getExperienceFilter with query params', async () => {
      const dto: GetExperienceFilterDto = {
        category: Category.TRAIL,
        search: 'cachoeira',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        page: 0,
        limit: 20,
      } as never;

      const expectedResult = {
        page: 0,
        limit: 20,
        total: 3,
        items: [
          {
            id: '4o0o7o3n-4r90-74ns-2s3s-7n44s6r1n2s0',
            name: 'Trilha da Cachoeira Grande',
            description: 'Trilha até cachoeira de 50m',
            active: true,
            category: Category.TRAIL,
            capacity: 15,
            startDate: new Date('2025-03-01'),
            endDate: new Date('2025-10-31'),
            price: 80.0,
            weekDays: [WeekDay.SATURDAY],
            durationMinutes: 240,
            trailDifficulty: TrailDifficulty.HARD,
            trailLength: 12.0,
            image: {
              url: 'https://example.com/waterfall.jpg',
            },
          },
        ],
      };

      experienceService.getExperienceFilter.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.getExperienceFilter(dto);

      expect(experienceService.getExperienceFilter).toHaveBeenCalledWith(dto);
      expect(experienceService.getExperienceFilter).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('should handle filters without optional parameters', async () => {
      const dto: GetExperienceFilterDto = {
        category: Category.WORKSHOP,
        search: undefined,
        startDate: undefined,
        endDate: undefined,
        page: 0,
        limit: 10,
      } as never;

      const expectedResult = {
        page: 0,
        limit: 10,
        total: 5,
        items: [
          {
            id: '5p1p8p4o-5s01-85ot-3t4t-8o55t7s2o3t1',
            name: 'Workshop de Fotografia',
            description: 'Aprenda técnicas de fotografia',
            active: true,
            category: Category.WORKSHOP,
            capacity: 25,
            startDate: new Date('2025-02-01'),
            endDate: new Date('2025-02-28'),
            price: 150.0,
            weekDays: [WeekDay.MONDAY, WeekDay.WEDNESDAY],
            durationMinutes: 180,
            trailDifficulty: undefined,
            trailLength: undefined,
            image: null,
          },
        ],
      };

      experienceService.getExperienceFilter.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.getExperienceFilter(dto);

      expect(result).toEqual(expectedResult);
    });

    it('should return empty items when no experiences match filters', async () => {
      const dto: GetExperienceFilterDto = {
        category: Category.TRAIL,
        search: 'non-existent-search',
        startDate: new Date('2030-01-01'),
        endDate: new Date('2030-12-31'),
        page: 0,
        limit: 10,
      } as never;

      const expectedResult = {
        page: 0,
        limit: 10,
        total: 0,
        items: [],
      };

      experienceService.getExperienceFilter.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.getExperienceFilter(dto);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle different categories correctly', async () => {
      const dto: GetExperienceFilterDto = {
        category: Category.WORKSHOP,
        search: 'workshop',
        startDate: undefined,
        endDate: undefined,
        page: 1,
        limit: 5,
      } as never;

      const expectedResult = {
        page: 1,
        limit: 5,
        total: 12,
        items: [
          {
            id: '6q2q9q5p-6t12-96pu-4u5u-9p66u8t3p4u2',
            name: 'Workshop de Artesanato',
            description: 'Crie peças únicas',
            active: true,
            category: Category.WORKSHOP,
            capacity: 20,
            startDate: new Date('2025-04-01'),
            endDate: new Date('2025-04-30'),
            price: 120.0,
            weekDays: [WeekDay.FRIDAY],
            durationMinutes: 240,
            trailDifficulty: undefined,
            trailLength: undefined,
            image: {
              url: 'https://example.com/workshop.jpg',
            },
          },
        ],
      };

      experienceService.getExperienceFilter.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.getExperienceFilter(dto);

      expect(result.items[0].category).toBe(Category.WORKSHOP);
    });
  });
});
