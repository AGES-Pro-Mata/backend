import { Body, Controller, HttpCode, HttpStatus, Param, Patch,Get } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { Roles } from 'src/auth/role/roles.decorator';
import { UserType } from 'generated/prisma';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UpdateReservationDto } from './reservation.model';
import type { CurrentUser } from 'src/auth/auth.model';

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

  @Get("/getReservations")
  async getReservations(@Body() user:CurrentUser){
    await this.reservationService.getReservations(user.id);
  }
}
