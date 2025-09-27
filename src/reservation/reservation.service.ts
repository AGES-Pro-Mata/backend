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
    // Cria a reserva principal
    const reservation = await this.databaseService.reservation.create({
      data: {
        clientId: payload.clientId,
        totalPeople: payload.totalPeople,
        note: payload.note,
        status: 'PENDING',
      },
    });

    // Cria as experiências vinculadas à reserva
    for (const exp of payload.experiences) {
      await this.databaseService.reservationExperience.create({
        data: {
          reservationId: reservation.id,
          experienceId: exp.experienceId,
          peopleCount: exp.peopleCount,
          date: exp.date,
        },
      });
    }

    // Cria a lista de pessoas, se fornecida
    if (payload.peopleList && payload.peopleList.length > 0) {
      for (const person of payload.peopleList) {
        await this.databaseService.reservationPerson.create({
          data: {
            reservationId: reservation.id,
            name: person.name,
            phone: person.phone,
            birthDate: person.birthDate,
            document: person.document,
            gender: person.gender,
          },
        });
      }
    }

    await this.databaseService.reservationRequest.create({
      data: {
        reservationId: reservation.id,
        status: 'PENDING',
      },
    });

    return reservation;
  }
}
