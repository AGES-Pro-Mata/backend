import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import umami from '@umami/node';

@Injectable()
export class AnalyticsService implements OnModuleInit {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly umamiUrl: string | undefined;
  private readonly umamiWebsiteId: string | undefined;
  private isInitialized = false;

  private get isTestEnv(): boolean {
    return process.env.NODE_ENV === 'test' || process.env.CI === 'true';
  }

  constructor(private readonly configService: ConfigService) {
    this.umamiUrl = this.configService.get<string>('UMAMI_URL');
    this.umamiWebsiteId = this.configService.get<string>('UMAMI_WEBSITE_ID');
  }

  async onModuleInit() {
    await this.initializeUmami();
  }

  private async initializeUmami(): Promise<void> {
    if (this.isTestEnv) {
      this.logger.log('Test environment detected, skipping Umami initialization');
      return;
    }

    if (!this.umamiUrl || !this.umamiWebsiteId) {
      this.logger.warn('Umami configuration not found, analytics will be disabled');
      return;
    }

    try {
      umami.init({
        websiteId: this.umamiWebsiteId,
        hostUrl: this.umamiUrl,
      });

      this.isInitialized = true;
      this.logger.log(`Umami initialized successfully for website: ${this.umamiWebsiteId}`);
    } catch (error) {
      this.logger.error(`Failed to initialize Umami: ${error.message}`);
    }
  }

  private async trackEvent(options: {
    url: string;
    title?: string;
    name?: string;
    data?: Record<string, any>;
  }): Promise<void> {
    if (!this.isInitialized) {
      this.logger.warn('Umami not initialized, skipping event tracking');
      return;
    }

    try {
      const response = await umami.track({
        hostname: 'promata-backend',
        url: options.url,
        title: options.title,
        name: options.name,
        data: options.data,
      });

      if (response.status !== 200) {
        throw new Error(`Failed to track event: ${response.status} ${response.statusText}`);
      }

      this.logger.log(
        `Event tracked successfully: ${options.name || 'page_view'} on ${options.url} - ${response.status} ${response.statusText}`,
      );
    } catch (error) {
      this.logger.error(`Failed to track event: ${error.message}`);
    }
  }

  async trackHello(userData: { message: string }): Promise<void> {
    await this.trackEvent({
      url: '/api/hello',
      title: 'Hello Endpoint',
      name: 'hello',
      data: {
        message: userData.message,
      },
    });
  }

  async trackSignUp(userData: {
    uuid: string;
    city: string;
    country: string;
    role: string;
  }): Promise<void> {
    await this.trackEvent({
      url: '/api/auth/signup',
      title: 'User Registration',
      name: 'sign_up',
      data: {
        uuid: userData.uuid,
        city: userData.city,
        country: userData.country,
        role: userData.role,
      },
    });
  }

  async trackPasswordChange(userId: string): Promise<void> {
    await this.trackEvent({
      url: '/api/auth/changePassword',
      title: 'User Change Password',
      name: 'change_password',
      data: {
        id: userId,
      },
    });
  }
}
