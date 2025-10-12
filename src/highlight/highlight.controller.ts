import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UserType } from 'generated/prisma';
import { Roles } from 'src/auth/role/roles.decorator';
import { HighlightService } from './highlight.service';
import {
  CreateHighlightDto,
  HighlightQueryParamsDto,
  UpdateHighlightDto,
} from './highlight.model';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('highlights')
@Controller('highlights')
export class HighlightController {
  constructor(private readonly highlightService: HighlightService) {}

  @Get('public/grouped')
  @HttpCode(HttpStatus.OK)
  async findPublicGrouped() {
    return await this.highlightService.findPublicGrouped();
  }

  @Get()
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() queryParams: HighlightQueryParamsDto) {
    return await this.highlightService.findAll(queryParams);
  }

  @Get('grouped')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  async findGrouped() {
    return await this.highlightService.findGrouped();
  }

  @Get(':id')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return await this.highlightService.findOne(id);
  }

  @Post()
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateHighlightDto,
    @UploadedFile() file: Express.Multer.File | null,
  ) {
    return await this.highlightService.create(createDto, file);
  }

  @Put(':id')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateHighlightDto,
    @UploadedFile() file: Express.Multer.File | null,
  ) {
    return await this.highlightService.update(id, updateDto, file);
  }

  @Delete(':id')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    return await this.highlightService.delete(id);
  }
}
