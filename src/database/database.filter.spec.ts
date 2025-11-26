/* eslint-disable @typescript-eslint/unbound-method */

import { ArgumentsHost, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseExceptionFilter } from './database.filter';

describe('DatabaseExceptionFilter', () => {
  let filter: DatabaseExceptionFilter;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    filter = new DatabaseExceptionFilter();
    const logger = (filter as any).logger as Logger;
    loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  const createHost = (request: any): ArgumentsHost => {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ArgumentsHost;
  };

  it('should log and throw BadRequestException when P2002 with target', () => {
    const next = jest.fn();
    const request = { next } as any;
    const host = createHost(request);

    const exception: any = {
      code: 'P2002',
      meta: { target: 'email' },
    };

    const call = () => filter.catch(exception, host);

    expect(call).toThrow(BadRequestException);
    expect(call).toThrow('email já cadastrado');

    expect(loggerErrorSpy).toHaveBeenCalledWith(exception);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next when P2002 without target', () => {
    const next = jest.fn();
    const request = { next } as any;
    const host = createHost(request);

    const exception: any = {
      code: 'P2002',
      meta: {},
    };

    filter.catch(exception, host);

    expect(loggerErrorSpy).toHaveBeenCalledWith(exception);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should call next for other Prisma errors', () => {
    const next = jest.fn();
    const request = { next } as any;
    const host = createHost(request);

    const exception: any = {
      code: 'P2003',
      meta: { target: 'other' },
    };

    filter.catch(exception, host);

    expect(loggerErrorSpy).toHaveBeenCalledWith(exception);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
