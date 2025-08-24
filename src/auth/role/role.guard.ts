import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../roles/roles.decorator';
import { ROLE_MAP } from './role.map';

type Req = {
  // TODO: Replace with the Prisma `User` type once it's available.
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

    const userRoleMap = ROLE_MAP[user.role];

    return roles.some((role) => userRoleMap.has(role));
  }
}
