import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HighlightService } from './highlight.service';
import { DatabaseService } from 'src/database/database.service';
import { StorageService } from 'src/storage/storage.service';
import { HighlightCategory } from 'generated/prisma';
import {
  CreateHighlightDto,
  UpdateHighlightDto,
  HighlightQueryParamsDto,
  CATEGORY_LIMITS,
} from './highlight.model';

describe('HighlightService', () => {
  let service: HighlightService;
  let databaseService: jest.Mocked<DatabaseService>;
  let storageService: jest.Mocked<StorageService>;

  const mockFile = {
    fieldname: 'file',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('fake-image-content'),
    size: 1024,
  } as Express.Multer.File;

  beforeEach(async () => {
    const mockDatabaseService = {
      highlight: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };

    const mockStorageService = {
      uploadFile: jest.fn(),
      deleteFileByUrl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HighlightService,
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<HighlightService>(HighlightService);
    databaseService = module.get(DatabaseService);
    storageService = module.get(StorageService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated highlights without category filter', async () => {
      const queryParams: HighlightQueryParamsDto = {
        page: 0,
        limit: 10,
      } as never;

      const mockHighlights = [
        {
          id: '1',
          title: 'Highlight 1',
          category: HighlightCategory.LABORATORY,
          order: 1,
        },
        {
          id: '2',
          title: 'Highlight 2',
          category: HighlightCategory.EVENT,
          order: 1,
        },
      ];

      databaseService.highlight.findMany.mockResolvedValueOnce(mockHighlights as never);
      databaseService.highlight.count.mockResolvedValueOnce(2);

      const result = await service.findAll(queryParams);

      expect(result).toEqual({
        items: mockHighlights,
        total: 2,
        page: 0,
        limit: 10,
      });

      expect(databaseService.highlight.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [{ category: 'asc' }, { order: 'asc' }],
        skip: 0,
        take: 10,
      });

      expect(databaseService.highlight.count).toHaveBeenCalledWith({ where: {} });
    });

    it('should return paginated highlights with category filter', async () => {
      const queryParams: HighlightQueryParamsDto = {
        page: 1,
        limit: 5,
        category: HighlightCategory.CAROUSEL,
      } as never;

      const mockHighlights = [
        {
          id: '1',
          title: 'Carousel 1',
          category: HighlightCategory.CAROUSEL,
          order: 1,
        },
      ];

      databaseService.highlight.findMany.mockResolvedValueOnce(mockHighlights as never);
      databaseService.highlight.count.mockResolvedValueOnce(5);

      const result = await service.findAll(queryParams);

      expect(result).toEqual({
        items: mockHighlights,
        total: 5,
        page: 1,
        limit: 5,
      });

      expect(databaseService.highlight.findMany).toHaveBeenCalledWith({
        where: { category: HighlightCategory.CAROUSEL },
        orderBy: [{ category: 'asc' }, { order: 'asc' }],
        skip: 5,
        take: 5,
      });
    });

    it('should return empty results when no highlights exist', async () => {
      const queryParams: HighlightQueryParamsDto = {
        page: 0,
        limit: 10,
      } as never;

      databaseService.highlight.findMany.mockResolvedValueOnce([]);
      databaseService.highlight.count.mockResolvedValueOnce(0);

      const result = await service.findAll(queryParams);

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('findGrouped', () => {
    it('should return highlights grouped by category', async () => {
      const mockHighlights = [
        {
          id: '1',
          title: 'Lab 1',
          category: HighlightCategory.LABORATORY,
          order: 1,
        },
        {
          id: '2',
          title: 'Lab 2',
          category: HighlightCategory.LABORATORY,
          order: 2,
        },
        {
          id: '3',
          title: 'Event 1',
          category: HighlightCategory.EVENT,
          order: 1,
        },
      ];

      databaseService.highlight.findMany.mockResolvedValueOnce(mockHighlights as never);

      const result = await service.findGrouped();

      expect(result[HighlightCategory.LABORATORY]).toHaveLength(2);
      expect(result[HighlightCategory.EVENT]).toHaveLength(1);
      expect(result[HighlightCategory.HOSTING]).toHaveLength(0);
      expect(result[HighlightCategory.TRAIL]).toHaveLength(0);
      expect(result[HighlightCategory.CAROUSEL]).toHaveLength(0);

      expect(databaseService.highlight.findMany).toHaveBeenCalledWith({
        orderBy: [{ category: 'asc' }, { order: 'asc' }],
      });
    });

    it('should return empty groups when no highlights exist', async () => {
      databaseService.highlight.findMany.mockResolvedValueOnce([]);

      const result = await service.findGrouped();

      expect(result[HighlightCategory.LABORATORY]).toEqual([]);
      expect(result[HighlightCategory.HOSTING]).toEqual([]);
      expect(result[HighlightCategory.EVENT]).toEqual([]);
      expect(result[HighlightCategory.TRAIL]).toEqual([]);
      expect(result[HighlightCategory.CAROUSEL]).toEqual([]);
    });
  });

  describe('findPublicGrouped', () => {
    it('should return public highlights grouped by category', async () => {
      const mockHighlights = [
        {
          id: '1',
          title: 'Trail 1',
          imageUrl: 'https://example.com/trail1.jpg',
          category: HighlightCategory.TRAIL,
          description: 'Description',
          order: 1,
        },
        {
          id: '2',
          title: 'Trail 2',
          imageUrl: 'https://example.com/trail2.jpg',
          category: HighlightCategory.TRAIL,
          description: null,
          order: 2,
        },
      ];

      databaseService.highlight.findMany.mockResolvedValueOnce(mockHighlights as never);

      const result = await service.findPublicGrouped();

      expect(result[HighlightCategory.TRAIL]).toHaveLength(2);
      expect(result[HighlightCategory.TRAIL][0]).not.toHaveProperty('createdAt');

      expect(databaseService.highlight.findMany).toHaveBeenCalledWith({
        orderBy: [{ category: 'asc' }, { order: 'asc' }],
        select: {
          id: true,
          title: true,
          imageUrl: true,
          category: true,
          description: true,
          order: true,
        },
      });
    });
  });

  describe('findOne', () => {
    const highlightId = '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7';

    it('should throw NotFoundException when highlight does not exist', async () => {
      databaseService.highlight.findUnique.mockResolvedValueOnce(null);

      await expect(service.findOne(highlightId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(highlightId)).rejects.toThrow('Destaque não encontrado');

      expect(databaseService.highlight.findUnique).toHaveBeenCalledWith({
        where: { id: highlightId },
      });
    });

    it('should return highlight when it exists', async () => {
      const mockHighlight = {
        id: highlightId,
        title: 'Test Highlight',
        category: HighlightCategory.LABORATORY,
        imageUrl: 'https://example.com/test.jpg',
        order: 1,
      };

      databaseService.highlight.findUnique.mockResolvedValueOnce(mockHighlight as never);

      const result = await service.findOne(highlightId);

      expect(result).toEqual(mockHighlight);
    });
  });

  describe('create', () => {
    it('should throw BadRequestException when file is not provided', async () => {
      const dto: CreateHighlightDto = {
        category: HighlightCategory.LABORATORY,
        title: 'New Highlight',
      } as never;

      await expect(service.create(dto, null)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto, null)).rejects.toThrow('Imagem é obrigatória');

      expect(storageService.uploadFile).not.toHaveBeenCalled();
    });

    it('should create highlight with auto-generated order when not provided', async () => {
      const dto: CreateHighlightDto = {
        category: HighlightCategory.TRAIL,
        title: 'New Trail',
        description: 'Trail description',
      } as never;

      const uploadedUrl = 'https://s3.example.com/highlights/trail.jpg';
      const mockCreated = {
        id: 'new-id',
        ...dto,
        imageUrl: uploadedUrl,
        order: 3,
      };

      databaseService.highlight.count.mockResolvedValueOnce(2);
      databaseService.highlight.findFirst
        .mockResolvedValueOnce({ order: 2 } as never) // maxOrder query
        .mockResolvedValueOnce(null); // existing order check

      storageService.uploadFile.mockResolvedValueOnce({ url: uploadedUrl });
      databaseService.highlight.create.mockResolvedValueOnce(mockCreated as never);

      const result = await service.create(dto, mockFile);

      expect(result).toEqual(mockCreated);

      expect(storageService.uploadFile).toHaveBeenCalledWith(mockFile, {
        directory: 'highlights',
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000',
      });

      expect(databaseService.highlight.create).toHaveBeenCalledWith({
        data: {
          category: dto.category,
          imageUrl: uploadedUrl,
          title: dto.title,
          description: dto.description,
          order: 3,
        },
      });
    });

    it('should create highlight with provided order', async () => {
      const dto: CreateHighlightDto = {
        category: HighlightCategory.CAROUSEL,
        title: 'Carousel Item',
        order: 5,
      } as never;

      const uploadedUrl = 'https://s3.example.com/highlights/carousel.jpg';

      databaseService.highlight.count.mockResolvedValueOnce(4);
      databaseService.highlight.findFirst.mockResolvedValueOnce(null);
      storageService.uploadFile.mockResolvedValueOnce({ url: uploadedUrl });
      databaseService.highlight.create.mockResolvedValueOnce({} as never);

      await service.create(dto, mockFile);

      expect(databaseService.highlight.create).toHaveBeenCalledWith({
        data: {
          category: dto.category,
          imageUrl: uploadedUrl,
          title: dto.title,
          description: null,
          order: 5,
        },
      });
    });

    it('should treat empty string description as null', async () => {
      const dto: CreateHighlightDto = {
        category: HighlightCategory.HOSTING,
        title: 'Hosting',
        description: '',
      } as never;

      const uploadedUrl = 'https://s3.example.com/highlights/hosting.jpg';

      databaseService.highlight.count.mockResolvedValueOnce(0);
      databaseService.highlight.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      storageService.uploadFile.mockResolvedValueOnce({ url: uploadedUrl });
      databaseService.highlight.create.mockResolvedValueOnce({} as never);

      await service.create(dto, mockFile);

      expect(databaseService.highlight.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: null,
        }),
      });
    });

    it('should delete uploaded file when database creation fails', async () => {
      const dto: CreateHighlightDto = {
        category: HighlightCategory.LABORATORY,
        title: 'Failed Creation',
      } as never;

      const uploadedUrl = 'https://s3.example.com/highlights/failed.jpg';

      databaseService.highlight.count.mockResolvedValueOnce(0);
      databaseService.highlight.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      storageService.uploadFile.mockResolvedValueOnce({ url: uploadedUrl });
      databaseService.highlight.create.mockRejectedValueOnce(new Error('DB Error'));

      await expect(service.create(dto, mockFile)).rejects.toThrow('DB Error');

      expect(storageService.deleteFileByUrl).toHaveBeenCalledWith(uploadedUrl);
    });
  });

  describe('update', () => {
    const highlightId = '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7';
    const existingImageUrl = 'https://s3.example.com/old-image.jpg';

    it('should throw NotFoundException when highlight does not exist', async () => {
      const dto: UpdateHighlightDto = {
        title: 'Updated Title',
      } as never;

      databaseService.highlight.findUnique.mockResolvedValueOnce(null);

      await expect(service.update(highlightId, dto, null)).rejects.toThrow(NotFoundException);
      await expect(service.update(highlightId, dto, null)).rejects.toThrow(
        'Destaque não encontrado',
      );
    });

    it('should update highlight without changing image', async () => {
      const dto: UpdateHighlightDto = {
        title: 'Updated Title',
        description: 'Updated description',
      } as never;

      const mockHighlight = {
        id: highlightId,
        category: HighlightCategory.EVENT,
        order: 1,
        imageUrl: existingImageUrl,
      };

      const mockUpdated = { ...mockHighlight, ...dto };

      databaseService.highlight.findUnique.mockResolvedValueOnce(mockHighlight as never);
      databaseService.highlight.update.mockResolvedValueOnce(mockUpdated as never);

      const result = await service.update(highlightId, dto, null);

      expect(result).toEqual(mockUpdated);

      expect(storageService.uploadFile).not.toHaveBeenCalled();
      expect(storageService.deleteFileByUrl).not.toHaveBeenCalled();

      expect(databaseService.highlight.update).toHaveBeenCalledWith({
        where: { id: highlightId },
        data: {
          title: dto.title,
          description: dto.description,
          order: undefined,
        },
      });
    });

    it('should update highlight with new image and delete old one', async () => {
      const dto: UpdateHighlightDto = {
        title: 'Updated with Image',
      } as never;

      const mockHighlight = {
        id: highlightId,
        category: HighlightCategory.TRAIL,
        order: 1,
        imageUrl: existingImageUrl,
      };

      const newImageUrl = 'https://s3.example.com/new-image.jpg';
      const mockUpdated = { ...mockHighlight, ...dto, imageUrl: newImageUrl };

      databaseService.highlight.findUnique.mockResolvedValueOnce(mockHighlight as never);
      storageService.uploadFile.mockResolvedValueOnce({ url: newImageUrl });
      databaseService.highlight.update.mockResolvedValueOnce(mockUpdated as never);

      const result = await service.update(highlightId, dto, mockFile);

      expect(result).toEqual(mockUpdated);

      expect(storageService.uploadFile).toHaveBeenCalledWith(mockFile, {
        directory: 'highlights',
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000',
      });

      expect(databaseService.highlight.update).toHaveBeenCalledWith({
        where: { id: highlightId },
        data: {
          title: dto.title,
          description: undefined,
          order: undefined,
          imageUrl: newImageUrl,
        },
      });

      expect(storageService.deleteFileByUrl).toHaveBeenCalledWith(existingImageUrl);
    });

    it('should update order to same value without conflict check', async () => {
      const dto: UpdateHighlightDto = {
        order: 1,
      } as never;

      const mockHighlight = {
        id: highlightId,
        category: HighlightCategory.CAROUSEL,
        order: 1,
        imageUrl: existingImageUrl,
      };

      databaseService.highlight.findUnique.mockResolvedValueOnce(mockHighlight as never);
      databaseService.highlight.update.mockResolvedValueOnce(mockHighlight as never);

      await service.update(highlightId, dto, null);

      expect(databaseService.highlight.findFirst).not.toHaveBeenCalled();
    });

    it('should treat empty string description as null', async () => {
      const dto: UpdateHighlightDto = {
        description: '',
      } as never;

      const mockHighlight = {
        id: highlightId,
        category: HighlightCategory.HOSTING,
        order: 1,
        imageUrl: existingImageUrl,
      };

      databaseService.highlight.findUnique.mockResolvedValueOnce(mockHighlight as never);
      databaseService.highlight.update.mockResolvedValueOnce(mockHighlight as never);

      await service.update(highlightId, dto, null);

      expect(databaseService.highlight.update).toHaveBeenCalledWith({
        where: { id: highlightId },
        data: expect.objectContaining({
          description: null,
        }),
      });
    });

    it('should delete new uploaded file when update fails', async () => {
      const dto: UpdateHighlightDto = {
        title: 'Failed Update',
      } as never;

      const mockHighlight = {
        id: highlightId,
        imageUrl: existingImageUrl,
      };

      const newImageUrl = 'https://s3.example.com/new-failed.jpg';

      databaseService.highlight.findUnique.mockResolvedValueOnce(mockHighlight as never);
      storageService.uploadFile.mockResolvedValueOnce({ url: newImageUrl });
      databaseService.highlight.update.mockRejectedValueOnce(new Error('Update failed'));

      await expect(service.update(highlightId, dto, mockFile)).rejects.toThrow('Update failed');

      expect(storageService.deleteFileByUrl).toHaveBeenCalledWith(newImageUrl);
      expect(storageService.deleteFileByUrl).not.toHaveBeenCalledWith(existingImageUrl);
    });
  });

  describe('delete', () => {
    const highlightId = '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7';
    const imageUrl = 'https://s3.example.com/highlight.jpg';

    it('should throw NotFoundException when highlight does not exist', async () => {
      databaseService.highlight.findUnique.mockResolvedValueOnce(null);

      await expect(service.delete(highlightId)).rejects.toThrow(NotFoundException);
      await expect(service.delete(highlightId)).rejects.toThrow('Destaque não encontrado');
    });

    it('should delete highlight and reorder remaining items', async () => {
      const mockHighlight = {
        id: highlightId,
        category: HighlightCategory.LABORATORY,
        order: 2,
        imageUrl,
      };

      const itemsToReorder = [
        { id: 'item-3', order: 3 },
        { id: 'item-4', order: 4 },
      ];

      databaseService.highlight.findUnique.mockResolvedValueOnce(mockHighlight as never);
      databaseService.highlight.delete.mockResolvedValueOnce({} as never);
      databaseService.highlight.findMany.mockResolvedValueOnce(itemsToReorder as never);
      databaseService.highlight.update.mockResolvedValue({} as never);

      const result = await service.delete(highlightId);

      expect(result).toEqual({ message: 'Destaque excluído com sucesso' });

      expect(databaseService.highlight.delete).toHaveBeenCalledWith({
        where: { id: highlightId },
      });

      expect(databaseService.highlight.findMany).toHaveBeenCalledWith({
        where: {
          category: mockHighlight.category,
          order: { gt: mockHighlight.order },
        },
        orderBy: { order: 'asc' },
      });

      expect(databaseService.highlight.update).toHaveBeenCalledTimes(2);
      expect(databaseService.highlight.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'item-3' },
        data: { order: 2 },
      });
      expect(databaseService.highlight.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'item-4' },
        data: { order: 3 },
      });

      expect(storageService.deleteFileByUrl).toHaveBeenCalledWith(imageUrl);
    });

    it('should delete highlight without reordering when it is the last item', async () => {
      const mockHighlight = {
        id: highlightId,
        category: HighlightCategory.EVENT,
        order: 3,
        imageUrl,
      };

      databaseService.highlight.findUnique.mockResolvedValueOnce(mockHighlight as never);
      databaseService.highlight.delete.mockResolvedValueOnce({} as never);
      databaseService.highlight.findMany.mockResolvedValueOnce([]);

      await service.delete(highlightId);

      expect(databaseService.highlight.update).not.toHaveBeenCalled();
      expect(storageService.deleteFileByUrl).toHaveBeenCalledWith(imageUrl);
    });
  });
});
