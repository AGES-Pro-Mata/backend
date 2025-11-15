// import { Select } from '@aws-sdk/client-dynamodb'; // Removed unused import
import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class RequestsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async getRequestsByIdReservationGroupAdmin(reservationGroupId: string, req: Request) {
    const token = req.headers['authorization']?.replace('Bearer ', '');
    const adminUser = token ? this.jwtService.decode(token) : null;

    const rawEvents = await this.databaseService.requests.findMany({
      where: { reservationGroupId: reservationGroupId },
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
    });

    const reservation = await this.databaseService.reservationGroup.findFirst({
      where: { id: reservationGroupId },
      select: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    const events = rawEvents.map((e) => ({
      id: e.id,
      status: e.type,
      description: e.description,
      createdAt: e.createdAt,
      name: e.createdBy.id === adminUser.sub ? 'Você' : e.createdBy.name,
      email: e.createdBy?.email ?? '',
      userId: e.createdBy.id,
    }));
    return {
      requestUserId: reservation?.user.id,
      events,
      createdAt: events[0].createdAt,
      status: events[events.length - 1].status,
    };
  }
}
