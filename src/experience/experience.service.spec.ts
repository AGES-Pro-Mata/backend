/* eslint-disable @typescript-eslint/unbound-method */

import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ExperienceService } from './experience.service';
import { DatabaseService } from 'src/database/database.service';
import {
  CreateExperienceFormDto,
  UpdateExperienceFormDto,
  ExperienceSearchParamsDto,
} from './experience.model';

describe('ExperienceService', () => {
  let service: ExperienceService;
  let databaseService: jest.Mocked<DatabaseService>;

  beforeEach(async () => {
    const mockDatabaseService = {
      experience: {
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      image: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ExperienceService, { provide: DatabaseService, useValue: mockDatabaseService }],
    }).compile();

    service = module.get<ExperienceService>(ExperienceService);
    databaseService = module.get(DatabaseService);

    jest.clearAllMocks();
  });

  describe('deleteExperience', () => {
    const experienceId = '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7';

    it('should soft delete experience by setting active to false', async () => {
      databaseService.experience.update.mockResolvedValueOnce({} as never);

      await service.deleteExperience(experienceId);

      expect(databaseService.experience.update).toHaveBeenCalledWith({
        where: { id: experienceId },
        data: { active: false },
      });
    });
  });

  describe('updateExperience', () => {
    const experienceId = '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7';
    const imageId = '2c8c5c1b-2f78-52bg-0g1g-5b22g4f9b0g8';

    it('should throw BadRequestException when image does not exist', async () => {
      const dto: UpdateExperienceFormDto = {
        experienceName: 'Updated Experience',
        experienceImage: 'https://example.com/image.jpg',
      } as never;

      databaseService.image.findUnique.mockResolvedValueOnce(null);

      await expect(service.updateExperience(experienceId, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateExperience(experienceId, dto)).rejects.toThrow('Imagem inválida');

      expect(databaseService.image.findUnique).toHaveBeenCalledWith({
        where: { url: dto.experienceImage },
      });
      expect(databaseService.experience.update).not.toHaveBeenCalled();
    });

    it('should update experience without image', async () => {
      const dto: UpdateExperienceFormDto = {
        experienceName: 'Updated Experience',
        experienceDescription: 'Updated description',
        experienceCategory: 'ADVENTURE',
        experienceCapacity: 20,
        experienceStartDate: '2025-01-01T10:00:00Z',
        experienceEndDate: '2025-12-31T18:00:00Z',
        experiencePrice: 150.5,
        experienceWeekDays: ['MONDAY', 'WEDNESDAY'],
        trailDurationMinutes: 180,
        trailDifficulty: 'MEDIUM',
        trailLength: 8,
      } as never;

      databaseService.experience.update.mockResolvedValueOnce({} as never);

      await service.updateExperience(experienceId, dto);

      expect(databaseService.image.findUnique).not.toHaveBeenCalled();
      expect(databaseService.experience.update).toHaveBeenCalledWith({
        where: { id: experienceId },
        data: {
          name: dto.experienceName,
          description: dto.experienceDescription,
          category: dto.experienceCategory,
          capacity: dto.experienceCapacity,
          startDate: dto.experienceStartDate,
          endDate: dto.experienceEndDate,
          price: dto.experiencePrice,
          weekDays: dto.experienceWeekDays,
          durationMinutes: dto.trailDurationMinutes,
          trailDifficulty: dto.trailDifficulty,
          trailLength: dto.trailLength,
          imageId: undefined,
        },
      });
    });

    it('should update experience with valid image', async () => {
      const dto: UpdateExperienceFormDto = {
        experienceName: 'Experience with Image',
        experienceImage: 'https://example.com/valid-image.jpg',
      } as never;

      const mockImage = { id: imageId, url: dto.experienceImage };

      databaseService.image.findUnique.mockResolvedValueOnce(mockImage as never);
      databaseService.experience.update.mockResolvedValueOnce({} as never);

      await service.updateExperience(experienceId, dto);

      expect(databaseService.image.findUnique).toHaveBeenCalledWith({
        where: { url: dto.experienceImage },
      });

      expect(databaseService.experience.update).toHaveBeenCalledWith({
        where: { id: experienceId },
        data: {
          name: dto.experienceName,
          description: undefined,
          category: undefined,
          capacity: undefined,
          startDate: undefined,
          endDate: undefined,
          price: undefined,
          weekDays: undefined,
          durationMinutes: undefined,
          trailDifficulty: undefined,
          trailLength: undefined,
          imageId,
        },
      });
    });

    it('should update experience with partial fields', async () => {
      const dto: UpdateExperienceFormDto = {
        experienceName: 'Partial Update',
        experiencePrice: 99.99,
      } as never;

      databaseService.experience.update.mockResolvedValueOnce({} as never);

      await service.updateExperience(experienceId, dto);

      expect(databaseService.experience.update).toHaveBeenCalledWith({
        where: { id: experienceId },
        data: {
          name: dto.experienceName,
          description: undefined,
          category: undefined,
          capacity: undefined,
          startDate: undefined,
          endDate: undefined,
          price: dto.experiencePrice,
          weekDays: undefined,
          durationMinutes: undefined,
          trailDifficulty: undefined,
          trailLength: undefined,
          imageId: undefined,
        },
      });
    });

    it('should update experience with all optional fields as undefined', async () => {
      const dto: UpdateExperienceFormDto = {} as never;

      databaseService.experience.update.mockResolvedValueOnce({} as never);

      await service.updateExperience(experienceId, dto);

      expect(databaseService.experience.update).toHaveBeenCalledWith({
        where: { id: experienceId },
        data: {
          name: undefined,
          description: undefined,
          category: undefined,
          capacity: undefined,
          startDate: undefined,
          endDate: undefined,
          price: undefined,
          weekDays: undefined,
          durationMinutes: undefined,
          trailDifficulty: undefined,
          trailLength: undefined,
          imageId: undefined,
        },
      });
    });
  });

  describe('searchExperience', () => {
    it('should search experiences with filters and pagination', async () => {
      const searchParams: ExperienceSearchParamsDto = {
        page: 0,
        limit: 10,
        dir: 'asc',
        sort: 'name',
        name: 'Trail',
        description: 'Mountain',
        date: '2025-06-15T00:00:00Z',
      } as never;

      const mockExperiences = [
        {
          id: 'exp-1',
          name: 'Mountain Trail',
          description: 'Beautiful mountain trail',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
        },
      ];

      databaseService.experience.findMany.mockResolvedValueOnce(mockExperiences as never);
      databaseService.experience.count.mockResolvedValueOnce(1);

      const result = await service.searchExperience(searchParams);

      expect(result).toEqual({
        page: 0,
        limit: 10,
        total: 1,
        items: mockExperiences,
      });

      expect(databaseService.experience.findMany).toHaveBeenCalledWith({
        where: {
          name: { contains: 'Trail' },
          description: { contains: 'Mountain' },
          startDate: { lte: '2025-06-15T00:00:00Z' },
          endDate: { gte: '2025-06-15T00:00:00Z' },
          active: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          startDate: true,
          endDate: true,
        },
        orderBy: { name: 'asc' },
        skip: 0,
        take: 10,
      });

      expect(databaseService.experience.count).toHaveBeenCalledWith({
        where: {
          name: { contains: 'Trail' },
          description: { contains: 'Mountain' },
          startDate: { lte: '2025-06-15T00:00:00Z' },
          endDate: { gte: '2025-06-15T00:00:00Z' },
          active: true,
        },
      });
    });

    it('should search with pagination on second page', async () => {
      const searchParams: ExperienceSearchParamsDto = {
        page: 2,
        limit: 5,
        dir: 'desc',
        sort: 'description',
      } as never;

      databaseService.experience.findMany.mockResolvedValueOnce([]);
      databaseService.experience.count.mockResolvedValueOnce(12);

      const result = await service.searchExperience(searchParams);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.total).toBe(12);

      expect(databaseService.experience.findMany).toHaveBeenCalledWith({
        where: {
          name: { contains: undefined },
          description: { contains: undefined },
          startDate: { lte: undefined },
          endDate: { gte: undefined },
          active: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          startDate: true,
          endDate: true,
        },
        orderBy: { description: 'desc' },
        skip: 10,
        take: 5,
      });
    });

    it('should search without filters', async () => {
      const searchParams: ExperienceSearchParamsDto = {
        page: 0,
        limit: 20,
        dir: 'asc',
        sort: 'name',
      } as never;

      const mockExperiences = [
        { id: '1', name: 'Exp 1' },
        { id: '2', name: 'Exp 2' },
      ];

      databaseService.experience.findMany.mockResolvedValueOnce(mockExperiences as never);
      databaseService.experience.count.mockResolvedValueOnce(2);

      await service.searchExperience(searchParams);

      expect(databaseService.experience.findMany).toHaveBeenCalledWith({
        where: {
          name: { contains: undefined },
          description: { contains: undefined },
          startDate: { lte: undefined },
          endDate: { gte: undefined },
          active: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          startDate: true,
          endDate: true,
        },
        orderBy: { name: 'asc' },
        skip: 0,
        take: 20,
      });
    });

    it('should return empty results when no experiences match', async () => {
      const searchParams: ExperienceSearchParamsDto = {
        page: 0,
        limit: 10,
        dir: 'asc',
        sort: 'name',
        name: 'NonExistent',
      } as never;

      databaseService.experience.findMany.mockResolvedValueOnce([]);
      databaseService.experience.count.mockResolvedValueOnce(0);

      const result = await service.searchExperience(searchParams);

      expect(result).toEqual({
        page: 0,
        limit: 10,
        total: 0,
        items: [],
      });
    });

    it('should handle date range filtering correctly', async () => {
      const searchParams: ExperienceSearchParamsDto = {
        page: 0,
        limit: 10,
        dir: 'asc',
        sort: 'name',
        date: '2025-07-15T12:00:00Z',
      } as never;

      databaseService.experience.findMany.mockResolvedValueOnce([]);
      databaseService.experience.count.mockResolvedValueOnce(0);

      await service.searchExperience(searchParams);

      expect(databaseService.experience.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startDate: { lte: '2025-07-15T12:00:00Z' },
            endDate: { gte: '2025-07-15T12:00:00Z' },
          }),
        }),
      );
    });
  });

  describe('createExperience', () => {
    const imageId = '2c8c5c1b-2f78-52bg-0g1g-5b22g4f9b0g8';

    it('should throw BadRequestException when image does not exist', async () => {
      const dto: CreateExperienceFormDto = {
        experienceName: 'New Experience',
        experienceDescription: 'Description',
        experienceCategory: 'ADVENTURE',
        experienceCapacity: 15,
        experienceImage: 'https://example.com/invalid-image.jpg',
        experienceWeekDays: ['MONDAY'],
      } as never;

      databaseService.image.findUnique.mockResolvedValueOnce(null);

      await expect(service.createExperience(dto)).rejects.toThrow(BadRequestException);
      await expect(service.createExperience(dto)).rejects.toThrow('Imagem inválida');

      expect(databaseService.image.findUnique).toHaveBeenCalledWith({
        where: { url: dto.experienceImage },
      });
      expect(databaseService.experience.create).not.toHaveBeenCalled();
    });

    it('should create experience with valid image', async () => {
      const dto: CreateExperienceFormDto = {
        experienceName: 'Mountain Adventure',
        experienceDescription: 'Amazing mountain trail',
        experienceCategory: 'ADVENTURE',
        experienceCapacity: 20,
        experienceImage: 'https://example.com/mountain.jpg',
        experienceStartDate: '2025-01-01T08:00:00Z',
        experienceEndDate: '2025-12-31T18:00:00Z',
        experiencePrice: 250,
        experienceWeekDays: ['SATURDAY', 'SUNDAY'],
        trailDurationMinutes: 240,
        trailDifficulty: 'HARD',
        trailLength: 12,
      } as never;

      const mockImage = { id: imageId, url: dto.experienceImage };

      databaseService.image.findUnique.mockResolvedValueOnce(mockImage as never);
      databaseService.experience.create.mockResolvedValueOnce({} as never);

      await service.createExperience(dto);

      expect(databaseService.image.findUnique).toHaveBeenCalledWith({
        where: { url: dto.experienceImage },
      });

      expect(databaseService.experience.create).toHaveBeenCalledWith({
        data: {
          name: dto.experienceName,
          description: dto.experienceDescription,
          category: dto.experienceCategory,
          capacity: dto.experienceCapacity,
          startDate: dto.experienceStartDate,
          endDate: dto.experienceEndDate,
          price: dto.experiencePrice,
          weekDays: dto.experienceWeekDays,
          durationMinutes: dto.trailDurationMinutes,
          trailDifficulty: dto.trailDifficulty,
          trailLength: dto.trailLength,
          active: true,
          imageId,
        },
      });
    });

    it('should create experience without image', async () => {
      const dto: CreateExperienceFormDto = {
        experienceName: 'Simple Experience',
        experienceDescription: 'Basic trail',
        experienceCategory: 'NATURE',
        experienceCapacity: 10,
        experienceImage: undefined,
        experienceWeekDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
      } as never;

      databaseService.experience.create.mockResolvedValueOnce({} as never);

      await service.createExperience(dto);

      expect(databaseService.image.findUnique).not.toHaveBeenCalled();
      expect(databaseService.experience.create).toHaveBeenCalledWith({
        data: {
          name: dto.experienceName,
          description: dto.experienceDescription,
          category: dto.experienceCategory,
          capacity: dto.experienceCapacity,
          startDate: undefined,
          endDate: undefined,
          price: undefined,
          weekDays: dto.experienceWeekDays,
          durationMinutes: undefined,
          trailDifficulty: undefined,
          trailLength: undefined,
          active: true,
          imageId: undefined,
        },
      });
    });

    it('should create experience with only required fields', async () => {
      const dto: CreateExperienceFormDto = {
        experienceName: 'Minimal Experience',
        experienceDescription: 'Minimal description',
        experienceCategory: 'CULTURAL',
        experienceCapacity: 5,
        experienceImage: 'https://example.com/culture.jpg',
        experienceWeekDays: ['TUESDAY'],
      } as never;

      const mockImage = { id: imageId, url: dto.experienceImage };

      databaseService.image.findUnique.mockResolvedValueOnce(mockImage as never);
      databaseService.experience.create.mockResolvedValueOnce({} as never);

      await service.createExperience(dto);

      expect(databaseService.experience.create).toHaveBeenCalledWith({
        data: {
          name: dto.experienceName,
          description: dto.experienceDescription,
          category: dto.experienceCategory,
          capacity: dto.experienceCapacity,
          startDate: undefined,
          endDate: undefined,
          price: undefined,
          weekDays: dto.experienceWeekDays,
          durationMinutes: undefined,
          trailDifficulty: undefined,
          trailLength: undefined,
          active: true,
          imageId,
        },
      });
    });

    it('should create experience with all optional fields', async () => {
      const dto: CreateExperienceFormDto = {
        experienceName: 'Complete Experience',
        experienceDescription: 'Full description',
        experienceCategory: 'ADVENTURE',
        experienceCapacity: 25,
        experienceImage: 'https://example.com/complete.jpg',
        experienceStartDate: '2025-03-01T09:00:00Z',
        experienceEndDate: '2025-11-30T17:00:00Z',
        experiencePrice: 350.75,
        experienceWeekDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
        trailDurationMinutes: 300,
        trailDifficulty: 'EXTREME',
        trailLength: 15,
      } as never;

      const mockImage = { id: imageId, url: dto.experienceImage };

      databaseService.image.findUnique.mockResolvedValueOnce(mockImage as never);
      databaseService.experience.create.mockResolvedValueOnce({} as never);

      await service.createExperience(dto);

      expect(databaseService.experience.create).toHaveBeenCalledWith({
        data: {
          name: dto.experienceName,
          description: dto.experienceDescription,
          category: dto.experienceCategory,
          capacity: dto.experienceCapacity,
          startDate: dto.experienceStartDate,
          endDate: dto.experienceEndDate,
          price: dto.experiencePrice,
          weekDays: dto.experienceWeekDays,
          durationMinutes: dto.trailDurationMinutes,
          trailDifficulty: dto.trailDifficulty,
          trailLength: dto.trailLength,
          active: true,
          imageId,
        },
      });
    });
  });
});
