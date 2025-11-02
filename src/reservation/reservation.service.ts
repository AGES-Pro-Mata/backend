import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import {
  UpdateReservationDto,
  CreateReservationGroupDto,
  UpdateReservationByAdminDto,
} from './reservation.model';

@Injectable()
export class ReservationService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createRequestAdmin(
    reservationGroupId: string,
    updateReservationDto: UpdateReservationDto,
    userId: string,
  ) {
    return await this.databaseService.$transaction(async (tx) => {
      const payload = await tx.reservation.count({
        where: {
          id: reservationGroupId,
        },
      });

      if (payload === 0) {
        throw new NotFoundException();
      }

      return await tx.requests.create({
        data: {
          description: updateReservationDto.description,
          type: updateReservationDto.type,
          reservationGroupId,
          createdByUserId: userId,
        },
      });
    });
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
    return await this.databaseService.requests.create({
      data: {
        type: 'DOCUMENT_REQUESTED',
        createdByUserId: userId,
        reservationGroupId,
      },
    });
  }

  async createCancelRequest(reservationGroupId: string, userId: string) {
    return await this.databaseService.$transaction(async (tx) => {
      const payload = await tx.reservation.count({
        where: {
          id: reservationGroupId,
          userId,
        },
      });

      if (payload === 0) {
        throw new NotFoundException();
      }

      return await tx.requests.create({
        data: {
          type: 'CANCELED_REQUESTED',
          reservationGroupId,
          createdByUserId: userId,
        },
      });
    });
  }

  async deleteReservation(reservationId: string) {
    return await this.databaseService.reservationGroup.update({
      where: { id: reservationId },
      data: {
        active: false,
      },
    });
  }

  async getReservations(userId: string) {
    return await this.databaseService.reservationGroup.findMany({
      where: {
        userId: userId,
      },
      select: {
        reservations: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            notes: true,
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
  }

  async createReservationGroup(
    userId: string,
    createReservationGroupDto: CreateReservationGroupDto,
  ) {
    return await this.databaseService.$transaction(async (tx) => {
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
    return await this.databaseService.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
      });

      if (!reservation) {
        throw new NotFoundException('Reservation not found');
      }

      return await tx.reservation.update({
        where: { id: reservationId },
        data: {
          experienceId: updateReservationDto.experienceId,
          startDate: updateReservationDto.startDate,
          endDate: updateReservationDto.endDate,
          notes: updateReservationDto.notes,
        },
      });
    });
  }
}
