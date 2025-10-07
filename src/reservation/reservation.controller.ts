import { Body, Controller, Get, HttpCode, HttpStatus, Param, Delete, Post } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { Roles } from 'src/auth/role/roles.decorator';
import { UserType } from 'generated/prisma';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  AttachReceiptDto,
  CreateReservationGroupDto,
  UpdateReservationDto,
  UpdateReservationByAdminDto,
} from './reservation.model';
import { User } from 'src/user/user.decorator';
import { type CurrentUser } from 'src/auth/auth.model';

@Controller('reservation/group')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserType.ADMIN, UserType.GUEST)
  @ApiBearerAuth('access-token')
  async createReservationGroup(
    @User() user: CurrentUser,
    @Body() payload: CreateReservationGroupDto,
  ) {
    return await this.reservationService.createReservationGroup(user.id, payload);
  }

  @Get(':reservationGroupId')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  async getReservationAdmin(@Param('reservationGroupId') reservationGroupId: string) {
    return await this.reservationService.getReservationGroupByIdAdmin(reservationGroupId);
  }

  @Delete(':reservationGroupId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  async deleteReservation(@Param('reservationGroupId') reservationGroupId: string) {
    return await this.reservationService.deleteReservation(reservationGroupId);
  }

  @Get('user')
  @Roles(UserType.GUEST)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  async getReservations(@User() user: CurrentUser) {
    return await this.reservationService.getReservations(user.id);
  }

  @Get('user/:reservationGroupId')
  @Roles(UserType.ADMIN, UserType.GUEST)
  @ApiBearerAuth('access-token')
  async getReservationUser(
    @Param('reservationGroupId') reservationGroupId: string,
    @User() currentuUser: CurrentUser,
  ) {
    return await this.reservationService.getReservationGroupById(
      reservationGroupId,
      currentuUser.id,
    );
  }

  @Post(':reservationGroupId/receipt')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Anexa um comprovante à reserva e cria uma solicitação de aprovação.' })
  @ApiResponse({
    status: 201,
    description: 'Comprovante anexado e solicitação de aprovação criada com sucesso.',
  })
  @Roles(UserType.ADMIN)
  async attachReceiptAndRequestApproval(
    @User() user: CurrentUser,
    @Param('reservationGroupId') reservationGroupId: string,
    @Body() attachReceiptDto: AttachReceiptDto,
  ) {
    await this.reservationService.attachDocument(reservationGroupId, attachReceiptDto.url, user.id);
    await this.reservationService.createDocumentRequest(reservationGroupId, user.id);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Comprovante anexado e solicitação de aprovação enviada.',
    };
  }

  @Post(':reservationGroupId/request')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  async createRequestAdmin(
    @User() user: CurrentUser,
    @Param('reservationGroupId') reservationGroupId: string,
    @Body() updateReservationDto: UpdateReservationDto,
  ) {
    await this.reservationService.createRequestAdmin(
      reservationGroupId,
      updateReservationDto,
      user.id,
    );
  }

  @Post(':reservationGroupId/request/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserType.GUEST)
  @ApiBearerAuth('access-token')
  async createCancelReservationRequest(
    @User() user: CurrentUser,
    @Param('reservationGroupId') reservationGroupId: string,
  ) {
    await this.reservationService.createCancelRequest(reservationGroupId, user.id);
  }

  @Post(':reservationGroupId/request/document')
  @Roles(UserType.GUEST)
  async requestDocumentApproval(
    @User() user: CurrentUser,
    @Param('reservationGroupId') reservationGroupId: string,
  ) {
    return this.reservationService.createDocumentRequest(reservationGroupId, user.id);
  }

  @Post(':reservationId/admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  // @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  async updateReservationAsAdmin(
    @Param('reservationId') reservationId: string,
    @Body() updateReservationDto: UpdateReservationByAdminDto,
  ) {
    return await this.reservationService.updateReservationByAdmin(
      reservationId,
      updateReservationDto,
    );
  }
}
