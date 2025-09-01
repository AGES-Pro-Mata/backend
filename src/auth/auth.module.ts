import { Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { JwtModule, JwtService } from '@nestjs/jwt';

@Module({
  imports: [JwtModule],
  providers: [JwtService, AuthGuard],
  exports: [AuthGuard],
})
export class AuthModule {}
