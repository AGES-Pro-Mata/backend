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
} from '@nestjs/common';
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
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateExperienceAsAdmin(
    @Param('experienceId') experienceId: string,
    @Body() updateExperienceDto: UpdateExperienceFormDto,
  ) {
    await this.experienceService.updateExperience(experienceId, updateExperienceDto);
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
  async createExperienceAsAdmin(@Body() createExperienceDto: CreateExperienceFormDto) {
    return await this.experienceService.createExperience(createExperienceDto);
  }

  @Get('search')
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  async getExperienceFilter(@Query() getExperienceFilterDto: GetExperienceFilterDto) {
    return await this.experienceService.getExperienceFilter(getExperienceFilterDto);
  }
}
