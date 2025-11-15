import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { MailService } from 'src/mail/mail.service';
import {
  UpdateReservationDto,
  CreateReservationGroupDto,
  UpdateReservationByAdminDto,
  ReservationGroupStatusFilterDto,
  RegisterMemberDto,
} from './reservation.model';
import { RequestType } from 'generated/prisma';
import { Decimal } from '@prisma/client/runtime/library';

const PENDING_LIST: string[] = [
  RequestType.PAYMENT_REQUESTED,
  RequestType.PEOPLE_REQUESTED,
  RequestType.CREATED,
  RequestType.DOCUMENT_REQUESTED,
  RequestType.CANCELED_REQUESTED,
];

@Injectable()
export class ReservationService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly mailService: MailService,
  ) {}

  async createRequestAdmin(
    reservationGroupId: string,
    updateReservationDto: UpdateReservationDto,
    userId: string,
  ) {
    const payload = await this.databaseService.reservation.count({
      where: {
        id: reservationGroupId,
      },
    });

    if (payload === 0) {
      throw new NotFoundException();
    }

    await this.databaseService.requests.create({
      data: {
        description: updateReservationDto.description,
        type: updateReservationDto.type,
        reservationGroupId,
        createdByUserId: userId,
      },
    });

    await this.sendStatusChangeEmail(reservationGroupId);
  }

  async attachDocument(reservationId: string, url: string, userId: string) {
    return await this.databaseService.document.create({
      data: {
        url,
        reservationId,
        uploadedByUserId: userId,
      },
    });
  }

  async createDocumentRequest(reservationGroupId: string, userId: string) {
    const request = await this.databaseService.requests.create({
      data: {
        type: 'DOCUMENT_REQUESTED',
        createdByUserId: userId,
        reservationGroupId,
      },
    });

    await this.sendStatusChangeEmail(reservationGroupId);

    return request;
  }

  async createCancelRequest(reservationGroupId: string, userId: string) {
    const payload = await this.databaseService.reservationGroup.findUnique({
      where: {
        id: reservationGroupId,
        userId,
      },
      select: {
        requests: {
          select: {
            type: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!payload) {
      throw new NotFoundException('Reservation group not found');
    }

    const type: RequestType =
      payload.requests[0].type === 'APPROVED' ? 'CANCELED_REQUESTED' : 'CANCELED';

    await this.databaseService.requests.create({
      data: {
        type,
        reservationGroupId,
        createdByUserId: userId,
      },
    });

    await this.sendStatusChangeEmail(reservationGroupId);
  }

  async deleteReservation(reservationId: string) {
    return await this.databaseService.reservationGroup.update({
      where: { id: reservationId },
      data: {
        active: false,
      },
    });
  }

  async getReservationGroups(userId: string, filter: ReservationGroupStatusFilterDto) {
    const reservationGroup = await this.databaseService.reservationGroup.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        members: true,
        requests: true,
        reservations: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            notes: true,
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

        let status: (typeof rg.requests)[number] | null = null;

        for (const request of rg.requests) {
          if (
            request.createdAt.getTime() > (status?.createdAt.getTime() ?? Number.MIN_SAFE_INTEGER)
          ) {
            status = request;
          }
        }

        return {
          ...rg,
          requests: undefined,
          status: status?.type,
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
        data: { userId },
        select: { id: true },
      });

      await tx.member.createMany({
        data: createReservationGroupDto.members.map((m) => ({
          name: m.name,
          document: m.document,
          gender: m.gender,
          reservationGroupId: group.id,
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
              notes: r.notes ?? null,
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

    await this.sendStatusChangeEmail(reservationGroup.id);

    return reservationGroup;
  }

  async getReservationGroupByIdAdmin(reservationGroupId: string) {
    return await this.databaseService.reservationGroup.findUnique({
      where: { id: reservationGroupId },
      select: {
        id: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reservations: {
          select: {
            membersCount: true,
            notes: true,
            experience: {
              omit: {
                imageId: true,
                active: true,
              },
            },
          },
        },
        requests: {
          omit: {
            createdAt: true,
            createdByUserId: true,
            reservationGroupId: true,
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reservations: {
          select: {
            membersCount: true,
            notes: true,
            experience: {
              omit: {
                imageId: true,
                active: true,
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
        notes: updateReservationDto.notes,
      },
    });

    return updatedReservation;
  }

  async registerMembers(
    reservationGroupId: string,
    userId: string,
    registerMemberDto: RegisterMemberDto[],
  ) {
    await this.databaseService.reservationGroup.update({
      where: {
        id: reservationGroupId,
        userId,
      },
      data: {
        requests: {
          create: {
            type: 'PAYMENT_REQUESTED',
            createdByUserId: userId,
          },
        },
        members: {
          createMany: {
            data: registerMemberDto,
          },
        },
      },
    });

    await this.sendStatusChangeEmail(reservationGroupId);
  }

  private async sendStatusChangeEmail(reservationGroupId: string) {
    try {
      const reservation = await this.databaseService.reservationGroup.findUnique({
        where: { id: reservationGroupId },
        select: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      if (reservation?.user?.email) {
        await this.mailService.sendTemplateMail(
          reservation.user.email,
          'Atualização de Reserva',
          'reservation-status-change',
          { userName: reservation.user.name },
        );
      }
    } catch (error) {
      console.error('Erro ao enviar email:', error);
    }
  }
}