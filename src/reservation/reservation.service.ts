import { Injectable, BadRequestException } from '@nestjs/common';
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

        // Calcula o total de pessoas a partir da lista de pessoas enviadas
        const totalPeople = payload.peopleList ? payload.peopleList.length : 0;

        if (totalPeople === 0) {
            throw new BadRequestException('A reserva deve ter pelo menos uma pessoas.');
        }

        const requestedStart = new Date(payload.startDate);
        const requestedEnd = new Date(payload.endDate);

        // Validação básica de conversão de datas
        if (isNaN(requestedStart.getTime()) || isNaN(requestedEnd.getTime())) {
            throw new BadRequestException('As datas de início e fim da reserva são inválidas.');
        }

        // Cria uma reserva por experiência informada
        for (const exp of payload.experiences) {
            // Busca a experiência
            const experience = await this.databaseService.experience.findUnique({
                where: { id: exp.experienceId },
            });

            if (!experience) {
                throw new BadRequestException(`Experiência ${exp.experienceId} não encontrada`);
            }

            // Garante que a experiência tem datas de validade definidas
            if (!experience.startDate || !experience.endDate) {
                throw new BadRequestException(
                    `A experiência ${exp.experienceId} não possui data de início ou fim definidos.`,
                );
            }

            const expStartLimit = new Date(experience.startDate);
            const expEndLimit = new Date(experience.endDate);

            // Verifica se as datas solicitadas estão dentro do período de validade da experiência
            if (
                requestedStart.getTime() < expStartLimit.getTime() || 
                requestedEnd.getTime() > expEndLimit.getTime()
            ) {
                throw new BadRequestException(
                    `As datas solicitadas (${payload.startDate} - ${payload.endDate}) estão fora do período de validade da experiência (${experience.startDate} - ${experience.endDate}).`,
                );
            }
            
            // criação da reserva
            const created = await this.databaseService.reservation.create({
                data: {
                    userId: payload.userId,
                    experienceId: exp.experienceId,
                    startDate: requestedStart, 
                    endDate: requestedEnd,
                    status: 'PENDING',
                    notes: payload.notes,
                    
                },
            });
            
            createdReservations.push({
                ...created,
                startDateExp: experience.startDate,
                endDateExp: experience.endDate,
                totalPeople: totalPeople, 
                peopleList: payload.peopleList, 
            });
        }

        const peopleSummary = payload.peopleList && payload.peopleList.length > 0
          ? payload.peopleList.map((p) => `${p.name} (${p.document})`).join(', ')
          : '';

        await this.databaseService.requests.create({
          data: {
            type: 'CREATED',
            createdByUserId: payload.userId,
            reservationId: createdReservations[0]?.id || null,
            description: `Total de pessoas: ${totalPeople}. ${peopleSummary} ${payload.notes ?? ''}`,
          },
        });

        return createdReservations;
    }
}

