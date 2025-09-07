import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateUserFormDto, LoginDto } from './auth.model';
import { UserType } from 'generated/prisma';
import { timingSafeEqual } from 'node:crypto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async createUser(dto: CreateUserFormDto) {
    if (
      !timingSafeEqual(Buffer.from(dto.password, 'hex'), Buffer.from(dto.confirmPassword, 'hex'))
    ) {
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
      },
    });
  }

  async signIn(dto: LoginDto) {
    const user = await this.databaseService.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException('Nenhum usuário encontrado com esse email.');
    }

    if (user?.password === dto.password) {
      const payload = {
        sub: user.id,
        userType: user.userType,
      };

      const token = await this.jwtService.signAsync(payload);

      return { token };
    } else {
      throw new BadRequestException('Senha incorreta.');
    }
  }
}
