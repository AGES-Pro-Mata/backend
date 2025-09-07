import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { ChangePasswordDto, CreateUserFormDto, ForgotPasswordDto } from './auth.model';
import { UserType } from 'generated/prisma';
import { timingSafeEqual, randomBytes } from 'node:crypto';
import { AnalyticsService } from 'src/analytics/analytics.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  private comparePasswords(password: string, confirmPassword: string) {
    return timingSafeEqual(Buffer.from(password, 'hex'), Buffer.from(confirmPassword, 'hex'));
  }

  async createUser(dto: CreateUserFormDto) {
    if (!this.comparePasswords(dto.password, dto.confirmPassword)) {
      throw new BadRequestException('As senhas não são identicas.');
    }

    await this.databaseService.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: dto.password,
        phone: dto.phone,
        cpf: dto.cpf,
        gender: dto.gender,
        rg: dto.rg,
        userType: UserType.GUEST,
        institution: dto.institution,
        isForeign: dto.isForeign,
        address: {
          create: {
            zip: dto.zipCode,
            street: dto.address,
            city: dto.city,
            number: dto.number.toString(),
          },
        },
      },
    });
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.databaseService.user.findUnique({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      this.logger.log('POST /auth/forgot: Email não encontrado!');
      return;
    }

    const token = randomBytes(20).toString('hex');

    const createdAt = new Date();

    const expiredAt = new Date(createdAt);
    expiredAt.setHours(createdAt.getHours() + 1);

    await this.databaseService.passwordResetToken.create({
      data: {
        userId: user.id,
        token: token,
        createdAt,
        expiredAt,
      },
    });

    // TODO: Send a link to the user's email where they can change the password
  }

  async changePassword(changePasswordDto: ChangePasswordDto) {
    if (!this.comparePasswords(changePasswordDto.password, changePasswordDto.confirmPassword)) {
      throw new BadRequestException('As senhas não são identicas.');
    }

    const passwordResetToken = await this.checkToken(changePasswordDto.token);

    await this.databaseService.user.update({
      where: {
        id: passwordResetToken.userId,
      },
      data: {
        password: changePasswordDto.password,
      },
    });

    await this.databaseService.passwordResetToken.update({
      where: { token: changePasswordDto.token },
      data: {
        isActive: false,
      },
    });

    await this.analyticsService.trackPasswordChange(passwordResetToken.userId);
  }

  async checkToken(token: string) {
    const passwordResetToken = await this.databaseService.passwordResetToken.findUnique({
      where: { token: token, isActive: true },
    });

    if (!passwordResetToken) {
      throw new BadRequestException('Token inválido.');
    }

    if (passwordResetToken.expiredAt < new Date()) {
      throw new UnauthorizedException('Token expirado.');
    }

    return passwordResetToken;
  }
}
