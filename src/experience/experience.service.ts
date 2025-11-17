import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { StorageService } from 'src/storage/storage.service';
import { Prisma } from 'generated/prisma';
import {
  CreateExperienceFormDto,
  ExperienceSearchParamsDto,
  GetExperienceFilterDto,
  UpdateExperienceFormDto,
} from './experience.model';

@Injectable()
export class ExperienceService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly storageService: StorageService,
  ) {}

  async getExperience(experienceId: string) {
    const experience = await this.databaseService.experience.findUnique({
      where: { id: experienceId },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        capacity: true,
        startDate: true,
        endDate: true,
        price: true,
        weekDays: true,
        durationMinutes: true,
        trailDifficulty: true,
        trailLength: true,
        professorShouldPay: true,
        image: {
          select: {
            url: true,
          },
        },
      },
    });

    if (!experience) {
      throw new NotFoundException('Experiência não encontrada');
    }

    return experience;
  }

  async deleteExperience(experienceId: string) {
    await this.databaseService.experience.update({
      where: { id: experienceId },
      data: { active: false },
    });
  }

  async toggleExperienceStatus(experienceId: string, active: boolean) {
    const experience = await this.databaseService.experience.findUnique({
      where: { id: experienceId },
    });

    if (!experience) {
      throw new NotFoundException('Experiência não encontrada');
    }

    await this.databaseService.experience.update({
      where: { id: experienceId },
      data: { active },
    });
  }

  async updateExperience(
    experienceId: string,
    updateExperienceDto: UpdateExperienceFormDto,
    file?: Express.Multer.File | null,
  ) {
    return await this.databaseService.$transaction(async (tx) => {
      let imageId: string | undefined = undefined;

      if (file) {
        const uploaded = await this.storageService.uploadFile(file, {
          directory: 'experiences',
          contentType: file.mimetype ?? undefined,
          cacheControl: 'public, max-age=31536000',
        });

        const createdImage = await tx.image.create({
          data: { url: uploaded.url },
        });
      }

      return await tx.experience.update({
        where: { id: experienceId },
        data: {
          name: updateExperienceDto.experienceName,
          description: updateExperienceDto.experienceDescription,
          category: updateExperienceDto.experienceCategory,
          capacity: updateExperienceDto.experienceCapacity,
          startDate: updateExperienceDto.experienceStartDate,
          endDate: updateExperienceDto.experienceEndDate,
          price: updateExperienceDto.experiencePrice,
          weekDays: updateExperienceDto.experienceWeekDays,
          durationMinutes: updateExperienceDto.trailDurationMinutes,
          trailDifficulty: updateExperienceDto.trailDifficulty,
          trailLength: updateExperienceDto.trailLength,
          imageId,
        },
      });
    });
  }

  async searchExperience(experienceSearchParamsDto: ExperienceSearchParamsDto) {
    const where: Prisma.ExperienceWhereInput = {
      name: {
        contains: experienceSearchParamsDto.name,
      },
      description: {
        contains: experienceSearchParamsDto.description,
      },
      startDate: {
        lte: experienceSearchParamsDto.date,
      },
      endDate: {
        gte: experienceSearchParamsDto.date,
      },
    };

    const experiences = await this.databaseService.experience.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        startDate: true,
        endDate: true,
        active: true,
      },
      orderBy: {
        [experienceSearchParamsDto.sort]: experienceSearchParamsDto.dir,
      },
      skip: experienceSearchParamsDto.limit * experienceSearchParamsDto.page,
      take: experienceSearchParamsDto.limit,
    });

    const total = await this.databaseService.experience.count({ where });

    return {
      page: experienceSearchParamsDto.page,
      limit: experienceSearchParamsDto.limit,
      total,
      items: experiences,
    };
  }

  async createExperience(
  createExperienceDto: CreateExperienceFormDto,
  file?: Express.Multer.File | null,
) {
  return await this.databaseService.$transaction(async (tx) => {
    let imageId: string | undefined = undefined;

    if (file) {
      const uploaded = await this.storageService.uploadFile(file, {
        directory: 'experiences',
        contentType: file.mimetype ?? undefined,
        cacheControl: 'public, max-age=31536000',
      });

      const createdImage = await tx.image.create({
        data: { url: uploaded.url },
      });

      imageId = createdImage.id;
    }

    return await tx.experience.create({
      data: {
        name: createExperienceDto.experienceName,
        description: createExperienceDto.experienceDescription,
        category: createExperienceDto.experienceCategory,
        capacity: createExperienceDto.experienceCapacity,
        startDate: createExperienceDto.experienceStartDate,
        endDate: createExperienceDto.experienceEndDate,
        price: createExperienceDto.experiencePrice,
        weekDays: createExperienceDto.experienceWeekDays,
        durationMinutes: createExperienceDto.trailDurationMinutes,
        trailDifficulty: createExperienceDto.trailDifficulty,
        trailLength: createExperienceDto.trailLength,
        active: true,
        imageId,
      },
    });
  });
}

  async getExperienceFilter(getExperienceFilterDto: GetExperienceFilterDto) {
    const where: Prisma.ExperienceWhereInput = {
      category: getExperienceFilterDto.category,
      startDate: {
        gte: getExperienceFilterDto.startDate,
      },
      endDate: {
        lte: getExperienceFilterDto.endDate,
      },
      name: {
        contains: getExperienceFilterDto.search,
        mode: 'insensitive',
      },
    };

    const experiences = await this.databaseService.experience.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        active: true,
        category: true,
        capacity: true,
        startDate: true,
        endDate: true,
        price: true,
        weekDays: true,
        durationMinutes: true,
        trailDifficulty: true,
        trailLength: true,
        image: {
          select: {
            url: true,
          },
        },
      },

      skip: getExperienceFilterDto.limit * getExperienceFilterDto.page,
      take: getExperienceFilterDto.limit,
    });

    const total = await this.databaseService.experience.count({ where });

    return {
      page: getExperienceFilterDto.page,
      limit: getExperienceFilterDto.limit,
      total,
      items: experiences,
    };
  }
}
