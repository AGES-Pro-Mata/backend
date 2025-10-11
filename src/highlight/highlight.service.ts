import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { HighlightCategory } from 'generated/prisma';
import {
  CATEGORY_LIMITS,
  CreateHighlightDto,
  HighlightQueryParamsDto,
  UpdateHighlightDto,
} from './highlight.model';
import { StorageService } from 'src/storage/storage.service';

@Injectable()
export class HighlightService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly storageService: StorageService,
  ) {}

  async findAll(queryParams: HighlightQueryParamsDto) {
    const where = queryParams.category ? { category: queryParams.category } : {};

    const [items, total] = await Promise.all([
      this.databaseService.highlight.findMany({
        where,
        orderBy: [{ category: 'asc' }, { order: 'asc' }],
        skip: queryParams.page * queryParams.limit,
        take: queryParams.limit,
      }),
      this.databaseService.highlight.count({ where }),
    ]);

    return {
      items,
      total,
      page: queryParams.page,
      limit: queryParams.limit,
    };
  }

  async findGrouped() {
    const highlights = await this.databaseService.highlight.findMany({
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    });

    const grouped: Record<HighlightCategory, typeof highlights> = {
      [HighlightCategory.LABORATORY]: [],
      [HighlightCategory.HOSTING]: [],
      [HighlightCategory.EVENT]: [],
      [HighlightCategory.TRAIL]: [],
      [HighlightCategory.CAROUSEL]: [],
    };

    highlights.forEach((highlight) => {
      grouped[highlight.category].push(highlight);
    });

    return grouped;
  }

  async findPublicGrouped() {
    const highlights = await this.databaseService.highlight.findMany({
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

    const grouped: Record<HighlightCategory, typeof highlights> = {
      [HighlightCategory.LABORATORY]: [],
      [HighlightCategory.HOSTING]: [],
      [HighlightCategory.EVENT]: [],
      [HighlightCategory.TRAIL]: [],
      [HighlightCategory.CAROUSEL]: [],
    };

    highlights.forEach((highlight) => {
      grouped[highlight.category].push(highlight);
    });

    return grouped;
  }

  async findOne(id: string) {
    const highlight = await this.databaseService.highlight.findUnique({
      where: { id },
    });

    if (!highlight) {
      throw new NotFoundException('Destaque não encontrado');
    }

    return highlight;
  }

  async create(createDto: CreateHighlightDto, file?: Express.Multer.File | null) {
    if (!file) {
      throw new BadRequestException('Imagem é obrigatória');
    }

    const count = await this.databaseService.highlight.count({
      where: { category: createDto.category },
    });

    const limit = CATEGORY_LIMITS[createDto.category];
    if (count >= limit) {
      throw new BadRequestException('Limite de imagens atingido para esta categoria');
    }

    let order = createDto.order;
    if (!order) {
      const maxOrder = await this.databaseService.highlight.findFirst({
        where: { category: createDto.category },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      order = maxOrder ? maxOrder.order + 1 : 1;
    }

    const existing = await this.databaseService.highlight.findFirst({
      where: {
        category: createDto.category,
        order,
      },
    });

    if (existing) {
      throw new BadRequestException('Já existe um destaque com essa ordem nesta categoria');
    }

    const uploaded = await this.storageService.uploadFile(file, {
      directory: 'highlights',
      contentType: file.mimetype ?? undefined,
      cacheControl: 'public, max-age=31536000',
    });

    try {
      return await this.databaseService.highlight.create({
        data: {
          category: createDto.category,
          imageUrl: uploaded.url,
          title: createDto.title,
          description: createDto.description === '' ? null : (createDto.description ?? null),
          order,
        },
      });
    } catch (error) {
      await this.storageService.deleteFileByUrl(uploaded.url);
      throw error;
    }
  }

  async update(id: string, updateDto: UpdateHighlightDto, file?: Express.Multer.File | null) {
    const highlight = await this.databaseService.highlight.findUnique({
      where: { id },
    });

    if (!highlight) {
      throw new NotFoundException('Destaque não encontrado');
    }

    if (updateDto.order && updateDto.order !== highlight.order) {
      const existing = await this.databaseService.highlight.findFirst({
        where: {
          category: highlight.category,
          order: updateDto.order,
          id: { not: id },
        },
      });

      if (existing) {
        throw new BadRequestException('Já existe um destaque com essa ordem nesta categoria');
      }
    }

    let uploaded: { url: string } | undefined;

    if (file) {
      uploaded = await this.storageService.uploadFile(file, {
        directory: 'highlights',
        contentType: file.mimetype ?? undefined,
        cacheControl: 'public, max-age=31536000',
      });
    }

    try {
      const updated = await this.databaseService.highlight.update({
        where: { id },
        data: {
          title: updateDto.title,
          description: updateDto.description === '' ? null : (updateDto.description ?? undefined),
          order: updateDto.order,
          ...(uploaded ? { imageUrl: uploaded.url } : {}),
        },
      });

      if (uploaded) {
        await this.storageService.deleteFileByUrl(highlight.imageUrl);
      }

      return updated;
    } catch (error) {
      if (uploaded) {
        await this.storageService.deleteFileByUrl(uploaded.url);
      }

      throw error;
    }
  }

  async delete(id: string) {
    const highlight = await this.databaseService.highlight.findUnique({
      where: { id },
    });

    if (!highlight) {
      throw new NotFoundException('Destaque não encontrado');
    }

    await this.databaseService.highlight.delete({
      where: { id },
    });

    const toReorder = await this.databaseService.highlight.findMany({
      where: {
        category: highlight.category,
        order: { gt: highlight.order },
      },
      orderBy: { order: 'asc' },
    });

    for (const item of toReorder) {
      await this.databaseService.highlight.update({
        where: { id: item.id },
        data: { order: item.order - 1 },
      });
    }

    await this.storageService.deleteFileByUrl(highlight.imageUrl);

    return { message: 'Destaque excluído com sucesso' };
  }
}
