import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import {
  UpdateReservationDto,
  CreateReservationGroupDto,
  UpdateReservationByAdminDto,
  ReservationGroupStatusFilterDto,
  RegisterMemberDto,
  ReservationSearchParamsDto,
} from './reservation.model';
import { Prisma, RequestType } from 'generated/prisma';

import { Decimal } from '@prisma/client/runtime/library';
import { StorageService } from 'src/storage/storage.service';

const PENDING_LIST: string[] = [
  RequestType.PAYMENT_REQUESTED,
  RequestType.PEOPLE_REQUESTED,
  RequestType.CREATED,
  RequestType.DOCUMENT_REQUESTED,
  RequestType.CANCELED_REQUESTED,
  RequestType.EDIT_REQUESTED,
];

@Injectable()
export class ReservationService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly storageService: StorageService,
  ) {}

  async getAllReservationGroups(searchParams: ReservationSearchParamsDto) {
    const orderBy: Prisma.ReservationGroupOrderByWithRelationInput[] = [
      {
        user: {
          ['email']: searchParams.sort === 'email' ? searchParams.dir : undefined,
        },
      },
      {
        createdAt: 'desc',
      },
    ];

    const where: Prisma.ReservationGroupWhereInput = {
      active: true,
      requests: {
        some: {
          type: searchParams.status,
        },
      },
      user: {
        email: { contains: searchParams.email },
      },
      reservations: {
        some: {
          experience: {
            name: { contains: searchParams.experiences },
          },
        },
      },
    };
    const groups = await this.databaseService.reservationGroup.findMany({
      where,
      orderBy,
      select: {
        id: true,
        user: {
          select: {
            email: true,
          },
        },
        createdAt: true,
        requests: {
          select: {
            type: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        reservations: {
          select: {
            experience: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      skip: searchParams.limit * searchParams.page,
      take: searchParams.limit,
    });
    const items = groups.map((group) => {
      return {
        id: group.id,
        experiences: group.reservations.map((r) => r.experience.name),
        email: group.user.email,
        status: group.requests[0]?.type,
      };
    });

    const total = await this.databaseService.reservationGroup.count({ where });

    return {
      page: searchParams.page,
      limit: searchParams.limit,
      total,
      items:
        searchParams.sort === 'status'
          ? items.sort((a, b) => {
              if (searchParams.dir === 'asc') {
                return a.status.localeCompare(b.status);
              } else {
                return b.status.localeCompare(a.status);
              }
            })
          : items,
    };
  }

  async createDocumentRequest(
    reservationGroupId: string,
    userId: string,
    paymentReceipt: Express.Multer.File | null,
  ) {
    if (!paymentReceipt) {
      throw new BadRequestException('`paymentReceipt` not provided');
    }

    const { url } = await this.storageService.uploadFile(paymentReceipt, {
      directory: 'payments',
      contentType: paymentReceipt.mimetype,
      cacheControl: 'public, max-age=31536000',
    });

    const request = await this.databaseService.requests.create({
      data: {
        type: RequestType.PAYMENT_SENT,
        createdByUserId: userId,
        reservationGroupId,
        fileUrl: url,
      },
    });

    return request;
  }

  async createCancelRequest(reservationGroupId: string, userId: string) {
    await this.databaseService.requests.create({
      data: {
        type: RequestType.CANCELED_REQUESTED,
        reservationGroupId,
        createdByUserId: userId,
      },
    });
  }

  async getReservationGroups(userId: string, filter: ReservationGroupStatusFilterDto) {
    const reservationGroup = await this.databaseService.reservationGroup.findMany({
      where: {
        userId: userId,
        requests: {
          some: {},
        },
      },
      select: {
        id: true,
        members: true,
        requests: {
          select: {
            type: true,
            createdAt: true,
            description: true,
            fileUrl: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        reservations: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            membersCount: true,
            user: {
              select: {
                name: true,
                phone: true,
                document: true,
                gender: true,
              },
            },
            experience: {
              select: {
                name: true,
                startDate: true,
                endDate: true,
                price: true,
                capacity: true,
                trailLength: true,
                durationMinutes: true,
                image: {
                  select: {
                    url: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const groups = reservationGroup
      .map((rg) => {
        const minDate = new Date(
          Math.min(...rg.reservations.map((r) => r.startDate?.getTime() ?? Number.MAX_VALUE)),
        );
        const maxDate = new Date(
          Math.max(...rg.reservations.map((r) => r.endDate?.getTime() ?? Number.MAX_VALUE)),
        );

        if (rg.requests.length === 0) {
          throw new InternalServerErrorException(
            'Nenhum request encontrado para o reservation group' + rg.id,
          );
        }

        return {
          ...rg,
          requests: undefined,
          history: rg.requests,
          status: rg.requests[rg.requests.length - 1].type,
          price: rg.reservations.reduce((total, res) => {
            return total.plus(res.experience.price?.mul(res.membersCount) ?? 0);
          }, new Decimal(0)),
          startDate: minDate,
          endDate: maxDate,
        };
      })
      .filter((rg) => {
        if (!rg.status) return false;

        if (filter.status === 'ALL') {
          return true;
        } else if (filter.status === 'PENDING') {
          return PENDING_LIST.includes(rg.status);
        }

        return rg.status === filter.status;
      });

    return groups.sort((a, b) => {
      return b.startDate.getTime() - a.startDate.getTime();
    });
  }

  async createReservationGroup(
    userId: string,
    createReservationGroupDto: CreateReservationGroupDto,
  ) {
    const reservationGroup = await this.databaseService.$transaction(async (tx) => {
      const experienceIds = createReservationGroupDto.reservations.map((r) => r.experienceId);

      const experiences = await tx.experience.findMany({
        where: { id: { in: experienceIds }, active: true },
        select: { id: true },
      });

      if (experiences.length !== experienceIds.length) {
        throw new BadRequestException('Uma ou mais experiências não estão ativas.');
      }

      const group = await tx.reservationGroup.create({
        data: { userId, notes: createReservationGroupDto.notes },
        select: { id: true },
      });

      await tx.member.createMany({
        data: createReservationGroupDto.members.map((m) => ({
          name: m.name,
          document: m.document,
          gender: m.gender,
          phone: m.phone,
          reservationGroupId: group.id,
          birthDate: new Date(m.birthDate),
        })),
        skipDuplicates: true,
      });

      await Promise.all(
        createReservationGroupDto.reservations.map((r) =>
          tx.reservation.create({
            data: {
              userId,
              reservationGroupId: group.id,
              experienceId: r.experienceId,
              startDate: r.startDate,
              endDate: r.endDate,
              membersCount: r.membersCount,
            },
            select: {
              _count: true,
            },
          }),
        ),
      );

      await tx.requests.create({
        data: {
          type: 'CREATED',
          createdByUserId: userId,
          reservationGroupId: group.id,
        },
      });

      return tx.reservationGroup.findUniqueOrThrow({
        where: { id: group.id },
        include: {
          reservations: { include: { experience: true } },
          requests: true,
        },
      });
    });

    return reservationGroup;
  }

  async getReservationGroupByIdAdmin(reservationGroupId: string) {
    return await this.databaseService.reservationGroup.findUnique({
      where: { id: reservationGroupId },
      select: {
        id: true,
        notes: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          select: {
            id: true,
            name: true,
            document: true,
            gender: true,
            phone: true,
            birthDate: true,
          },
        },
        reservations: {
          select: {
            membersCount: true,
            experience: {
              select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
                description: true,
                category: true,
                price: true,
                professorShouldPay: true,
                weekDays: true,
                durationMinutes: true,
                capacity: true,
                trailLength: true,
                trailDifficulty: true,
                image: {
                  select: {
                    url: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async getReservationGroupById(reservationGroupId: string, userId: string) {
    const reservationGroup = await this.databaseService.reservationGroup.findUnique({
      where: { id: reservationGroupId, userId },
      select: {
        id: true,
        notes: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          select: {
            id: true,
            name: true,
            document: true,
            gender: true,
            phone: true,
            birthDate: true,
          },
        },
        reservations: {
          select: {
            membersCount: true,
            experience: {
              select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
                description: true,
                category: true,
                price: true,
                professorShouldPay: true,
                weekDays: true,
                durationMinutes: true,
                capacity: true,
                trailLength: true,
                trailDifficulty: true,
                image: {
                  select: {
                    url: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!reservationGroup) {
      throw new NotFoundException();
    }

    return reservationGroup;
  }

  async updateReservationByAdmin(
    reservationId: string,
    updateReservationDto: UpdateReservationByAdminDto,
  ) {
    const reservation = await this.databaseService.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    const updatedReservation = await this.databaseService.reservation.update({
      where: { id: reservationId },
      data: {
        experienceId: updateReservationDto.experienceId,
        startDate: updateReservationDto.startDate,
        endDate: updateReservationDto.endDate,
        price: updateReservationDto.price,
      },
    });

    return updatedReservation;
  }

  async registerMembers(
    reservationGroupId: string,
    userId: string,
    registerMemberDto: RegisterMemberDto[],
  ) {
    await this.databaseService.$transaction([
      this.databaseService.member.deleteMany({
        where: { reservationGroupId: reservationGroupId },
      }),

      this.databaseService.reservationGroup.update({
        where: {
          id: reservationGroupId,
          userId,
        },
        data: {
          requests: {
            create: {
              type: 'PEOPLE_SENT',
              createdByUserId: userId,
            },
          },
          members: {
            createMany: {
              data: registerMemberDto,
            },
          },
        },
      }),
    ]);
  }
}
