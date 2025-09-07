import { Module } from '@nestjs/common';
import { AnalyticsModule } from 'src/analytics/analytics.module';
import { AnalyticsService } from 'src/analytics/analytics.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [AnalyticsModule],
  providers: [UserService, AnalyticsService],
  controllers: [UserController],
})
export class UserModule {}
