import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateUserFormDto } from './auth.model';
import { UserType } from 'generated/prisma';
import { timingSafeEqual } from 'node:crypto';

@Injectable()
export class AuthService {
  constructor(private readonly databaseService: DatabaseService) {}

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
}
