import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../roles/roles.decorator';

type Req = {
  // TODO: Change that to the `User` type on Prisma when it'll be ready.
  user: { role: Role };
};

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<Role[]>('roles', context.getHandler());

    if (!roles) {
      return true;
    }

    const req = context.switchToHttp().getRequest<Req>();
    const user = req.user;

    return roles.some((role) => role === user.role);
  }
}
