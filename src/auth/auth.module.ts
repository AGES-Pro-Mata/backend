import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AnalyticsModule } from 'src/analytics/analytics.module';
import { AnalyticsService } from 'src/analytics/analytics.service';
import { MailModule } from 'src/mail/mail.module';
import { StorageService } from 'src/storage/storage.service';

@Module({
  imports: [JwtModule, AnalyticsModule, MailModule],
  providers: [JwtService, AuthGuard, AuthService, AnalyticsService, StorageService],
  exports: [AuthGuard],
  controllers: [AuthController],
})

export class AuthModule {}
