import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import {
  ChangePasswordDto,
  CreateRootUserDto,
  CreateUserFormDto,
  ForgotPasswordDto,
  LoginDto,
} from './auth.model';
import { ReceiptType, UserType } from 'generated/prisma';
import { timingSafeEqual, randomBytes } from 'node:crypto';
import { AnalyticsService } from 'src/analytics/analytics.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import argon2 from 'argon2';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly analyticsService: AnalyticsService,
    private readonly configService: ConfigService,
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
        cpf: dto.cpf,
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

  async createRootUser(userId: string, dto: CreateRootUserDto) {
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
        userType: UserType.ADMIN,
        isForeign: false,
        verified: true,
        createdByUserId: userId,
      },
    });
  }

  async signIn(dto: LoginDto) {
    const user = await this.databaseService.user.findUnique({
      where: { email: dto.email },
      select: { id: true, password: true },
    });

    if (!user) {
      throw new BadRequestException('Nenhum usuário encontrado com esse email.');
    }

    if (await this.verifyPassword(user.password, dto.password)) {
      const payload = {
        sub: user.id,
      };

      const token = await this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
      });

      return { token };
    } else {
      throw new BadRequestException('Senha incorreta.');
    }
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
}
