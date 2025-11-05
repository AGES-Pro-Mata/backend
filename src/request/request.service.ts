import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { RequestType, UserType } from 'generated/prisma';
import { GetRequestsQueryDto } from './request.model';
import { GetRequestsProfessorQueryDto, GetProfessorRequestByIdDto } from './request.model';

@Injectable()
export class RequestService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getRequestReservation(query: GetRequestsQueryDto) {
    const { page = 1, limit = 10, status, sort, dir } = query;
    const skip = (page - 1) * limit;

    const baseWhere: any = {
      reservationGroupId: { not: null },
    };

    const statusWhere = status && status.length > 0 ? { type: { in: status } } : undefined;
    const where = statusWhere ? { AND: [baseWhere, statusWhere] } : baseWhere;

    let orderBy: any = { createdAt: 'desc' };
    if (sort && dir) {
      if (sort === 'member.name') {
        orderBy = { reservationGroup: { user: { name: dir } } };
      } else if (sort === 'member.email') {
        orderBy = { reservationGroup: { user: { email: dir } } };
      }
    }

    const [requests, total] = await Promise.all([
      this.databaseService.requests.findMany({
        where,
        select: {
          id: true,
          type: true,
          ReservationGroup: {
            select: {
              id: true,
              user: { select: { email: true, name: true } },
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),

      this.databaseService.requests.count({ where }),
    ]);

    const data = requests
      .filter((r) => r.ReservationGroup)
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

  async getRequestProfessor(
    query: GetRequestsProfessorQueryDto, 
  ) {
    const { page = 1, limit = 10, status, sort, dir } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      reservationGroupId: null,
      ...(status && status.length > 0 && { type: { in: status } }),
      createdBy: {
        userType: UserType.PROFESSOR,
      },
    };

    let orderBy: any = { createdAt: 'desc' }; 
    if (sort && dir) {
      if (sort === 'member.name') {
        orderBy = { createdBy: { name: dir } }; 
      } else if (sort === 'member.email') {
        orderBy = { createdBy: { email: dir } }; 
      } else if (sort === 'request.type') {
        orderBy = { type: dir }; 
      }
    }

    const [requests, total] = await Promise.all([
      this.databaseService.requests.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true, 
          type: true, 
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      this.databaseService.requests.count({ where }), 
    ]);

    const data = requests.map((req) => {
      return {
        id: req.id, 
        member: {
          name: req.createdBy.name ?? 'N/A',
          email: req.createdBy.email ?? 'N/A',
        },
        request: {
          type: req.type,
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
                //birthDate: true,
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

  async getRequestProfessorById(
    id: string,
  ): Promise<GetProfessorRequestByIdDto> {
    const mainRequest = await this.databaseService.requests.findUnique({
      where: {
        id: id,
        reservationGroupId: null, 
      },
      select: {
        id: true,
        type: true,
        description: true,
        createdAt: true,
        createdByUserId: true, 
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            document: true,
            gender: true,
            rg: true,
            institution: true,
            isForeign: true,
            verified: true,
            address: {
              select: {
                street: true,
                number: true,
                city: true,
                zip: true,
                country: true,
              },
            },
          },
        },
      },
    });
   
    if (!mainRequest) {
      throw new NotFoundException('Solicitação de professor não encontrada.');
    }

    const requestHistory = await this.databaseService.requests.findMany({
      where: {
        createdByUserId: mainRequest.createdByUserId,
        reservationGroupId: null, 
      },
      select: {
        id: true,
        type: true,
        description: true,
      },
      orderBy: {
        createdAt: 'asc', 
      },
    });

    return {
      id: mainRequest.id,
      type: mainRequest.type,
      description: mainRequest.description,
      createdAt: mainRequest.createdAt.toISOString(), 
      user: mainRequest.createdBy, 
      requests: requestHistory, 
    };
  }
}


