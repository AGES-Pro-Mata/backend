import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CurrentUser } from 'src/auth/auth.model';
import { RequestType } from 'generated/prisma';
import { PROFESSOR_REQUEST_TYPES } from 'src/professor/professor.model';

@Injectable()
export class RequestsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getRequestsByIdReservationGroupAdmin(reservationGroupId: string, adminUser: CurrentUser) {
    const reservationGroup = await this.databaseService.reservationGroup.findUnique({
      where: { id: reservationGroupId },
      select: {
        userId: true,
        requests: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            type: true,
            description: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            createdAt: true,
          },
        },
      },
    });

    if (reservationGroup === null) {
      throw new NotFoundException('ReservationGroup requests not found');
    }

    const events = reservationGroup.requests.map((e) => ({
      id: e.id,
      status: e.type,
      description: e.description,
      createdAt: e.createdAt,
      name: e.createdBy.name,
      email: e.createdBy.email,
      userId: e.createdBy.id,
      isSender: e.createdBy.id === adminUser.id,
      isRequester: e.createdBy.id === reservationGroup.userId,
    }));

    return {
      events,
      createdAt: events[0].createdAt,
      status: events[events.length - 1].status,
    };
  }

  async getProfessorRequests(professorId: string, userId: string) {
    const professor = await this.databaseService.user.findUnique({
      where: {
        id: professorId,
        Requests: {
          some: {
            type: {
              in: PROFESSOR_REQUEST_TYPES,
            },
          },
        },
      },
      select: {
        Requests: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            type: true,
            description: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            createdAt: true,
          },
        },
      },
    });

    if (professor === null) {
      throw new NotFoundException('Professor requests not found');
    }

    const events = professor.Requests.map((e) => ({
      id: e.id,
      status: e.type,
      description: e.description,
      createdAt: e.createdAt,
      name: e.createdBy.name,
      email: e.createdBy.email,
      userId: e.createdBy.id,
      isSender: e.createdBy.id === userId,
      isRequester: e.createdBy.id === professorId,
    }));

    return {
      events,
      createdAt: events[0].createdAt,
      status: events[events.length - 1].status,
    };
  }
}
