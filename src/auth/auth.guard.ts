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
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  private readonly jwtSecretKey: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
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

    const user = await this.databaseService.user.findUnique({
      where: {
        id: parsed.data.sub,
      },
      select: { id: true, userType: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    request.user = user;

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
