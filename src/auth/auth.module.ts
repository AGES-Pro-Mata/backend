import { Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AnalyticsModule } from 'src/analytics/analytics.module';
import { MailModule } from 'src/mail/mail.module';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [JwtModule, AnalyticsModule, MailModule, StorageModule],
  providers: [AuthGuard, AuthService],
  exports: [AuthGuard],
  controllers: [AuthController],
})
export class AuthModule {}
