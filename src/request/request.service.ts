import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { RequestType, UserType } from 'generated/prisma';
import { GetRequestsQueryDto } from './request.model';

@Injectable()
export class RequestService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getRequestReservation(query: GetRequestsQueryDto) {
    const { page = 1, limit = 10, status, sort, dir } = query;
    const skip = (page - 1) * limit;

    // 1. Filtro base: Apenas requests que SÃO de um grupo (não de professores)
    const baseWhere: any = {
      reservationGroupId: { not: null },
    };

    // 2. Adiciona o filtro de status (se existir)
    const statusWhere = status && status.length > 0 ? { type: { in: status } } : undefined;

    const where = statusWhere ? { AND: [baseWhere, statusWhere] } : baseWhere;

    // 3. Ordenação
    let orderBy: any = { createdAt: 'desc' }; // Ordenar pela data da request
    if (sort && dir) {
      if (sort === 'member.name') {
        orderBy = { reservationGroup: { user: { name: dir } } };
      } else if (sort === 'member.email') {
        orderBy = { reservationGroup: { user: { email: dir } } };
      }
    }

    // 4. MUDANÇA PRINCIPAL: Buscamos na tabela 'requests'
    const [requests, total] = await Promise.all([
      this.databaseService.requests.findMany({
        where,
        select: {
          id: true, // ID da Request
          type: true,
          ReservationGroup: {
            // Incluímos os dados do grupo e do usuário
            select: {
              id: true, // ID do Grupo
              user: { select: { email: true, name: true } },
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
      // Contamos o total de requests que batem com o filtro
      this.databaseService.requests.count({ where }),
    ]);

    // 5. Mapeamos os dados para o DTO de resposta
    const data = requests
      .filter((r) => r.ReservationGroup) // Filtra requests sem grupo
      .map((r) => {
        const group = r.ReservationGroup!;

        return {
          id: r.id,
          member: {
            name: group.user?.name ?? 'N/A',
            email: group.user?.email ?? 'N/A',
          },
          request: {
            type: r.type as RequestType,
          },
        };
      });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getRequestProfessor(query: GetRequestsQueryDto) {
    const { page = 1, limit = 10, status, sort, dir } = query;
    const skip = (page - 1) * limit;

    const requestsWhere =
      status && status.length > 0
        ? {
            requests: {
              some: {
                type: { in: status },
              },
            },
          }
        : undefined;

    const where = requestsWhere ?? {};

    let orderBy: any = { createdAt: 'desc' };

    if (sort && dir) {
      if (sort === 'member.name') {
        orderBy = { user: { name: dir } };
      } else if (sort === 'member.email') {
        orderBy = { user: { email: dir } };
      }
    }

    const [groups, total] = await Promise.all([
      this.databaseService.reservationGroup.findMany({
        where,
        select: {
          id: true,
          user: { select: { email: true, name: true } },
          requests: {
            where: status && status.length > 0 ? { type: { in: status } } : undefined,
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { type: true },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
      this.databaseService.reservationGroup.count({ where }),
    ]);

    const data = groups.map((g) => ({
      id: g.id,
      member: {
        name: g.user?.name ?? 'N/A',
        email: g.user?.email ?? 'N/A',
      },
      request: {
        type: (g.requests[0]?.type as RequestType) ?? RequestType.CREATED,
      },
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getRequestByIdAdmin(requestId: string) {
    const request = await this.databaseService.requests.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        type: true,
        description: true,
        ReservationGroup: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            members: {
              select: {
                id: true,
                name: true,
                document: true,
                gender: true,
                phone: true,
                birthDate: true,
              },
            },
            reservations: {
              select: {
                membersCount: true,
                notes: true,
                experience: {
                  select: {
                    id: true,
                    name: true,
                    startDate: true,
                    endDate: true,
                    price: true,
                    capacity: true,
                    trailLength: true,
                    durationMinutes: true,
                    image: {
                      select: {
                        url: true,
                      },
                    },
                  },
                },
              },
            },
            requests: {
              select: {
                id: true,
                type: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!request || !request.ReservationGroup) {
      throw new NotFoundException('Request não encontrada');
    }

    return {
      id: request.id,
      type: request.type,
      description: request.description,
      user: request.ReservationGroup.user,
      members: request.ReservationGroup.members,
      reservations: request.ReservationGroup.reservations,
      requests: request.ReservationGroup.requests,
    };
  }
}
