import { Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AnalyticsModule } from 'src/analytics/analytics.module';
import { AnalyticsService } from 'src/analytics/analytics.service';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [JwtModule, AnalyticsModule, MailModule],
  providers: [JwtService, AuthGuard, AuthService, AnalyticsService],
  exports: [AuthGuard],
  controllers: [AuthController],
})
export class AuthModule {}
