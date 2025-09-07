import { Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET, 
    })
  ],
  providers: [AuthGuard, AuthService],
  exports: [AuthGuard],
  controllers: [AuthController],
})
export class AuthModule {}
