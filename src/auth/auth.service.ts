import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';
import { ReceiptType } from 'generated/prisma';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { AnalyticsService } from 'src/analytics/analytics.service';
import { DatabaseService } from 'src/database/database.service';
import { MailService } from 'src/mail/mail.service';
import {
  ChangePasswordDto,
  CreateRootUserDto,
  CreateUserFormDto,
  ForgotPasswordDto,
  LoginDto,
} from './auth.model';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly analyticsService: AnalyticsService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  private comparePasswords(password: string, confirmPassword: string) {
    return timingSafeEqual(Buffer.from(password, 'hex'), Buffer.from(confirmPassword, 'hex'));
  }

  async createUser(arquivo: File, dto: CreateUserFormDto) {
    if (!this.comparePasswords(dto.password, dto.confirmPassword)) {
      throw new BadRequestException('As senhas não são identicas.');
    }

    console.log(arquivo); // TODO: implementar upload pra s3 e salvar o url no banco

    await this.databaseService.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: await this.hashPassword(dto.password),
        phone: dto.phone,
        document: dto.document,
        gender: dto.gender,
        rg: dto.rg,
        userType: dto.userType,
        verified: dto.userType !== 'PROFESSOR',
        institution: dto.institution,
        isForeign: dto.isForeign,
        Receipt: {
          create: {
            type: ReceiptType.DOCENCY,
            url: 'url_default',
          },
        },
        address: {
          create: {
            zip: dto.zipCode,
            street: dto.addressLine,
            city: dto.city,
            number: dto.number?.toString(),
            country: dto.country,
          },
        },
      },
    });
  }

  async signIn(dto: LoginDto) {
    const user = await this.databaseService.user.findUnique({
      where: { email: dto.email },
      select: { id: true, password: true, isFirstAccess: true },
    });

    if (!user) {
      throw new BadRequestException('Nenhum usuário encontrado com esse email.');
    }

    if (await this.verifyPassword(user.password, dto.password)) {
      if (user.isFirstAccess) {
        const token = await this.createResetToken(user.id);
        return { token: token, isFirstAccess: true };
      }

      const payload = {
        sub: user.id,
      };

      const token = await this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
      });

      return { token, isFirstAccess: user.isFirstAccess };
    } else {
      throw new BadRequestException('Senha incorreta.');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.databaseService.user.findUnique({
      where: { email: forgotPasswordDto.email },
    });
    if (!user) {
      throw new BadRequestException('Usuário não encontrado.');
    }
    const token = await this.createResetToken(user.id);
    const resetUrl = `${process.env.FRONTEND_URL}/auth/redefine/${token}`;

    await this.mailService.sendTemplateMail(user.email, 'Recuperação de senha', 'forgot-password', {
      name: user.name,
      resetUrl,
    });
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
        password: await this.hashPassword(changePasswordDto.password),
        isFirstAccess: false,
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

  async hashPassword(plain: string): Promise<string> {
    return argon2.hash(plain, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });
  }

  async verifyPassword(hash: string, plain: string): Promise<boolean> {
    return argon2.verify(hash, plain);
  }

  async findProfile(id: string) {
    return await this.databaseService.user.findUnique({
      where: { id },
      omit: {
        id: true,
        password: true,
        createdAt: true,
        addressId: true,
        createdByUserId: true,
        active: true,
      },
      include: {
        address: {
          omit: { id: true, createdAt: true },
        },
      },
    });
  }

  async createResetToken(userId: string) {
    const activeToken = await this.databaseService.passwordResetToken.findFirst({
      where: { userId: userId, isActive: true, expiredAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (activeToken) {
      return activeToken.token;
    }
    const token = randomBytes(20).toString('hex');

    const createdAt = new Date();

    const expiredAt = new Date(createdAt);
    expiredAt.setHours(createdAt.getHours() + 1);

    await this.databaseService.passwordResetToken.create({
      data: {
        userId: userId,
        token: token,
        createdAt,
        expiredAt,
      },
    });

    return token;
  }

  async createRootUser(userId: string, dto: CreateRootUserDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('As senhas não são identicas.');
    }

    await this.databaseService.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: await this.hashPassword(dto.password),
        phone: dto.phone,
        document: dto.document,
        gender: dto.gender,
        userType: dto.userType,
        isForeign: false,
        verified: true,
        rg: dto.rg,
        institution: dto.institution,
        createdBy: {
          connect: {
            id: userId,
          },
        },
        isFirstAccess: true,
        address: {
          create: {
            zip: dto.zipCode,
            street: dto.addressLine,
            city: dto.city,
            number: dto.number?.toString(),
            country: dto.country,
          },
        },
      },
    });
  }
}
