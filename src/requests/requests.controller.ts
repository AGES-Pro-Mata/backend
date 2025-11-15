import { Controller, Get, Param } from '@nestjs/common';
import type { Request } from 'express';
import { RequestsService } from './requests.service';
import { Roles } from 'src/auth/role/roles.decorator';
import { UserType } from 'generated/prisma';
import { ApiBearerAuth } from '@nestjs/swagger';
import { User } from 'src/user/user.decorator';
import type { CurrentUser } from 'src/auth/auth.model';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get(':reservationGroupId')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  async getReservationAdmin(
    @Param('reservationGroupId') reservationGroupId: string,
    @User() user: CurrentUser,
  ) {
    return await this.requestsService.getRequestsByIdReservationGroupAdmin(
      reservationGroupId,
      user,
    );
  }
}
