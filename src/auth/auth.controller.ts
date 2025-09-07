import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
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
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signUp')
  @UseInterceptors(FileInterceptor('arquivo'))
  @HttpCode(HttpStatus.CREATED)
  async createUser(@UploadedFile() arquivo: File, @Body() body: CreateUserFormDto) {
    return await this.authService.createUser(arquivo, body);
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
