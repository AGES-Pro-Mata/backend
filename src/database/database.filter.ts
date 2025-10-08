import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { Prisma } from 'generated/prisma';

@Catch(Prisma.PrismaClientKnownRequestError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();

    if (exception.code === 'P2002') {
      if (exception.meta?.target) {
        const target: string = exception.meta['target'] as string;
        throw new BadRequestException(`${target} já cadastrado`);
      }
    }

    if (request.next) {
      request.next();
    }
  }
}
