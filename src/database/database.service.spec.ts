/* eslint-disable @typescript-eslint/unbound-method */

import { Logger } from '@nestjs/common';
import { DatabaseService } from './database.service';

describe('DatabaseService', () => {
  let service: DatabaseService;
  let loggerLogSpy: jest.SpyInstance;
  let loggerFatalSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new DatabaseService();

    const logger = (service as any).logger as Logger;
    loggerLogSpy = jest.spyOn(logger, 'log').mockImplementation();
    // @ts-expect-error Nest Logger may not declare fatal in typings, but it exists at runtime
    loggerFatalSpy = jest.spyOn(logger as any, 'fatal').mockImplementation();
  });

  afterEach(() => {
    loggerLogSpy.mockRestore();
    loggerFatalSpy.mockRestore();
  });

  describe('onModuleInit', () => {
    it('should connect to the database and log success', async () => {
      const connectMock = jest.fn().mockResolvedValue(undefined);
      (service as any).$connect = connectMock;

      await service.onModuleInit();

      expect(connectMock).toHaveBeenCalledTimes(1);
      expect(loggerLogSpy).toHaveBeenCalledWith('Connected to the database');
      expect(loggerFatalSpy).not.toHaveBeenCalled();
    });

    it('should log fatal and rethrow error when connection fails', async () => {
      const error = new Error('connection failed');
      const connectMock = jest.fn().mockRejectedValue(error);
      (service as any).$connect = connectMock;

      await expect(service.onModuleInit()).rejects.toBe(error);
      expect(loggerFatalSpy).toHaveBeenCalledWith(`Failed to connected to the database: ${error}`);
    });
  });

  describe('onModuleDestroy', () => {
    const originalEnv = process.env;

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should disconnect from database and log message', async () => {
      const disconnectMock = jest.fn().mockResolvedValue(undefined);
      (service as any).$disconnect = disconnectMock;

      process.env = { ...originalEnv, DATABASE_URL: 'postgres://user:pass@localhost/db' };

      await service.onModuleDestroy();

      expect(disconnectMock).toHaveBeenCalledTimes(1);
      expect(loggerLogSpy).toHaveBeenCalledWith(
        'Disconnected to postgres://user:pass@localhost/db database',
      );
    });
  });
});
