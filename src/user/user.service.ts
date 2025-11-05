import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import z from 'zod';
import { Prisma, UserType } from 'generated/prisma';
import { UserSearchParamsDto, UpdateUserFormDto } from './user.model';
import { ObfuscateService } from 'src/obfuscate/obfuscate.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly obfuscateService: ObfuscateService,
  ) {}

  async deleteUser(userId: string, deleterId: string) {
    this.verifyUserId(userId);

    if (userId == deleterId) {
      throw new ForbiddenException('Users cannot delete themselves.');
    }

    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
      select: { email: true, document: true, rg: true, userType: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.userType === UserType.ROOT) {
      throw new ForbiddenException('Root user cannot be deleted.');
    }

    await this.databaseService.user.update({
      where: { id: userId },
      data: {
        email: this.obfuscateService.obfuscateField(user.email),
        document: user.document ? this.obfuscateService.obfuscateField(user.document) : null,
        rg: user.rg ? this.obfuscateService.obfuscateField(user.rg) : null,
        active: false,
      },
    });
  }

  async updateUser(userId: string, updateUserDto: UpdateUserFormDto) {
    this.verifyUserId(userId);

    const user = await this.databaseService.user.update({
      where: { id: userId, userType: { not: UserType.ROOT } },
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

    if (!user.addressId) {
      return this.logger.fatal(`The common user ${user.userType} ${user.id} must have an Address`);
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

    const where: Prisma.UserWhereInput = {
      name: {
        contains: searchParams.name,
      },
      email: {
        contains: searchParams.email,
      },
      createdBy: searchParams.createdBy
        ? {
            name: {
              contains: searchParams.createdBy,
            },
          }
        : undefined,
      active: true,
    };

    const users = await this.databaseService.user.findMany({
      where,
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

    const total = await this.databaseService.user.count({ where });

    return {
      page: searchParams.page,
      limit: searchParams.limit,
      total,
      items: users,
    };
  }

  async getUser(userId: string) {
    const user = await this.databaseService.user.findUnique({
      where: { id: userId, active: true },
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
