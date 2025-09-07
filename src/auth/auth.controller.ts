import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  CreateRootUserDto,
  CreateUserFormDto,
  ForgotPasswordDto,
  LoginDto,
} from './auth.model';
import { UserType } from 'generated/prisma';
import { Roles } from './role/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signUp')
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() body: CreateUserFormDto) {
    return await this.authService.createUser(body);
  }

  @Post('dashboard/user')
  @ApiBearerAuth('access-token')
  @Roles(UserType.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createUserAsAdmin(@Body() body: CreateRootUserDto) {
    return await this.authService.createRootUser(body);
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
