import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE_MAP } from './role.map';
import { AuthGuard } from '../auth.guard';
import { UserType } from 'generated/prisma';
import { Request } from 'express';
import { CurrentUser } from '../auth.model';
import { IS_PUBLIC_KEY } from '../public.decorator';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authGuard: AuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verificar se a rota é pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

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
