import { Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [JwtModule],
  providers: [JwtService, AuthGuard, AuthService],
  exports: [AuthGuard],
  controllers: [AuthController],
})
export class AuthModule {}
