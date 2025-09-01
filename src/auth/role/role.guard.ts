import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE_MAP } from './role.map';
import { AuthGuard } from '../auth.guard';
import { UserType } from 'generated/prisma';
import { Request } from 'express';
import { CurrentUser } from '../auth.model';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authGuard: AuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<UserType[]>('roles', context.getHandler());

    if (!roles) {
      return true;
    }

    if (!(await this.authGuard.canActivate(context))) {
      return false;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user as CurrentUser;

    const userRoleMap = ROLE_MAP[user.userType];

    return roles.some((role) => userRoleMap.has(role));
  }
}
