import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { GetRequestsDto } from './requests.model';

@Injectable()
export class RequestsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getRequests(query: GetRequestsDto) {
    const { page = '1', limit = '10', status } = query;
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);

    const requestsTypeEnum = status ? (this.databaseService.RequestType as any)[status] : undefined;

    const whereClause = requestsTypeEnum ? { type: requestsTypeEnum } : undefined;

    const total = await this.databaseService.Requests.count({ where: whereClause });
    const totalPages = Math.ceil(total / pageSize);

    if (pageNumber > totalPages && totalPages > 0) {
      throw new BadRequestException(
        `Page ${pageNumber} does not exist. Total pages: ${totalPages}.`,
      );
    }

    const requests = await this.databaseService.Requests.findMany({
      where: whereClause,
      skip: (pageNumber - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: true,
        reservation: true,
      },
    });

    return {
      total,
      totalPages,
      page: pageNumber,
      limit: pageSize,
      data: requests,
    };
  }
}
