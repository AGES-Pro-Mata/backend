import { Controller, Get, Param, Req } from '@nestjs/common';
import type { Request } from 'express';
import { RequestsService } from './requests.service';
import { Roles } from 'src/auth/role/roles.decorator';
import { UserType } from 'generated/prisma';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get(':reservationGroupId')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  async getReservationAdmin(
    @Param('reservationGroupId') reservationGroupId: string,
    @Req() req: Request,
  ) {
    return await this.requestsService.getRequestsByIdReservationGroupAdmin(reservationGroupId, req);
  }
}
