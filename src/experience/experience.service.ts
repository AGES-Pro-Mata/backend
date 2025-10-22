import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { Prisma } from 'generated/prisma';
import {
  CreateExperienceFormDto,
  ExperienceSearchParamsDto,
  UpdateExperienceFormDto,
} from './experience.model';
import { StorageService } from 'src/storage/storage.service';

@Injectable()
export class ExperienceService {
  constructor(private readonly databaseService: DatabaseService, private readonly storageService: StorageService,) {}

  async deleteExperience(experienceId: string) {
    await this.databaseService.experience.update({
      where: { id: experienceId },
      data: { active: false },
    });
  }

  async updateExperience(experienceId: string, updateExperienceDto: UpdateExperienceFormDto) {
    let imageId: string | undefined = undefined;

    if (updateExperienceDto.experienceImage) {
      const image = await this.databaseService.image.findUnique({
        where: { url: updateExperienceDto.experienceImage },
      });

      if (!image) {
        throw new BadRequestException('Imagem inválida');
      }

      imageId = image.id;
    }

    await this.databaseService.experience.update({
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
      active: true,
    };

    const experiences = await this.databaseService.experience.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        startDate: true,
        endDate: true,
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

  async createExperience(createExperienceDto: CreateExperienceFormDto, file?: Express.Multer.File | null) {
    if (!file){
      throw new BadRequestException('Imagem é obrigatória');
    }

    const uploaded = await this.storageService.uploadFile(file, {
      directory: 'experience',
      contentType: file.mimetype ?? undefined,
      cacheControl: 'public, max-age=31536000',
    });

    await this.databaseService.experience.create({
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
        imageId: uploaded.url,
      },
    });
  }
}
