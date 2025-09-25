import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { UpdateReservationDto } from './reservation.model';
import { UserType } from 'generated/prisma';

@Injectable()
export class ReservationService {
  constructor(private readonly databaseService: DatabaseService) {}

  async updateReservation(reservationId: string, updateReservationDto: UpdateReservationDto) {
    await this.databaseService.Reservation.update({
      where: { id: reservationId },
      data: {
        status: updateReservationDto.action,
        notes: updateReservationDto.text,
      },
    });
  }

  async getReservationById(id: string) {
  const reservation = await this.databaseService.Reservation.findUnique({
    where: { id },
    include: {
      user: true,          
      experience: true,    
      Requests: {          
        include: {
          createdBy: true,
        },
      },
    },
  });

  if (!reservation) {
    throw new Error("Reservation not found");
  }

  const person = {
    name: reservation.user.name,
    phone: reservation.user.phone,
    birthDate: reservation.user.createdAt,
    document: reservation.user.cpf || reservation.user.rg || "",
    gender: reservation.user.gender,
  };

  const observation = reservation.notes || null;

  const experience = {
    name: reservation.experience.name,
    price: reservation.experience.price,
    startDate: reservation.experience.startDate,
    endDate: reservation.experience.endDate,
    capacity: reservation.experience.capacity,
    trailLength: reservation.experience.trailLength,
    durationMinutes: reservation.experience.durationMinutes,
  };

  const actions = (reservation.requests as Array<{
    type: string;
    createdAt: Date;
    createdBy: { name: string };
    description: string;
  }>).map((req) => ({
    type: req.type,
    date: req.createdAt,
    createdBy: req.createdBy.name,
    description: req.description,
  }));

  if (reservation.user.userType === UserType.ADMIN) {
    return {
      ...person,
      observation,
      experience,
      actions,
    };
  }

  return {
    ...person,
    observation,
    experience,
  };
}

}
