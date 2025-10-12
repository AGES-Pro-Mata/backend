/* eslint-disable @typescript-eslint/unbound-method */

import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ExecutionContext, Logger } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { DatabaseService } from 'src/database/database.service';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

type Req = {
  headers: Record<string, string | undefined>;
  header: (name: string) => string | undefined;
  user?: any;
};

function makeRequest(headers: Record<string, string | undefined>): Req {
  return {
    headers,
    header: (name: string) => headers[name.toLowerCase()],
  };
}

function makeExecutionContext(req: Req): ExecutionContext {
  const ctx = {
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as ExecutionContext;
  return ctx;
}

describe('AuthGuard', () => {
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let databaseService: jest.Mocked<DatabaseService>;

  let fatalSpy: jest.SpiedFunction<typeof Logger.prototype.fatal>;
  let errorSpy: jest.SpiedFunction<typeof Logger.prototype.error>;

  beforeAll(() => {
    fatalSpy = jest.spyOn(Logger.prototype, 'fatal').mockImplementation(() => undefined);
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => {
    fatalSpy.mockRestore();
    errorSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    jwtService = {
      verifyAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    configService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    databaseService = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7',
          userType: 'ADMIN',
        }),
      },
    } as unknown as jest.Mocked<DatabaseService>;
  });

  it('logs fatal when JWT_SECRET is missing (constructor path)', () => {
    configService.get.mockReturnValue(undefined);

    // @ts-expect-no-error
    new AuthGuard(jwtService, configService, databaseService);

    expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
    expect(fatalSpy).toHaveBeenCalledWith('JWT_SECRET was not setted.');
  });

  it('throws Unauthorized when Authorization header is missing', async () => {
    configService.get.mockReturnValue('super-secret');
    const guard = new AuthGuard(jwtService, configService, databaseService);

    const req = makeRequest({});
    const ctx = makeExecutionContext(req);

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(errorSpy).toHaveBeenCalledWith('`Authorization` header was not present');
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('throws Unauthorized when Authorization scheme is not Bearer', async () => {
    configService.get.mockReturnValue('super-secret');
    const guard = new AuthGuard(jwtService, configService, databaseService);

    const req = makeRequest({ authorization: 'Basic abcdef' });
    const ctx = makeExecutionContext(req);

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(errorSpy).toHaveBeenCalledWith('The authorization token must be in a `Bearer` pattern');
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('throws Unauthorized when jwtService.verifyAsync rejects (invalid token)', async () => {
    configService.get.mockReturnValue('super-secret');
    const guard = new AuthGuard(jwtService, configService, databaseService);

    const token = 'bad.token.here';
    const req = makeRequest({ authorization: `Bearer ${token}` });
    const ctx = makeExecutionContext(req);

    jwtService.verifyAsync.mockRejectedValueOnce(new Error('boom'));

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, { secret: 'super-secret' });
    expect(errorSpy).toHaveBeenCalledWith(`Invalid token: ${token}`);
  });

  it('throws Unauthorized("Invalid token payload") when schema validation fails', async () => {
    configService.get.mockReturnValue('super-secret');
    const guard = new AuthGuard(jwtService, configService, databaseService);

    const token = 'good.token.but.bad.payload';
    const req = makeRequest({ authorization: `Bearer ${token}` });
    const ctx = makeExecutionContext(req);

    jwtService.verifyAsync.mockResolvedValueOnce({ sub: 'not-a-uuid', userType: '???' } as never);

    await expect(guard.canActivate(ctx)).rejects.toEqual(
      new UnauthorizedException('Invalid token payload'),
    );

    expect(errorSpy).toHaveBeenCalled();
  });

  it('returns true and attaches request.user on valid token + payload', async () => {
    configService.get.mockReturnValue('super-secret');
    const guard = new AuthGuard(jwtService, configService, databaseService);

    const token = 'valid.token';
    const req = makeRequest({ authorization: `Bearer ${token}` });
    const ctx = makeExecutionContext(req);

    const goodPayload = {
      sub: '1b7b4b0a-1e67-41af-9f0f-4a11f3e8a9f7',
      userType: 'ADMIN',
    };

    jwtService.verifyAsync.mockResolvedValueOnce(goodPayload as never);

    await expect(guard.canActivate(ctx)).resolves.toBe(true);

    expect((req as Mutable<Req>).user).toEqual({
      id: goodPayload.sub,
      userType: goodPayload.userType,
    });

    expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, { secret: 'super-secret' });
  });
});
