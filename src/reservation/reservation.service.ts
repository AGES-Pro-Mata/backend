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

async attachDocument(reservationId: string, url: string, userId: string) {
  return this.databaseService.document.create({
    data: {
      url,
      reservationId,
      uploadedByUserId: userId,
    },
  });
}

async createDocumentRequest(reservationId: string, userId: string) {
  return this.databaseService.requests.create({
    data: {
      type: 'DOCUMENT_REQUESTED',
      createdByUserId: userId,
      reservationId,
    },
  });
}

}
