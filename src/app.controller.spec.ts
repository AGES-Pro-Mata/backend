import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnalyticsService } from './analytics/analytics.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: AnalyticsService,
          useValue: {
            trackHello: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    appController = module.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello from Pró-Mata!"', async () => {
      await expect(appController.getHello()).resolves.toBe('Hello from Pró-Mata!');
    });
  });
});
