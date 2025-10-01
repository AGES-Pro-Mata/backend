import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import z from 'zod';
import { Prisma, UserType } from 'generated/prisma';
import { UserSearchParamsDto, UpdateUserFormDto } from './user.model';

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
        document: updateUserDto.document,
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

  async searchUser(searchParams: UserSearchParamsDto) {
    const orderBy: Prisma.UserOrderByWithRelationInput =
      searchParams.sort === 'createdBy'
        ? { createdBy: { name: searchParams.dir } }
        : { [searchParams.sort]: searchParams.dir };

    const users = await this.databaseService.user.findMany({
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
      orderBy,
      skip: searchParams.limit * searchParams.page,
      take: searchParams.limit,
    });

    return {
      page: searchParams.page,
      limit: searchParams.limit,
      total: users.length,
      items: users,
    };
  }

  async getUser(userId: string) {
    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        phone: true,
        document: true,
        rg: true,
        gender: true,
        userType: true,
        institution: true,
        isForeign: true,
        address: {
          select: {
            zip: true,
            city: true,
            country: true,
            street: true,
            number: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      name: user.name,
      email: user.email,
      phone: user.phone,
      document: user.document,
      rg: user.rg,
      gender: user.gender,
      zipCode: user.address?.zip,
      userType: user.userType,
      city: user.address?.city,
      country: user.address?.country,
      addressLine: user.address?.street,
      number: user.address?.number ? parseInt(user.address.number) : null,
      institution: user.institution,
      isForeign: user.isForeign,
    };
  }

  private verifyUserId(userId: string) {
    if (!z.uuid().safeParse(userId).success) {
      throw new BadRequestException('O `id` deve vir no formato `uuid`.');
    }
  }
}
