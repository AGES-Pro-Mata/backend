import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Roles } from 'src/auth/role/roles.decorator';
import { UserType } from 'generated/prisma';
import { ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { UserSearchParamsDto, UpdateUserFormDto, UpdateUserAdminFormDto } from './user.model';
import { User } from './user.decorator';
import type { CurrentUser } from 'src/auth/auth.model';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Delete(':userId')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@User() user: CurrentUser, @Param('userId') userId: string) {
    await this.userService.deleteUser(userId, user.id);
  }

  @Patch(':userId')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateUserAsAdmin(
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserAdminFormDto,
  ) {
    await this.userService.updateUser(userId, updateUserDto, null);
  }

  @Get(':userId')
  async getAdmin(@Param('userId') userId: string) {
    return await this.userService.getUser(userId);
  }

  @Patch()
  @Roles(UserType.GUEST, UserType.ADMIN)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseInterceptors(FileInterceptor('teacherDocument'))
  @ApiConsumes('multipart/form-data')
  async updateUser(
    @User() user: CurrentUser,
    @Body() updateUserDto: UpdateUserFormDto,
    @UploadedFile() file: Express.Multer.File | null,
  ) {
    await this.userService.updateUser(user.id, updateUserDto, file);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @Roles(UserType.ADMIN)
  async searchUser(@Query() searchParams: UserSearchParamsDto) {
    return await this.userService.searchUser(searchParams);
  }
}
