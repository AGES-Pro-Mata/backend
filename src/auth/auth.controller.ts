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
import { ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserType } from 'generated/prisma';
import { User } from 'src/user/user.decorator';
import {
  ChangePasswordDto,
  CreateRootUserDto,
  CreateUserFormDto,
  type CurrentUser,
  ForgotPasswordDto,
  LoginDto,
} from './auth.model';
import { AuthService } from './auth.service';
import { Roles } from './role/roles.decorator';
import type { Express } from 'express';
import { memoryStorage } from 'multer';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signUp')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('arquivo', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          return cb(null, true);
        }
        return cb(null, false);
      },
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @UploadedFile() arquivo: Express.Multer.File | undefined,
    @Body() body: CreateUserFormDto,
  ) {
    return await this.authService.createUser(arquivo, body);
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
    return { message: 'Email de recuperação enviado com sucesso.' };
  }

  @Patch('forgot')
  @HttpCode(HttpStatus.OK)
  async changePassword(@Body() changePasswordDto: ChangePasswordDto) {
    return await this.authService.changePassword(changePasswordDto);
  }

  @Get('profile')
  @Roles(UserType.GUEST, UserType.ADMIN)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  async findProfile(@User() user: CurrentUser) {
    return await this.authService.findProfile(user.id);
  }

  @Post('create-root-user')
  @ApiBearerAuth('access-token')
  @Roles(UserType.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createUserAsAdmin(@User() user: CurrentUser, @Body() body: CreateRootUserDto) {
    return await this.authService.createRootUser(user.id, body);
  }
}
