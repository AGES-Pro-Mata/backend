import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CurrentUser } from 'src/auth/auth.model';
import { InsertRequestDto } from './requests.model';
import { PROFESSOR_REQUEST_TYPES } from 'src/professor/professor.model';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class RequestsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async getRequestsByIdReservationGroupAdmin(reservationGroupId: string, adminUser: CurrentUser) {
    const reservationGroup = await this.databaseService.reservationGroup.findUnique({
      where: { id: reservationGroupId },
      select: {
        userId: true,
        requests: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            type: true,
            description: true,
            fileUrl: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            createdAt: true,
          },
        },
      },
    });

    if (reservationGroup === null) {
      throw new NotFoundException('ReservationGroup requests not found');
    }

    const events = reservationGroup.requests.map((e) => ({
      id: e.id,
      status: e.type,
      description: e.description,
      createdAt: e.createdAt,
      name: e.createdBy.name,
      email: e.createdBy.email,
      userId: e.createdBy.id,
      fileUrl: e.fileUrl,
      isSender: e.createdBy.id === adminUser.id,
      isRequester: e.createdBy.id === reservationGroup.userId,
    }));

    return {
      events,
      createdAt: events[0].createdAt,
      status: events[events.length - 1].status,
    };
  }

  async getProfessorRequests(professorId: string, userId: string) {
    const professor = await this.databaseService.user.findUnique({
      where: {
        id: professorId,
        ProfessorRequests: {
          some: {},
        },
      },
      select: {
        Requests: {
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
        },
      },
    });

    if (professor === null) {
      throw new NotFoundException('Professor requests not found');
    }

    const events = professor.Requests.map((e) => ({
      id: e.id,
      status: e.type,
      description: e.description,
      createdAt: e.createdAt,
      name: e.createdBy.name,
      email: e.createdBy.email,
      userId: e.createdBy.id,
      isSender: e.createdBy.id === userId,
      isRequester: e.createdBy.id === professorId,
    }));

    return {
      events,
      createdAt: events[0].createdAt,
      status: events[events.length - 1].status,
    };
  }

  async insertRequest(createdByUserId: string, insertRequestDto: InsertRequestDto) {
    if (
      insertRequestDto.reservationGroupId === undefined &&
      insertRequestDto.professorId === undefined
    ) {
      throw new BadRequestException('ProfessorId and ReservationGroupId not found');
    }

    const isProfessorRequest = PROFESSOR_REQUEST_TYPES.includes(insertRequestDto.type);

    if (insertRequestDto.professorId && !isProfessorRequest) {
      throw new BadRequestException(`${insertRequestDto.type} is not valid for professor requests`);
    }

    if (insertRequestDto.reservationGroupId && isProfessorRequest) {
      throw new BadRequestException(
        `${insertRequestDto.type} is not valid for reservation requests`,
      );
    }

    if (insertRequestDto.reservationGroupId) {
      await this.sendStatusChangeEmail(insertRequestDto.reservationGroupId);
    }

    return await this.databaseService.requests.create({
      data: { ...insertRequestDto, createdByUserId },
    });
  }

  private async sendStatusChangeEmail(reservationGroupId: string) {
    try {
      const reservation = await this.databaseService.reservationGroup.findUnique({
        where: { id: reservationGroupId },
        select: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      if (reservation?.user?.email) {
        await this.mailService.sendTemplateMail(
          reservation.user.email,
          'Atualização de Reserva',
          'change-status',
          {
            userName: reservation.user.name,
            systemUrl: `${this.configService.get<string>('FRONTEND_URL')}user/my-reservations`,
          },
        );
      }
    } catch (error) {
      console.error('Erro ao enviar email:', error);
    }
  }
}
