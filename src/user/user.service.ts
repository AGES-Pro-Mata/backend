import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import z from 'zod';
import { UserType } from 'generated/prisma';
import { SearchParamsDto, UpdateUserFormDto } from './user.model';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async deleteUser(userId: string) {
    this.verifyUserId(userId);
    await this.databaseService.user.update({ where: { id: userId }, data: { active: false } });
  }

  async updateUser(userId: string, updateUserDto: UpdateUserFormDto) {
    this.verifyUserId(userId);

    const user = await this.databaseService.user.update({
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
      },
    });

    if (user.userType === UserType.ADMIN || user.userType === UserType.ROOT) {
      return;
    }

    if (!user.addressId) {
      this.logger.fatal(`The common user (GEST or PROFESSOR) ${user.id} must have an Address`);
      return;
    }

    await this.databaseService.address.update({
      where: { id: user.addressId },
      data: {
        zip: updateUserDto.zipCode,
        street: updateUserDto.addressLine,
        city: updateUserDto.city,
        number: updateUserDto.number?.toString(),
        country: updateUserDto.country,
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
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        [searchParams.sort]: searchParams.dir,
      },
      skip: searchParams.limit * (searchParams.page - 1),
      take: searchParams.limit,
    });
  }

  private verifyUserId(userId: string) {
    if (!z.uuid().safeParse(userId).success) {
      throw new BadRequestException('O `id` deve vir no formato `uuid`.');
    }
  }

  async getMe(userId: string) {
    this.verifyUserId(userId);
    return await this.databaseService.user.findUnique({ where: { id: userId } });
  }
}
