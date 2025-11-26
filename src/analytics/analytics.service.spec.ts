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
  });

  describe('trackHello / trackEvent', () => {
    it('should warn and skip tracking when Umami is not initialized', async () => {
      process.env.NODE_ENV = 'test';

      await service.trackHello({ message: 'hello' });

      expect(mockedUmami.track).not.toHaveBeenCalled();
      expect(loggerWarnSpy).toHaveBeenCalledWith('Umami not initialized, skipping event tracking');
    });
  });
});
