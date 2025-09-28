import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { UpdateReservationDto, CreateFinalizeReservationDto } from './reservation.model';

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

  async finalizeReservation(payload: CreateFinalizeReservationDto) {
    const createdReservations = [] as any[];

    // Cria uma reserva por experiência informada
    for (const exp of payload.experiences) {
      const created = await this.databaseService.reservation.create({
        data: {
          userId: payload.userId,
          experienceId: exp.experienceId,
          startDate: new Date(exp.date),
          status: 'PENDING',
          notes: payload.notes,
        },
      });
      createdReservations.push(created);
    }

    const peopleSummary = payload.peopleList && payload.peopleList.length > 0
      ? payload.peopleList.map((p) => `${p.name} (${p.document})`).join(', ')
      : '';

    await this.databaseService.requests.create({
      data: {
        type: 'CREATED',
        createdByUserId: payload.userId,
        reservationId: createdReservations[0]?.id || null,
        description: `Total people: ${payload.totalPeople}. ${peopleSummary} ${payload.notes ?? ''}`,
      },
    });

    // Retorna todas as reservas criadas (uma por experiência)
    return createdReservations;
  }
}
