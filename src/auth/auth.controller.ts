import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  CreateRootUserDto,
  CreateUserFormDto,
  type CurrentUser,
  ForgotPasswordDto,
  LoginDto,
} from './auth.model';
import { UserType } from 'generated/prisma';
import { Roles } from './role/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from 'src/user/user.decorator';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signUp')
  @UseInterceptors(FileInterceptor('arquivo'))
  @HttpCode(HttpStatus.CREATED)
  async createUser(@UploadedFile() arquivo: File, @Body() body: CreateUserFormDto) {
    return await this.authService.createUser(arquivo, body);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async verifyToken(@Req() req: Request) {
    return await this.authService.verifyToken(req);
  }

  @Post('dashboard/user')
  @ApiBearerAuth('access-token')
  @Roles(UserType.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createUserAsAdmin(@User() user: CurrentUser, @Body() body: CreateRootUserDto) {
    return await this.authService.createRootUser(user.id, body);
  }

  @Post('signIn')
  async signIn(@Body() body: LoginDto) {
    return this.authService.signIn(body);
  }

  @Get('forgot/:token')
  @HttpCode(HttpStatus.OK)
  async checkToken(@Param('token') token: string) {
    return await this.authService.checkToken(token);
  }

  @Post('forgot')
  @HttpCode(HttpStatus.NO_CONTENT)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto);
  }

  @Patch('forgot')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(@Body() changePasswordDto: ChangePasswordDto) {
    return await this.authService.changePassword(changePasswordDto);
  }
}
