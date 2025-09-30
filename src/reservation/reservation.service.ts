import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { UpdateReservationDto } from './reservation.model';

@Injectable()
export class ReservationService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createRequestAdmin(
    reservationId: string,
    updateReservationDto: UpdateReservationDto,
    userId: string,
  ) {
    const payload = await this.databaseService.reservation.count({
      where: {
        id: reservationId,
      },
    });

    if (payload === 0) {
      throw new NotFoundException();
    }

    await this.databaseService.requests.create({
      data: {
        description: updateReservationDto.description,
        type: updateReservationDto.type,
        reservationId,
        createdByUserId: userId,
      },
    });
  }

  async createCancelRequest(reservationId: string, userId: string) {
    const payload = await this.databaseService.reservation.count({
      where: {
        id: reservationId,
        userId,
      },
    });

    if (payload === 0) {
      throw new NotFoundException();
    }

    await this.databaseService.requests.create({
      data: {
        type: 'CANCELED_REQUESTED',
        reservationId: reservationId,
        createdByUserId: userId,
      },
    });
  }

  async deleteReservation(reservationId: string) {
    await this.databaseService.member.updateMany({
      where: { reservationId },
      data: {
        document: null,
        active: false,
      },
    });

    return await this.databaseService.reservation.update({
      where: { id: reservationId },
      data: {
        active: false,
      },
    });
  }
}
