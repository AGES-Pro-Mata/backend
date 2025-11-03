/* eslint-disable @typescript-eslint/unbound-method */

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ExperienceService } from './experience.service';
import { DatabaseService } from '../database/database.service';
import { StorageService } from '../storage/storage.service';
import {
  CreateExperienceFormDto,
  UpdateExperienceFormDto,
  ExperienceSearchParamsDto,
} from './experience.model';
import { StorageService } from 'src/storage/storage.service';

describe('ExperienceService', () => {
  let service: ExperienceService;
  let databaseService: any;
  let storageService: any;

  const mockFile = {
    fieldname: 'image',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('fake-image-content'),
    size: 1024,
  } as Express.Multer.File;

  beforeEach(async () => {
    const mockDatabaseService = {
      experience: {
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
      },
      image: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const mockStorageService = {
      uploadFile: jest.fn(),
      deleteFileByUrl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExperienceService,
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<ExperienceService>(ExperienceService);
    databaseService = module.get(DatabaseService);
    storageService = module.get(StorageService);

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

  describe('toggleExperienceStatus', () => {
    const experienceId = '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7';

    it('should activate experience when active is true', async () => {
      const mockExperience = { id: experienceId, active: false };

      databaseService.experience.findUnique.mockResolvedValueOnce(mockExperience as never);
      databaseService.experience.update.mockResolvedValueOnce({} as never);

      await service.toggleExperienceStatus(experienceId, true);

      expect(databaseService.experience.findUnique).toHaveBeenCalledWith({
        where: { id: experienceId },
      });

      expect(databaseService.experience.update).toHaveBeenCalledWith({
        where: { id: experienceId },
        data: { active: true },
      });
    });

    it('should deactivate experience when active is false', async () => {
      const mockExperience = { id: experienceId, active: true };

      databaseService.experience.findUnique.mockResolvedValueOnce(mockExperience as never);
      databaseService.experience.update.mockResolvedValueOnce({} as never);

      await service.toggleExperienceStatus(experienceId, false);

      expect(databaseService.experience.findUnique).toHaveBeenCalledWith({
        where: { id: experienceId },
      });

      expect(databaseService.experience.update).toHaveBeenCalledWith({
        where: { id: experienceId },
        data: { active: false },
      });
    });

    it('should throw NotFoundException when experience does not exist', async () => {
      databaseService.experience.findUnique.mockResolvedValueOnce(null);

      await expect(service.toggleExperienceStatus(experienceId, true)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.toggleExperienceStatus(experienceId, true)).rejects.toThrow(
        'Experiência não encontrada',
      );

      expect(databaseService.experience.update).not.toHaveBeenCalled();
    });
  });

  describe('getExperience', () => {
    const experienceId = 'exp-1';

    it('should return experience data without active flag when active experience exists', async () => {
      const experience = {
        id: experienceId,
        name: 'Experience name',
        description: 'Description',
        category: 'TRAIL',
        capacity: 20,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        price: 100,
        weekDays: ['MONDAY'],
        durationMinutes: 120,
        trailDifficulty: 'LIGHT',
        trailLength: 5,
        professorShouldPay: true,
        active: true,
        image: { url: 'https://example.com/image.png' },
      };

      databaseService.experience.findUnique.mockResolvedValueOnce(experience);

      const result = await service.getExperience(experienceId);

      expect(result).toEqual({
        id: experience.id,
        name: experience.name,
        description: experience.description,
        category: experience.category,
        capacity: experience.capacity,
        startDate: experience.startDate,
        endDate: experience.endDate,
        price: experience.price,
        weekDays: experience.weekDays,
        durationMinutes: experience.durationMinutes,
        trailDifficulty: experience.trailDifficulty,
        trailLength: experience.trailLength,
        professorShouldPay: experience.professorShouldPay,
        active: experience.active,
        image: experience.image,
      });
    });

    it('should throw NotFoundException when experience does not exist', async () => {
      databaseService.experience.findUnique.mockResolvedValueOnce(null);

      await expect(service.getExperience(experienceId)).rejects.toThrow(NotFoundException);
      await expect(service.getExperience(experienceId)).rejects.toThrow('Experiência não encontrada');
    });

    it('should throw NotFoundException when experience is inactive', async () => {
      databaseService.experience.findUnique.mockResolvedValueOnce(null);

      await expect(service.getExperience(experienceId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateExperience', () => {
    const experienceId = '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7';
    const imageId = '2c8c5c1b-2f78-52bg-0g1g-5b22g4f9b0g8';
    const uploadedUrl = 'https://s3.example.com/experiences/updated.jpg';

    it('should update experience without file', async () => {
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

      await service.updateExperience(experienceId, dto, null);

      expect(storageService.uploadFile).not.toHaveBeenCalled();
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

    it('should update experience with file upload', async () => {
      const dto: UpdateExperienceFormDto = {
        experienceName: 'Experience with Image',
      } as never;

      const mockImage = { id: imageId, url: uploadedUrl };

      storageService.uploadFile.mockResolvedValueOnce({ url: uploadedUrl });
      databaseService.image.create.mockResolvedValueOnce(mockImage as never);
      databaseService.experience.update.mockResolvedValueOnce({} as never);

      await service.updateExperience(experienceId, dto, mockFile);

      expect(storageService.uploadFile).toHaveBeenCalledWith(mockFile, {
        directory: 'experiences',
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000',
      });

      expect(databaseService.image.create).toHaveBeenCalledWith({
        data: { url: uploadedUrl },
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
        },
        select: {
          id: true,
          name: true,
          description: true,
          startDate: true,
          endDate: true,
          active: true,
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
        },
        select: {
          id: true,
          name: true,
          description: true,
          startDate: true,
          endDate: true,
          active: true,
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
          endDate: { gte: undefined }
        },
        select: {
          id: true,
          name: true,
          description: true,
          startDate: true,
          endDate: true,
          active: true,
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
    const uploadedUrl = 'https://s3.example.com/experiences/created.jpg';

    it('should create experience without file', async () => {
      const dto: CreateExperienceFormDto = {
        experienceName: 'Simple Experience',
        experienceDescription: 'Basic trail',
        experienceCategory: 'NATURE',
        experienceCapacity: 10,
        experienceWeekDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
      } as never;

      databaseService.experience.create.mockResolvedValueOnce({} as never);

      await service.createExperience(dto, null);

      expect(storageService.uploadFile).not.toHaveBeenCalled();
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

    it('should create experience with file upload', async () => {
      const dto: CreateExperienceFormDto = {
        experienceName: 'Mountain Adventure',
        experienceDescription: 'Amazing mountain trail',
        experienceCategory: 'ADVENTURE',
        experienceCapacity: 20,
        experienceStartDate: '2025-01-01T08:00:00Z',
        experienceEndDate: '2025-12-31T18:00:00Z',
        experiencePrice: 250,
        experienceWeekDays: ['SATURDAY', 'SUNDAY'],
        trailDurationMinutes: 240,
        trailDifficulty: 'HARD',
        trailLength: 12,
      } as never;

      const mockImage = { id: imageId, url: uploadedUrl };

      storageService.uploadFile.mockResolvedValueOnce({ url: uploadedUrl });
      databaseService.image.create.mockResolvedValueOnce(mockImage as never);
      databaseService.experience.create.mockResolvedValueOnce({} as never);

      await service.createExperience(dto, mockFile);

      expect(storageService.uploadFile).toHaveBeenCalledWith(mockFile, {
        directory: 'experiences',
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000',
      });

      expect(databaseService.image.create).toHaveBeenCalledWith({
        data: { url: uploadedUrl },
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
  });
});
