import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ChangePasswordDto, CreateUserFormDto, ForgotPasswordDto } from './auth.model';
import { UserType } from 'generated/prisma';
import { Roles } from './role/roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signUp')
  async createUser(@Body() body: CreateUserFormDto) {
    await this.authService.createUser(body);
  }

  @Post('dashboard/user')
  @Roles(UserType.ADMIN)
  async createUserAsAdmin() {
    // TODO: This will be implemented on task #31
  }

  @Post('forgot')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('changePassword')
  async changePassword(@Body() changePasswordDto: ChangePasswordDto) {
    await this.authService.changePassword(changePasswordDto);
  }
}
