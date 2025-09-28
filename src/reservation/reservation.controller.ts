import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Req } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { Roles } from 'src/auth/role/roles.decorator';
import { UserType } from 'generated/prisma';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UpdateReservationDto } from './reservation.model';
import type { CurrentUser } from 'src/auth/auth.model';
import { User } from 'src/user/user.decorator';

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
  @Get(':id')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  async getReservationAdmin(@Param('id') id: string) {
    return await this.reservationService.getReservationByIdAdmin(id);
  }

  @Get('user/:id')
  @Roles(UserType.ADMIN, UserType.GUEST)
  @ApiBearerAuth('access-token')
  async getReservationUser(@Param('id') id: string, @User() currentuUser: CurrentUser) {
    return await this.reservationService.getReservationByIdUser(id, currentuUser.id);
  }
}
