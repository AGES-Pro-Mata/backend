import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserPayload, UserPayloadSchema } from './auth.model';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  private readonly jwtSecretKey: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const envSecret = this.configService.get('JWT_SECRET');

    if (envSecret) {
      this.jwtSecretKey = envSecret;
    } else {
      this.logger.fatal('JWT_SECRET was not setted.');
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    let payload: UserPayload;

    try {
      payload = await this.jwtService.verifyAsync<UserPayload>(token, {
        secret: this.jwtSecretKey,
      });
    } catch {
      this.logger.error(`Invalid token: ${token}`);
      throw new UnauthorizedException();
    }

    const parsed = UserPayloadSchema.safeParse(payload);

    if (!parsed.success) {
      this.logger.error('JWT payload failed schema validation', parsed.error);
      throw new UnauthorizedException('Invalid token payload');
    }

    request.user = {
      id: parsed.data.sub,
      userType: parsed.data.userType,
    };

    return true;
  }

  private extractTokenFromHeader(request: Request): string {
    const authorizationHeader = request.header('authorization');

    if (!authorizationHeader) {
      this.logger.error(`\`Authorization\` header was not present`);
      throw new UnauthorizedException();
    }

    const [type, token] = authorizationHeader.split(' ') ?? [];

    if (type !== 'Bearer') {
      this.logger.error('The authorization token must be in a `Bearer` pattern');
      throw new UnauthorizedException();
    }

    return token;
  }
}
