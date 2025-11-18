import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';

import { AuthGuard } from './auth.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { AnalyticsModule } from 'src/analytics/analytics.module';
import { AnalyticsService } from 'src/analytics/analytics.service';
import { MailModule } from 'src/mail/mail.module';
import { DatabaseModule } from 'src/database/database.module';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [JwtModule, AnalyticsModule, MailModule, DatabaseModule, StorageModule],
  providers: [JwtService, AuthGuard, AuthService, AnalyticsService],
  exports: [AuthGuard],
  controllers: [AuthController],
})
export class AuthModule {}