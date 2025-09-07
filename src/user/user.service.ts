import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import z from 'zod';
import { SearchParamsDto, UpdateUserFormDto } from './user.model';

@Injectable()
export class UserService {
  constructor(private readonly databaseService: DatabaseService) {}

  async deleteUser(userId: string) {
    this.verifyUserId(userId);
    await this.databaseService.user.update({ where: { id: userId }, data: { active: false } });
  }

  async updateUser(userId: string, updateUserDto: UpdateUserFormDto) {
    this.verifyUserId(userId);

    await this.databaseService.user.update({
      where: { id: userId },
      data: {
        name: updateUserDto.name,
        email: updateUserDto.email,
        phone: updateUserDto.phone,
        cpf: updateUserDto.cpf,
        gender: updateUserDto.gender,
        rg: updateUserDto.rg,
        userType: updateUserDto.userType,
        institution: updateUserDto.institution,
        isForeign: updateUserDto.isForeign,
        address: {
          create: {
            zip: updateUserDto.zipCode,
            street: updateUserDto.address,
            city: updateUserDto.city,
            number: updateUserDto.number?.toString(),
          },
        },
      },
    });
  }

  async searchUser(searchParams: SearchParamsDto) {
    return this.databaseService.user.findMany({
      where: {
        name: {
          contains: searchParams.name,
        },
        email: {
          contains: searchParams.email,
        },
      },
    });
  }

  private verifyUserId(userId: string) {
    if (!z.uuid().safeParse(userId).success) {
      throw new BadRequestException('O `id` deve vir no formato `uuid`.');
    }
  }
}
