import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { RequestType } from 'generated/prisma';
import { GetRequestsQueryDto } from './request.model';

@Injectable()
export class RequestService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getRequest(query: GetRequestsQueryDto) {
    const { page, limit, status, sort, dir } = query;
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
            where: status && status.length > 0 ? { type: { in: status } } : {},
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