import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common';
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

  async getReservationByIdAdmin(id: string) {
    const reservation = await this.databaseService.reservation.findUnique({
      where: { id },
      select:{
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
          }
        },
        Guests: true,
        Requests: true,
        experience: true,
      },
    });

    if (!reservation) throw new BadRequestException('Reservation not found');

    return reservation;
  }

  async getReservationByIdUser(id: string, userId: string) {
    const reservation = await this.databaseService.reservation.findUnique({
      where: { id, userId },
      select:{
        startDate: true,
        endDate: true,
        status: true,
        notes: true,
        Guests: true,
        experience: true,
      }
    });

    if (!reservation) throw new BadRequestException('Reservation not found');

    return reservation;
  }
}
