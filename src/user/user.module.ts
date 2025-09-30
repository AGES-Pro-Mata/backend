import { Module } from '@nestjs/common';
import { AnalyticsModule } from 'src/analytics/analytics.module';
import { AnalyticsService } from 'src/analytics/analytics.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ObfuscateModule } from 'src/obfuscate/obfuscate.module';

@Module({
  imports: [AnalyticsModule, ObfuscateModule],
  providers: [UserService, AnalyticsService],
  controllers: [UserController],
})
export class UserModule {}
