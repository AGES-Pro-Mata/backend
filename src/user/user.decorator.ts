import type { Request } from 'express';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUser } from 'src/auth/auth.model';

export const User = createParamDecorator((data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<Request>();

  return request.user as CurrentUser;
});
