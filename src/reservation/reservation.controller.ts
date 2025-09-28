import { Body, Controller, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { Roles } from 'src/auth/role/roles.decorator';
import { UserType } from 'generated/prisma';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UpdateReservationDto, CreateFinalizeReservationDto } from './reservation.model';

@Controller('reservation')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Patch(':reservationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  async updateReservationAsAdmin(
    @Param('reservationId') reservationId: string,
    @Body() updateReservationDto: UpdateReservationDto,
  ) {
    await this.reservationService.updateReservation(reservationId, updateReservationDto);
  }

  @Post('finish')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserType.ADMIN, UserType.GUEST, UserType.PROFESSOR)
  @ApiBearerAuth('access-token')
  async finalizeReservation(
    @Body() payload: CreateFinalizeReservationDto,
  ) {
    const reservation = await this.reservationService.finalizeReservation(payload);
    return reservation;
  }
}
