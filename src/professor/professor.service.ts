import { Injectable } from '@nestjs/common';
import { ProfessorRequestSearchParamsDto } from './professor.model';
import { DatabaseService } from 'src/database/database.service';
import { Prisma } from 'generated/prisma';

@Injectable()
export class ProfessorService {
  constructor(private readonly databaseService: DatabaseService) {}

  async searchRequests(professorRequestSearchParamsDto: ProfessorRequestSearchParamsDto) {
    const where: Prisma.UserWhereInput = {
      name: {
        contains: professorRequestSearchParamsDto.name,
      },
      email: {
        contains: professorRequestSearchParamsDto.email,
      },
      ProfessorRequests: {
        some: {
          type: professorRequestSearchParamsDto.status,
        },
      },
    };

    const [professors, count] = await this.databaseService.$transaction([
      this.databaseService.user.findMany({
        where,
        select: {
          name: true,
          email: true,
          Requests: {
            select: {
              type: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },

        skip: professorRequestSearchParamsDto.limit * professorRequestSearchParamsDto.page,
        take: professorRequestSearchParamsDto.limit,
      }),

      this.databaseService.user.count({ where }),
    ]);

    return {
      page: professorRequestSearchParamsDto.page,
      limit: professorRequestSearchParamsDto.limit,
      total: count,
      items: professors.map((p) => ({
        name: p.name,
        email: p.email,
        status: p.Requests[0].type,
      })),
    };
  }
}
