import { Injectable } from '@nestjs/common';
import { AnalyticsService } from './analytics/analytics.service';

@Injectable()
export class AppService {
  constructor(private readonly analyticsService: AnalyticsService) {}
  async getHello() {
    await this.analyticsService.trackHello({
      message: 'Hello from Pró-Mata!',
    });
    return 'Hello from Pró-Mata!';
  }
}
