import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ChangePasswordDto, CreateUserFormDto, ForgotPasswordDto } from './auth.model';
import { UserType } from 'generated/prisma';
import { Roles } from './role/roles.decorator';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signUp')
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() body: CreateUserFormDto) {
    return await this.authService.createUser(body);
  }

  @Post('admin/signUp')
  @Roles(UserType.ADMIN, UserType.ROOT)
  async createUserAsAdmin(@Body() body: CreateUserFormDto) {
    return await this.authService.createUserAsAdmin(body);
  }

  @Public()
  @Get('forgot/:token')
  @HttpCode(HttpStatus.OK)
  async checkToken(@Param('token') token: string) {
    return await this.authService.checkToken(token);
  }

  @Public()
  @Post('forgot')
  @HttpCode(HttpStatus.NO_CONTENT)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Patch('forgot')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(@Body() changePasswordDto: ChangePasswordDto) {
    return await this.authService.changePassword(changePasswordDto);
  }
}
