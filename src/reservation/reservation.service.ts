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

  async sendDeleteReservation(reservationId: string): Promise<any> {
    return await this.databaseService.reservation.update({
      where: { id: reservationId },
      data: { status: 'cancelamento_pendente' },
    });
  }

  async deleteReservation(reservationId: string): Promise<any> {
    return await this.databaseService.prisma.reservation.delete({
      where: { id: reservationId },
    });
  }
}
