import { Injectable } from '@nestjs/common';
import { ProfessorRequestSearchParamsDto } from './professor.model';
import { DatabaseService } from 'src/database/database.service';
import { RequestType } from 'generated/prisma';

@Injectable()
export class ProfessorService {
  constructor(private readonly databaseService: DatabaseService) {}

  async searchRequests(professorRequestSearchParamsDto: ProfessorRequestSearchParamsDto) {
    const { page, limit, name, email, status } = professorRequestSearchParamsDto;

    const offset = page * limit;

    const baseQuery = `
    SELECT
      u.id,
      u.name,
      u.email,
      r_last.type AS status
    FROM "User" u
    JOIN LATERAL (
      SELECT r.type, r."createdAt"
      FROM "Requests" r
      WHERE r."professorId" = u.id
      ORDER BY r."createdAt" DESC
      LIMIT 1
    ) r_last ON TRUE
    WHERE 1=1
      -- filtro por nome
      AND ($1::text IS NULL OR u.name ILIKE '%' || $1 || '%')
      -- filtro por email
      AND ($2::text IS NULL OR u.email ILIKE '%' || $2 || '%')
      -- filtro por status aplicado NA ÚLTIMA request
      AND (
        $3::"RequestType"[] IS NULL
        OR r_last.type = ANY($3::"RequestType"[])
      )
  `;

    type RawProfessorRow = {
      id: string;
      name: string;
      email: string;
      status: RequestType[number] | null;
    };

    const professors = await this.databaseService.$queryRawUnsafe<RawProfessorRow[]>(
      `
    ${baseQuery}
    ORDER BY u.name ASC, r_last."createdAt" DESC
    OFFSET $4
    LIMIT $5
    `,
      name ?? null,
      email ?? null,
      status && status.length > 0 ? status : null,
      offset,
      limit,
    );

    const totalResult = await this.databaseService.$queryRawUnsafe<{ count: bigint }[]>(
      `
    SELECT COUNT(*)::bigint AS count
    FROM (
      ${baseQuery}
    ) AS sub
    `,
      name ?? null,
      email ?? null,
      status && status.length > 0 ? status : null,
    );

    const total = Number(totalResult[0]?.count ?? 0);

    return {
      page,
      limit,
      total,
      items: professors.map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        status: p.status,
      })),
    };
  }
}
