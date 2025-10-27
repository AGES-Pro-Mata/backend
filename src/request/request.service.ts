import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { RequestType } from 'generated/prisma';
import { GetRequestsQueryDto } from './request.model';

@Injectable()
export class RequestService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getRequest(query: GetRequestsQueryDto) {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where =
      status && status.length > 0
        ? {
            requests: {
              some: {
                type: { in: status },
              },
            },
          }
        : {};

    const [groups, total] = await Promise.all([
      this.databaseService.reservationGroup.findMany({
        where,
        select: {
          id: true,
          user: { select: { email: true, name: true } },
          requests: {
            where: status && status.length > 0 ? { type: { in: status } } : {}, // ✅ FILTRO AQUI
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { type: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.databaseService.reservationGroup.count({ where }),
    ]);

    const data = groups.map((g) => ({
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
}