import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import z from 'zod';
import { Prisma, UserType } from 'generated/prisma';
import { UserSearchParamsDto, UpdateUserFormDto, CreateRootUserDto } from './user.model';
import { ObfuscateService } from 'src/obfuscate/obfuscate.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly obfuscateService: ObfuscateService,
  ) {}

  async deleteUser(userId: string) {
    this.verifyUserId(userId);

    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
      select: { email: true, document: true, rg: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
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

    const where: Prisma.UserWhereInput = {
      name: {
        contains: searchParams.name,
      },
      email: {
        contains: searchParams.email,
      },
      createdBy: {
        name: {
          contains: searchParams.createdBy,
        },
      },
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

  async createRootUser(userId: string, dto: CreateRootUserDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('As senhas não são identicas.');
    }

    await this.databaseService.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: dto.password,
        phone: dto.phone,
        document: dto.document,
        gender: dto.gender,
        userType: UserType.ADMIN,
        isForeign: false,
        verified: true,
        rg: dto.rg,
        institution: dto.institution,
        createdBy: {
          connect: {
            id: userId,
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
}
