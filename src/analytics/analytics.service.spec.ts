/* eslint-disable @typescript-eslint/unbound-method */

import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AnalyticsService } from './analytics.service';
import umami from '@umami/node';

jest.mock('@umami/node', () => ({
  __esModule: true,
  default: {
    init: jest.fn(),
    track: jest.fn(),
  },
}));

const mockedUmami = umami as unknown as {
  init: jest.Mock;
  track: jest.Mock;
};

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let configService: any;
  let loggerLogSpy: jest.SpyInstance;
  let loggerWarnSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;

  const originalEnv = process.env;

  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...originalEnv };

    mockedUmami.init.mockReset();
    mockedUmami.track.mockReset();

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'UMAMI_URL') return 'https://umami.example.com';
        if (key === 'UMAMI_WEBSITE_ID') return 'website-123';
        if (key === 'FRONTEND_URL') return 'https://frontend.example.com';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    configService = module.get(ConfigService);

    loggerLogSpy = jest.spyOn((service as any).logger as Logger, 'log').mockImplementation();
    loggerWarnSpy = jest.spyOn((service as any).logger as Logger, 'warn').mockImplementation();
    loggerErrorSpy = jest.spyOn((service as any).logger as Logger, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerLogSpy.mockRestore();
    loggerWarnSpy.mockRestore();
    loggerErrorSpy.mockRestore();
    process.env = originalEnv;
  });

  describe('onModuleInit / initializeUmami', () => {
    it('should skip initialization in test environment', async () => {
      process.env.NODE_ENV = 'test';

      await service.onModuleInit();

      expect(mockedUmami.init).not.toHaveBeenCalled();
      expect(loggerLogSpy).toHaveBeenCalledWith(
        'Test environment detected, skipping Umami initialization',
      );
    });

    it('should not initialize when configuration is missing', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'UMAMI_URL') return undefined;
        if (key === 'UMAMI_WEBSITE_ID') return undefined;
        return undefined;
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          {
            provide: ConfigService,
            useValue: configService,
          },
          AnalyticsService,
        ],
      }).compile();

      const localService = module.get<AnalyticsService>(AnalyticsService);
      const localLoggerWarnSpy = jest
        .spyOn((localService as any).logger as Logger, 'warn')
        .mockImplementation();

      process.env.NODE_ENV = 'development';

      await localService.onModuleInit();

      expect(mockedUmami.init).not.toHaveBeenCalled();
      expect(localLoggerWarnSpy).toHaveBeenCalledWith(
        'Umami configuration not found, analytics will be disabled',
      );

      localLoggerWarnSpy.mockRestore();
    });

    it('should initialize Umami when not in test env and config is present', async () => {
      process.env.NODE_ENV = 'development';

      await service.onModuleInit();

      expect(mockedUmami.init).toHaveBeenCalledWith({
        websiteId: 'website-123',
        hostUrl: 'https://umami.example.com',
      });
      expect(loggerLogSpy).toHaveBeenCalledWith(
        'Umami initialized successfully for website: website-123',
      );
    });
  });

  describe('trackHello / trackEvent', () => {
    it('should warn and skip tracking when Umami is not initialized', async () => {
      process.env.NODE_ENV = 'test';

      await service.trackHello({ message: 'hello' });

      expect(mockedUmami.track).not.toHaveBeenCalled();
      expect(loggerWarnSpy).toHaveBeenCalledWith('Umami not initialized, skipping event tracking');
    });

    it('should track hello event successfully when initialized', async () => {
      process.env.NODE_ENV = 'development';
      mockedUmami.track.mockResolvedValue({ status: 200, statusText: 'OK' } as never);

      await service.onModuleInit();

      await service.trackHello({ message: 'Hello from Pró-Mata!' });

      expect(mockedUmami.track).toHaveBeenCalledWith({
        hostname: 'promata-backend',
        url: '/api/hello',
        title: 'Hello Endpoint',
        name: 'hello',
        data: { message: 'Hello from Pró-Mata!' },
      });
    });

    it('should log error when tracking fails with non-200 response', async () => {
      process.env.NODE_ENV = 'development';
      mockedUmami.track.mockResolvedValue({
        status: 500,
        statusText: 'Internal Server Error',
      } as never);

      await service.onModuleInit();

      await service.trackHello({ message: 'error' });

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Failed to track event: Failed to track event: 500 Internal Server Error',
        ),
      );
    });
  });
});
