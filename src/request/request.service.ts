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

  async getRequestProfessor(query: GetRequestsQueryDto) {
    const { page = 1, limit = 10, status, sort, dir } = query;
    const skip = (page - 1) * limit;

    const userWhere: any = {
      userType: UserType.PROFESSOR,
    };

    const requestsStatusWhere =
      status && status.length > 0
        ? {
            ReservationGroup: {
              some: {
                requests: {
                  some: {
                    type: { in: status },
                  },
                },
              },
            },
          }
        : {};

    const where = Object.keys(requestsStatusWhere).length
      ? { AND: [userWhere, requestsStatusWhere] }
      : userWhere;

    let orderBy: any = { createdAt: 'desc' };
    if (sort && dir) {
      if (sort === 'member.name') orderBy = { name: dir };
      else if (sort === 'member.email') orderBy = { email: dir };
    }

    const [users, total] = await Promise.all([
      this.databaseService.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          name: true,
          email: true,
          ReservationGroup: {
            select: {
              requests: {
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { type: true },
                where: status && status.length > 0 ? { type: { in: status } } : undefined,
              },
            },
          },
        },
      }),
      this.databaseService.user.count({ where }),
    ]);

    const data = users.map((u) => {
      const latestRequest =
        u.ReservationGroup?.flatMap((g) => g.requests)[0]?.type ?? RequestType.CREATED;

      return {
        id: u.id,
        member: {
          name: u.name ?? 'N/A',
          email: u.email ?? 'N/A',
        },
        request: {
          type: latestRequest,
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
