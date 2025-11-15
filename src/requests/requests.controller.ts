import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { Roles } from 'src/auth/role/roles.decorator';
import { UserType } from 'generated/prisma';
import { ApiBearerAuth } from '@nestjs/swagger';
import { User } from 'src/user/user.decorator';
import type { CurrentUser } from 'src/auth/auth.model';
import { InsertRequestDto } from './requests.model';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get('reservation/:reservationGroupId')
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

  @Get('professor/:professorId')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  async getProfessorRequest(@Param('professorId') professorId: string, @User() user: CurrentUser) {
    return await this.requestsService.getProfessorRequests(professorId, user.id);
  }

  @Post()
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  async insertRequest(@User() user: CurrentUser, @Body() insertRequestDto: InsertRequestDto) {
    await this.requestsService.insertRequest(user.id, insertRequestDto);
  }
}
