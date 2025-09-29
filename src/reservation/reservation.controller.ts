import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { Roles } from 'src/auth/role/roles.decorator';
import { UserType } from 'generated/prisma';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UpdateReservationDto } from './reservation.model';

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

  @Post('/cancelReservation/:reservationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  async deleteReservationAsAdmin(@Param('reservationId') reservationId: string) {
    await this.reservationService.sendDeleteReservation(reservationId);
  }

  @Delete('/cancel/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  async deleteReservation(@Param('id') id: string) {
    return await this.reservationService.deleteReservation(id);
  }
}
