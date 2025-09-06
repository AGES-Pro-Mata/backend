import { Reflector } from '@nestjs/core';
import { RoleGuard } from './role.guard';
import { ExecutionContext } from '@nestjs/common';
import { UserType } from 'generated/prisma';
import { AuthGuard } from '../auth.guard';

describe('RoleGuard', () => {
  let reflector: Reflector;
  let authGuard: AuthGuard;
  let guard: RoleGuard;

  const makeExecutionContext = (userRole?: UserType): ExecutionContext => {
    const req = { user: { userType: userRole } };

    const context = {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;

    return context;
  };

  beforeEach(() => {
    reflector = {
      get: jest.fn(),
      getAllAndOverride: jest.fn(),
    } as unknown as Reflector;

    authGuard = {
      canActivate: async () => Promise.resolve(true),
    } as unknown as AuthGuard;

    guard = new RoleGuard(reflector, authGuard);
  });

  it('deve permitir quando não há metadata de roles (roles = undefined)', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    (reflector.get as jest.Mock).mockReturnValue(undefined);

    const ctx = makeExecutionContext(UserType.GUEST);
    const result = await guard.canActivate(ctx);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(reflector.get).toHaveBeenCalledWith('roles', ctx.getHandler());
    expect(result).toBe(true);
  });

  it('deve permitir quando o usuário possui um dos papéis requeridos', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    (reflector.get as jest.Mock).mockReturnValue([
      UserType.PROFESSOR,
      UserType.ADMIN,
    ] as UserType[]);

    const ctx = makeExecutionContext(UserType.PROFESSOR);
    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
  });

  it('deve permitir quando o usuário não possui um dos papéis requeridos', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    (reflector.get as jest.Mock).mockReturnValue([
      UserType.PROFESSOR,
      UserType.ADMIN,
    ] as UserType[]);

    const ctx = makeExecutionContext(UserType.GUEST);
    const result = await guard.canActivate(ctx);

    expect(result).toBe(false);
  });

  it('deve permitir um professor acessar todas as rotas de usuários comuns', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    (reflector.get as jest.Mock).mockReturnValue([UserType.GUEST] as UserType[]);

    const ctx = makeExecutionContext(UserType.PROFESSOR);
    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
  });

  it('deve permitir um root acessar todas as rotas de admins comuns', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    (reflector.get as jest.Mock).mockReturnValue([UserType.ADMIN] as UserType[]);

    const ctx = makeExecutionContext(UserType.ROOT);
    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
  });
});
