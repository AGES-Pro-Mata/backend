import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Roles } from 'src/auth/role/roles.decorator';
import { UserType } from 'generated/prisma';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserSearchParamsDto, UpdateUserFormDto, CreateRootUserDto } from './user.model';
import { User } from './user.decorator';
import type { CurrentUser } from 'src/auth/auth.model';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Delete(':userId')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@User() user: CurrentUser, @Param('userId') userId: string) {
    if (user.id === userId) {
      throw new ForbiddenException('You cannot delete yourself');
    }

    await this.userService.deleteUser(userId);
  }

  @Patch(':userId')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateUserAsAdmin(
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserFormDto,
  ) {
    await this.userService.updateUser(userId, updateUserDto);
  }

  @Get(':userId')
  async getAdmin(@Param('userId') userId: string) {
    return await this.userService.getUser(userId);
  }

  @Patch()
  @Roles(UserType.GUEST, UserType.ADMIN)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateUser(@User() user: CurrentUser, @Body() updateUserDto: UpdateUserFormDto) {
    await this.userService.updateUser(user.id, updateUserDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @Roles(UserType.ADMIN)
  async searchUser(@Query() searchParams: UserSearchParamsDto) {
    return await this.userService.searchUser(searchParams);
  }

  @Post()
  @ApiBearerAuth('access-token')
  @Roles(UserType.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createUserAsAdmin(@User() user: CurrentUser, @Body() body: CreateRootUserDto) {
    return await this.userService.createRootUser(user.id, body);
  }
}
