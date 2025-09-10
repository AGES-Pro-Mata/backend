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
} from '@nestjs/common';
import { UserService } from './user.service';
import { Roles } from 'src/auth/role/roles.decorator';
import { UserType } from 'generated/prisma';
import { ApiBearerAuth } from '@nestjs/swagger';
import { SearchParamsDto, UpdateUserFormDto } from './user.model';
import { User } from './user.decorator';
import type { CurrentUser } from 'src/auth/auth.model';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Delete(':userId')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('userId') userId: string) {
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
  async searchUser(@Query() searchParams: SearchParamsDto) {
    return await this.userService.searchUser(searchParams);
  }
}
