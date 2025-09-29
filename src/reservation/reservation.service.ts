import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { UpdateReservationDto } from './reservation.model';

@Injectable()
export class ReservationService {
  constructor(private readonly databaseService: DatabaseService) {}

  async updateReservation(reservationId: string, updateReservationDto: UpdateReservationDto) {
    await this.databaseService.reservation.update({
      where: { id: reservationId },
      data: {
        status: updateReservationDto.action,
        notes: updateReservationDto.text,
      },
    });
  }

  async getReservations(userId: string) {
    return await this.databaseService.reservation.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true,
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
          },
        },
      },
    });
  }
}
