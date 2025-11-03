import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes } from '@nestjs/swagger';
import { ExperienceService } from './experience.service';
import { Roles } from 'src/auth/role/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserType } from 'generated/prisma';
import {
  CreateExperienceFormDto,
  ExperienceSearchParamsDto,
  UpdateExperienceFormDto,
  GetExperienceFilterDto,
} from './experience.model';

@Controller('experience')
export class ExperienceController {
  constructor(private readonly experienceService: ExperienceService) {}

  @Delete(':experienceId')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteExperience(@Param('experienceId') experienceId: string) {
    await this.experienceService.deleteExperience(experienceId);
  }

  @Patch(':experienceId')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateExperienceAsAdmin(
    @Param('experienceId') experienceId: string,
    @Body() updateExperienceDto: UpdateExperienceFormDto,
    @UploadedFile() file: Express.Multer.File | null,
  ) {
    await this.experienceService.updateExperience(experienceId, updateExperienceDto, file);
  }

  @Get()
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  async searchExperience(@Query() experienceSearchParamsDto: ExperienceSearchParamsDto) {
    return await this.experienceService.searchExperience(experienceSearchParamsDto);
  }

  @Post()
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  @HttpCode(HttpStatus.CREATED)
  async createExperienceAsAdmin(
    @Body() createExperienceDto: CreateExperienceFormDto,
    @UploadedFile() file: Express.Multer.File | null,
  ) {
    return await this.experienceService.createExperience(createExperienceDto, file);
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  async getExperienceFilter(@Query() getExperienceFilterDto: GetExperienceFilterDto) {
    return await this.experienceService.getExperienceFilter(getExperienceFilterDto);
  }

  @Get(':experienceId')
  @HttpCode(HttpStatus.OK)
  async getExperience(@Param('experienceId') experienceId: string) {
    return await this.experienceService.getExperience(experienceId);
  }
}
