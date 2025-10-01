import { Body, Controller, Get, HttpCode, HttpStatus, Param, Delete, Post } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { Roles } from 'src/auth/role/roles.decorator';
import { UserType } from 'generated/prisma';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CreateReservationGroupDto, UpdateReservationDto } from './reservation.model';
import { User } from 'src/user/user.decorator';
import { type CurrentUser } from 'src/auth/auth.model';

@Controller('reservation')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post('group/:reservationGroupId/request')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  async createRequestAdmin(
    @User() user: CurrentUser,
    @Param('reservationGroupId') reservationId: string,
    @Body() updateReservationDto: UpdateReservationDto,
  ) {
    await this.reservationService.createRequestAdmin(reservationId, updateReservationDto, user.id);
  }

  @Post('group/:reservationGroupId/request/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserType.GUEST)
  @ApiBearerAuth('access-token')
  async createCancelReservationRequest(
    @User() user: CurrentUser,
    @Param('reservationGroupId') reservationId: string,
  ) {
    await this.reservationService.createCancelRequest(reservationId, user.id);
  }

  @Delete(':reservationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  async deleteReservation(@Param('reservationId') reservationId: string) {
    return await this.reservationService.deleteReservation(reservationId);
  }

  @Get('group/mine')
  @Roles(UserType.GUEST)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  async getReservations(@User() user: CurrentUser) {
    return await this.reservationService.getReservations(user.id);
  }

  @Post('group')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserType.ADMIN, UserType.GUEST)
  @ApiBearerAuth('access-token')
  async createReservationGroup(
    @User() user: CurrentUser,
    @Body() payload: CreateReservationGroupDto,
  ) {
    return await this.reservationService.createReservationGroup(user.id, payload);
  }
}
