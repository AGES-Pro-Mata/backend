// import { Select } from '@aws-sdk/client-dynamodb'; // Removed unused import
import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CurrentUser } from 'src/auth/auth.model';

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
      throw new NotFoundException('ReservationGroup not found');
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
}
