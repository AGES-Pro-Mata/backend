/* eslint-disable @typescript-eslint/unbound-method */

import { Test, TestingModule } from '@nestjs/testing';
import { HighlightController } from './highlight.controller';
import { HighlightService } from './highlight.service';
import { CreateHighlightDto, HighlightQueryParamsDto, UpdateHighlightDto } from './highlight.model';
import { HighlightCategory } from 'generated/prisma';

describe('HighlightController', () => {
  let controller: HighlightController;
  let highlightService: jest.Mocked<HighlightService>;

  beforeEach(async () => {
    const mockHighlightService = {
      findAll: jest.fn(),
      findGrouped: jest.fn(),
      findPublicGrouped: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HighlightController],
      providers: [{ provide: HighlightService, useValue: mockHighlightService }],
    }).compile();

    controller = module.get<HighlightController>(HighlightController);
    highlightService = module.get(HighlightService);

    jest.clearAllMocks();
  });

  describe('findPublicGrouped', () => {
    it('should call highlightService.findPublicGrouped and return grouped highlights', async () => {
      const expectedResult = {
        [HighlightCategory.LABORATORY]: [
          {
            id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
            title: 'Laboratório Principal',
            imageUrl: 'https://example.com/lab.jpg',
            category: HighlightCategory.LABORATORY,
            description: 'Laboratório de pesquisa',
            order: 1,
          },
        ],
        [HighlightCategory.HOSTING]: [],
        [HighlightCategory.EVENT]: [
          {
            id: '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
            title: 'Evento Especial',
            imageUrl: 'https://example.com/event.jpg',
            category: HighlightCategory.EVENT,
            description: 'Grande evento',
            order: 1,
          },
        ],
        [HighlightCategory.TRAIL]: [],
        [HighlightCategory.CAROUSEL]: [],
      };

      highlightService.findPublicGrouped.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.findPublicGrouped();

      expect(highlightService.findPublicGrouped).toHaveBeenCalled();
      expect(highlightService.findPublicGrouped).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('should return all categories even if empty', async () => {
      const expectedResult = {
        [HighlightCategory.LABORATORY]: [],
        [HighlightCategory.HOSTING]: [],
        [HighlightCategory.EVENT]: [],
        [HighlightCategory.TRAIL]: [],
        [HighlightCategory.CAROUSEL]: [],
      };

      highlightService.findPublicGrouped.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.findPublicGrouped();

      expect(result).toEqual(expectedResult);
      expect(Object.keys(result)).toHaveLength(5);
    });

    it('should only return public fields (no internal data)', async () => {
      const expectedResult = {
        [HighlightCategory.CAROUSEL]: [
          {
            id: '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r',
            title: 'Carousel Item',
            imageUrl: 'https://example.com/carousel.jpg',
            category: HighlightCategory.CAROUSEL,
            description: null,
            order: 1,
          },
        ],
        [HighlightCategory.LABORATORY]: [],
        [HighlightCategory.HOSTING]: [],
        [HighlightCategory.EVENT]: [],
        [HighlightCategory.TRAIL]: [],
      };

      highlightService.findPublicGrouped.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.findPublicGrouped();

      expect(result[HighlightCategory.CAROUSEL][0]).not.toHaveProperty('createdAt');
      expect(result[HighlightCategory.CAROUSEL][0]).not.toHaveProperty('updatedAt');
    });
  });

  describe('findAll', () => {
    it('should call highlightService.findAll with query params', async () => {
      const queryParams: HighlightQueryParamsDto = {
        category: HighlightCategory.TRAIL,
        limit: 10,
        page: 0,
      } as never;

      const expectedResult = {
        items: [
          {
            id: '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s',
            title: 'Trilha Principal',
            imageUrl: 'https://example.com/trail.jpg',
            category: HighlightCategory.TRAIL,
            description: 'Melhor trilha',
            order: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 1,
        page: 0,
        limit: 10,
      };

      highlightService.findAll.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.findAll(queryParams);

      expect(highlightService.findAll).toHaveBeenCalledWith(queryParams);
      expect(highlightService.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('should work without category filter', async () => {
      const queryParams: HighlightQueryParamsDto = {
        limit: 20,
        page: 1,
      } as never;

      const expectedResult = {
        items: [
          {
            id: '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t',
            title: 'Highlight 1',
            imageUrl: 'https://example.com/img1.jpg',
            category: HighlightCategory.HOSTING,
            description: 'Description 1',
            order: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u',
            title: 'Highlight 2',
            imageUrl: 'https://example.com/img2.jpg',
            category: HighlightCategory.EVENT,
            description: 'Description 2',
            order: 2,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 15,
        page: 1,
        limit: 20,
      };

      highlightService.findAll.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.findAll(queryParams);

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(15);
      expect(result.page).toBe(1);
    });

    it('should handle empty results', async () => {
      const queryParams: HighlightQueryParamsDto = {
        category: HighlightCategory.LABORATORY,
        limit: 10,
        page: 0,
      } as never;

      const expectedResult = {
        items: [],
        total: 0,
        page: 0,
        limit: 10,
      };

      highlightService.findAll.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.findAll(queryParams);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle pagination correctly', async () => {
      const queryParams: HighlightQueryParamsDto = {
        limit: 5,
        page: 3,
      } as never;

      const expectedResult = {
        items: [
          {
            id: '7g8h9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2v',
            title: 'Highlight Page 3',
            imageUrl: 'https://example.com/img3.jpg',
            category: HighlightCategory.CAROUSEL,
            description: null,
            order: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 16,
        page: 3,
        limit: 5,
      };

      highlightService.findAll.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.findAll(queryParams);

      expect(result.page).toBe(3);
      expect(result.limit).toBe(5);
    });
  });

  describe('findGrouped', () => {
    it('should call highlightService.findGrouped and return all highlights grouped', async () => {
      const expectedResult = {
        [HighlightCategory.LABORATORY]: [
          {
            id: '8h9i0j1k-2l3m-4n5o-6p7q-8r9s0t1u2v3w',
            title: 'Lab 1',
            imageUrl: 'https://example.com/lab1.jpg',
            category: HighlightCategory.LABORATORY,
            description: 'Laboratory description',
            order: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        [HighlightCategory.HOSTING]: [
          {
            id: '9i0j1k2l-3m4n-5o6p-7q8r-9s0t1u2v3w4x',
            title: 'Hosting 1',
            imageUrl: 'https://example.com/host1.jpg',
            category: HighlightCategory.HOSTING,
            description: 'Hosting description',
            order: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        [HighlightCategory.EVENT]: [],
        [HighlightCategory.TRAIL]: [],
        [HighlightCategory.CAROUSEL]: [],
      };

      highlightService.findGrouped.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.findGrouped();

      expect(highlightService.findGrouped).toHaveBeenCalled();
      expect(highlightService.findGrouped).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('should include all internal fields (createdAt, updatedAt)', async () => {
      const expectedResult = {
        [HighlightCategory.TRAIL]: [
          {
            id: '0j1k2l3m-4n5o-6p7q-8r9s-0t1u2v3w4x5y',
            title: 'Trail Admin',
            imageUrl: 'https://example.com/trail-admin.jpg',
            category: HighlightCategory.TRAIL,
            description: 'Admin view',
            order: 1,
            createdAt: new Date('2025-01-01'),
            updatedAt: new Date('2025-01-02'),
          },
        ],
        [HighlightCategory.LABORATORY]: [],
        [HighlightCategory.HOSTING]: [],
        [HighlightCategory.EVENT]: [],
        [HighlightCategory.CAROUSEL]: [],
      };

      highlightService.findGrouped.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.findGrouped();

      expect(result[HighlightCategory.TRAIL][0]).toHaveProperty('createdAt');
      expect(result[HighlightCategory.TRAIL][0]).toHaveProperty('updatedAt');
    });
  });

  describe('findOne', () => {
    it('should call highlightService.findOne with id', async () => {
      const id = '1k2l3m4n-5o6p-7q8r-9s0t-1u2v3w4x5y6z';
      const expectedHighlight = {
        id,
        title: 'Single Highlight',
        imageUrl: 'https://example.com/single.jpg',
        category: HighlightCategory.EVENT,
        description: 'Single highlight description',
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      highlightService.findOne.mockResolvedValueOnce(expectedHighlight as never);

      const result = await controller.findOne(id);

      expect(highlightService.findOne).toHaveBeenCalledWith(id);
      expect(highlightService.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedHighlight);
    });

    it('should propagate NotFoundException from service', async () => {
      const id = 'non-existent-id';
      const error = new Error('Destaque não encontrado');

      highlightService.findOne.mockRejectedValueOnce(error);

      await expect(controller.findOne(id)).rejects.toThrow('Destaque não encontrado');
    });

    it('should return highlight with all fields', async () => {
      const id = '2l3m4n5o-6p7q-8r9s-0t1u-2v3w4x5y6z7a';
      const expectedHighlight = {
        id,
        title: 'Complete Highlight',
        imageUrl: 'https://example.com/complete.jpg',
        category: HighlightCategory.CAROUSEL,
        description: 'Complete description',
        order: 3,
        createdAt: new Date('2025-02-01'),
        updatedAt: new Date('2025-02-15'),
      };

      highlightService.findOne.mockResolvedValueOnce(expectedHighlight as never);

      const result = await controller.findOne(id);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('imageUrl');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('order');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });
  });

  describe('create', () => {
    it('should call highlightService.create with dto and file', async () => {
      const mockFile = {
        fieldname: 'image',
        originalname: 'highlight.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('fake-image-data'),
        size: 12345,
      } as Express.Multer.File;

      const dto: CreateHighlightDto = {
        category: HighlightCategory.LABORATORY,
        title: 'Novo Destaque',
        description: 'Descrição do destaque',
        order: 1,
      } as never;

      const expectedResult = {
        id: '3m4n5o6p-7q8r-9s0t-1u2v-3w4x5y6z7a8b',
        title: dto.title,
        imageUrl: 'https://example.com/uploaded.jpg',
        category: dto.category,
        description: dto.description,
        order: dto.order,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      highlightService.create.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.create(dto, mockFile);

      expect(highlightService.create).toHaveBeenCalledWith(dto, mockFile);
      expect(highlightService.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('should work with null file (will fail in service)', async () => {
      const dto: CreateHighlightDto = {
        category: HighlightCategory.EVENT,
        title: 'Destaque Sem Imagem',
        description: 'Tentativa sem imagem',
        order: 2,
      } as never;

      const error = new Error('Imagem é obrigatória');
      highlightService.create.mockRejectedValueOnce(error);

      await expect(controller.create(dto, null)).rejects.toThrow('Imagem é obrigatória');
    });

    it('should create highlight without optional description', async () => {
      const mockFile = {
        fieldname: 'image',
        originalname: 'no-desc.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('image-data'),
        size: 5000,
      } as Express.Multer.File;

      const dto: CreateHighlightDto = {
        category: HighlightCategory.TRAIL,
        title: 'Destaque Simples',
        order: 1,
      } as never;

      const expectedResult = {
        id: '4n5o6p7q-8r9s-0t1u-2v3w-4x5y6z7a8b9c',
        title: dto.title,
        imageUrl: 'https://example.com/simple.jpg',
        category: dto.category,
        description: null,
        order: dto.order,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      highlightService.create.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.create(dto, mockFile);

      expect(result.description).toBeNull();
    });

    it('should create highlight without optional order (auto-assigned)', async () => {
      const mockFile = {
        fieldname: 'image',
        originalname: 'auto-order.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('image-data'),
        size: 8000,
      } as Express.Multer.File;

      const dto: CreateHighlightDto = {
        category: HighlightCategory.HOSTING,
        title: 'Destaque Auto Order',
        description: 'Com ordem automática',
      } as never;

      const expectedResult = {
        id: '5o6p7q8r-9s0t-1u2v-3w4x-5y6z7a8b9c0d',
        title: dto.title,
        imageUrl: 'https://example.com/auto.jpg',
        category: dto.category,
        description: dto.description,
        order: 3, // Auto-assigned by service
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      highlightService.create.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.create(dto, mockFile);

      expect(result.order).toBe(3);
    });

    it('should propagate BadRequestException when limit is reached', async () => {
      const mockFile = {
        fieldname: 'image',
        originalname: 'limit.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('image-data'),
        size: 10000,
      } as Express.Multer.File;

      const dto: CreateHighlightDto = {
        category: HighlightCategory.CAROUSEL,
        title: 'Exceeding Limit',
        description: 'This will fail',
        order: 6,
      } as never;

      const error = new Error('Limite de imagens atingido para esta categoria');
      highlightService.create.mockRejectedValueOnce(error);

      await expect(controller.create(dto, mockFile)).rejects.toThrow(
        'Limite de imagens atingido para esta categoria',
      );
    });

    it('should propagate BadRequestException when order already exists', async () => {
      const mockFile = {
        fieldname: 'image',
        originalname: 'duplicate.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('image-data'),
        size: 7000,
      } as Express.Multer.File;

      const dto: CreateHighlightDto = {
        category: HighlightCategory.LABORATORY,
        title: 'Duplicate Order',
        description: 'Order conflict',
        order: 1,
      } as never;

      const error = new Error('Já existe um destaque com essa ordem nesta categoria');
      highlightService.create.mockRejectedValueOnce(error);

      await expect(controller.create(dto, mockFile)).rejects.toThrow(
        'Já existe um destaque com essa ordem nesta categoria',
      );
    });
  });

  describe('update', () => {
    it('should call highlightService.update with id, dto and file', async () => {
      const id = '6p7q8r9s-0t1u-2v3w-4x5y-6z7a8b9c0d1e';
      const mockFile = {
        fieldname: 'image',
        originalname: 'updated.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('updated-image-data'),
        size: 15000,
      } as Express.Multer.File;

      const dto: UpdateHighlightDto = {
        title: 'Título Atualizado',
        description: 'Descrição atualizada',
        order: 2,
      } as never;

      const expectedResult = {
        id,
        title: dto.title,
        imageUrl: 'https://example.com/updated.jpg',
        category: HighlightCategory.EVENT,
        description: dto.description,
        order: dto.order,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-03-01'),
      };

      highlightService.update.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.update(id, dto, mockFile);

      expect(highlightService.update).toHaveBeenCalledWith(id, dto, mockFile);
      expect(highlightService.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('should update without file (keep existing image)', async () => {
      const id = '7q8r9s0t-1u2v-3w4x-5y6z-7a8b9c0d1e2f';
      const dto: UpdateHighlightDto = {
        title: 'Só Título',
        description: 'Mantém imagem antiga',
      } as never;

      const expectedResult = {
        id,
        title: dto.title,
        imageUrl: 'https://example.com/old-image.jpg', // Same image
        category: HighlightCategory.TRAIL,
        description: dto.description,
        order: 1,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-03-02'),
      };

      highlightService.update.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.update(id, dto, null);

      expect(highlightService.update).toHaveBeenCalledWith(id, dto, null);
      expect(result.imageUrl).toBe('https://example.com/old-image.jpg');
    });

    it('should update only title', async () => {
      const id = '8r9s0t1u-2v3w-4x5y-6z7a-8b9c0d1e2f3g';
      const dto: UpdateHighlightDto = {
        title: 'Apenas Novo Título',
      } as never;

      const expectedResult = {
        id,
        title: dto.title,
        imageUrl: 'https://example.com/existing.jpg',
        category: HighlightCategory.HOSTING,
        description: 'Old description',
        order: 2,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-03-03'),
      };

      highlightService.update.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.update(id, dto, null);

      expect(result.title).toBe(dto.title);
      expect(result.description).toBe('Old description'); // Unchanged
    });

    it('should update only order', async () => {
      const id = '9s0t1u2v-3w4x-5y6z-7a8b-9c0d1e2f3g4h';
      const dto: UpdateHighlightDto = {
        order: 5,
      } as never;

      const expectedResult = {
        id,
        title: 'Existing Title',
        imageUrl: 'https://example.com/existing2.jpg',
        category: HighlightCategory.CAROUSEL,
        description: 'Existing description',
        order: dto.order,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-03-04'),
      };

      highlightService.update.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.update(id, dto, null);

      expect(result.order).toBe(5);
    });

    it('should propagate NotFoundException when highlight not found', async () => {
      const id = 'non-existent-id';
      const dto: UpdateHighlightDto = {
        title: 'Update Non-existent',
      } as never;

      const error = new Error('Destaque não encontrado');
      highlightService.update.mockRejectedValueOnce(error);

      await expect(controller.update(id, dto, null)).rejects.toThrow('Destaque não encontrado');
    });

    it('should propagate BadRequestException when order conflicts', async () => {
      const id = '0t1u2v3w-4x5y-6z7a-8b9c-0d1e2f3g4h5i';
      const dto: UpdateHighlightDto = {
        order: 1, // Already taken
      } as never;

      const error = new Error('Já existe um destaque com essa ordem nesta categoria');
      highlightService.update.mockRejectedValueOnce(error);

      await expect(controller.update(id, dto, null)).rejects.toThrow(
        'Já existe um destaque com essa ordem nesta categoria',
      );
    });

    it('should handle empty description (set to null)', async () => {
      const id = '1u2v3w4x-5y6z-7a8b-9c0d-1e2f3g4h5i6j';
      const dto: UpdateHighlightDto = {
        title: 'Title',
        description: '', // Empty string should become null
      } as never;

      const expectedResult = {
        id,
        title: dto.title,
        imageUrl: 'https://example.com/img.jpg',
        category: HighlightCategory.LABORATORY,
        description: null, // Converted to null
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      highlightService.update.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.update(id, dto, null);

      expect(result.description).toBeNull();
    });
  });

  describe('delete', () => {
    it('should call highlightService.delete with id', async () => {
      const id = '2v3w4x5y-6z7a-8b9c-0d1e-2f3g4h5i6j7k';
      const expectedResult = {
        message: 'Destaque excluído com sucesso',
      };

      highlightService.delete.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.delete(id);

      expect(highlightService.delete).toHaveBeenCalledWith(id);
      expect(highlightService.delete).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });

    it('should return success message', async () => {
      const id = '3w4x5y6z-7a8b-9c0d-1e2f-3g4h5i6j7k8l';
      const expectedResult = {
        message: 'Destaque excluído com sucesso',
      };

      highlightService.delete.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.delete(id);

      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Destaque excluído com sucesso');
    });

    it('should propagate NotFoundException when highlight not found', async () => {
      const id = 'non-existent-delete-id';
      const error = new Error('Destaque não encontrado');

      highlightService.delete.mockRejectedValueOnce(error);

      await expect(controller.delete(id)).rejects.toThrow('Destaque não encontrado');
    });

    it('should handle deletion with reordering side effects', async () => {
      const id = '4x5y6z7a-8b9c-0d1e-2f3g-4h5i6j7k8l9m';
      const expectedResult = {
        message: 'Destaque excluído com sucesso',
      };

      highlightService.delete.mockResolvedValueOnce(expectedResult as never);

      const result = await controller.delete(id);

      expect(result.message).toBe('Destaque excluído com sucesso');
      // Service handles reordering internally
    });
  });
});
