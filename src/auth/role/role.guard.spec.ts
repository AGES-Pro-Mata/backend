import { Reflector } from '@nestjs/core';
import { RoleGuard } from './role.guard';
import { Role } from '../roles/roles.decorator';
import { ExecutionContext } from '@nestjs/common';

describe('RoleGuard', () => {
  let reflector: Reflector;
  let guard: RoleGuard;

  const makeExecutionContext = (userRole?: Role): ExecutionContext => {
    const req = { user: { role: userRole } };

    const context = {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
      getHandler: () => ({}),
    } as ExecutionContext;

    return context;
  };

  beforeEach(() => {
    reflector = {
      get: jest.fn(),
    } as unknown as Reflector;

    guard = new RoleGuard(reflector);
  });

  it('deve permitir quando não há metadata de roles (roles = undefined)', () => {
    (reflector.get as jest.Mock).mockReturnValue(undefined);

    const ctx = makeExecutionContext(Role.User);
    const result = guard.canActivate(ctx);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(reflector.get).toHaveBeenCalledWith('roles', ctx.getHandler());
    expect(result).toBe(true);
  });

  it('deve permitir quando o usuário possui um dos papéis requeridos', () => {
    (reflector.get as jest.Mock).mockReturnValue([Role.Professor, Role.Admin] as Role[]);

    const ctx = makeExecutionContext(Role.Professor);
    const result = guard.canActivate(ctx);

    expect(result).toBe(true);
  });

  it('deve permitir quando o usuário não possui um dos papéis requeridos', () => {
    (reflector.get as jest.Mock).mockReturnValue([Role.Professor, Role.Admin] as Role[]);

    const ctx = makeExecutionContext(Role.User);
    const result = guard.canActivate(ctx);

    expect(result).toBe(false);
  });
});
