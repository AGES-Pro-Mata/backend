import { Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AnalyticsModule } from 'src/analytics/analytics.module';
import { AnalyticsService } from 'src/analytics/analytics.service';

@Module({
  imports: [JwtModule, AnalyticsModule],
  providers: [JwtService, AuthGuard, AuthService, AnalyticsService],
  exports: [AuthGuard],
  controllers: [AuthController],
})
export class AuthModule {}
