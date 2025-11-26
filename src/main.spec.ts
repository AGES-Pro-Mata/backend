/* eslint-disable @typescript-eslint/unbound-method */

import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn(),
  },
}));

jest.mock('@nestjs/swagger', () => ({
  DocumentBuilder: jest.fn().mockImplementation(() => ({
    setTitle: jest.fn().mockReturnThis(),
    addBearerAuth: jest.fn().mockReturnThis(),
    setVersion: jest.fn().mockReturnThis(),
    build: jest.fn().mockReturnValue({}),
  })),
  SwaggerModule: {
    createDocument: jest.fn(() => ({})),
    setup: jest.fn(),
  },
  ApiConsumes: jest.fn(() => () => undefined),
  ApiBearerAuth: jest.fn(() => () => undefined),
  ApiOperation: jest.fn(() => () => undefined),
  ApiResponse: jest.fn(() => () => undefined),
  ApiTags: jest.fn(() => () => undefined),
}));

describe('bootstrap (main.ts)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should configure CORS, setup Swagger and start listening', async () => {
    const mockApp: any = {
      enableCors: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
    };

    (NestFactory.create as jest.Mock).mockResolvedValue(mockApp);

    process.env.PORT = '4000';

    // require main.ts so that bootstrap runs, then wait a microtask tick
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('./main');
    await Promise.resolve();

    expect(NestFactory.create).toHaveBeenCalled();

    expect(mockApp.enableCors).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: expect.arrayContaining(['http://localhost:3002', 'http://localhost:3001']),
        methods: expect.arrayContaining(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']),
        allowedHeaders: expect.arrayContaining(['Content-Type', 'Authorization']),
        credentials: true,
      }),
    );

    expect(mockApp.listen).toHaveBeenCalledWith('4000');

    expect(SwaggerModule.setup).toHaveBeenCalledWith('api', mockApp, expect.any(Function));
  });
});
