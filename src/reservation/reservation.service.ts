import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import {
  CreateReservationGroupDto,
  UpdateReservationByAdminDto,
  ReservationGroupStatusFilterDto,
  RegisterMemberDto,
  ReservationSearchParamsDto,
} from './reservation.model';
import { RequestType } from 'generated/prisma';

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

const RESERVATION_QUERY = `-- baseQuery
SELECT
  rg.id,
  u.email,
  rg."createdAt",
  lr.type AS status,
  array_agg(DISTINCT e.name) AS experiences
FROM "ReservationGroup" rg
JOIN "User" u ON u.id = rg."userId"
JOIN LATERAL (
  SELECT r.type
  FROM "Requests" r
  WHERE r."reservationGroupId" = rg.id
  ORDER BY r."createdAt" DESC
  LIMIT 1
) lr ON TRUE
LEFT JOIN "Reservation" res ON res."reservationGroupId" = rg.id
LEFT JOIN "Experience" e ON e.id = res."experienceId"
WHERE rg.active = true
  -- filtro por email
  AND ($1::text IS NULL OR u.email ILIKE '%' || $1 || '%')
  -- filtro por experiência
  AND ($2::text IS NULL OR e.name ILIKE '%' || $2 || '%')
  -- filtro por status (lista) aplicado na ÚLTIMA request
  AND (
    $3::"RequestType"[] IS NULL
    OR lr.type = ANY($3::"RequestType"[])
  )
GROUP BY rg.id, u.email, rg."createdAt", lr.type`;

@Injectable()
export class ReservationService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly storageService: StorageService,
  ) {}

  async getAllReservationGroups(searchParams: ReservationSearchParamsDto) {
    const { page, limit, sort, dir, email, experiences, status } = searchParams;

    const offset = page * limit;

    // direction SEMPRE validada pelo Zod ('asc' | 'desc')
    const direction = dir?.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    // ORDER BY dinâmico
    const orderByClause =
      sort === 'email'
        ? `ORDER BY u.email ${direction}, rg."createdAt" DESC`
        : sort === 'status'
          ? `ORDER BY lr.type ${direction}, rg."createdAt" DESC`
          : `ORDER BY rg."createdAt" DESC`;

    type RawRow = {
      id: string;
      email: string;
      createdAt: Date;
      status: RequestType | null;
      experiences: string[] | null;
    };

    const rows = await this.databaseService.$queryRawUnsafe<RawRow[]>(
      `
    ${RESERVATION_QUERY}
    ${orderByClause}
    OFFSET $4
    LIMIT $5
    `,
      email ?? null,
      experiences ?? null,
      status && status.length > 0 ? status : null,
      offset,
      limit,
    );

    const totalResult = await this.databaseService.$queryRawUnsafe<{ count: bigint }[]>(
      `
    SELECT COUNT(*)::bigint AS count
    FROM (
      ${RESERVATION_QUERY}
    ) AS sub
    `,
      email ?? null,
      experiences ?? null,
      status && status.length > 0 ? status : null,
    );

    const total = Number(totalResult[0]?.count ?? 0);

    const items = rows.map((row) => ({
      id: row.id,
      experiences: row.experiences ?? [],
      email: row.email,
      status: row.status,
    }));

    return {
      page,
      limit,
      total,
      items,
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
