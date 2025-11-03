import { Module } from '@nestjs/common';
import { AnalyticsModule } from 'src/analytics/analytics.module';
import { AnalyticsService } from 'src/analytics/analytics.service';
import { StorageService } from 'src/storage/storage.service';
import { ExperienceController } from './experience.controller';
import { ExperienceService } from './experience.service';

@Module({
  imports: [AnalyticsModule],
  providers: [ExperienceService, AnalyticsService, StorageService],
  controllers: [ExperienceController],
})
export class ExperienceModule {}
