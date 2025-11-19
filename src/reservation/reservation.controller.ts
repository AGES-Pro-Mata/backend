import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Delete,
  Post,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { Roles } from 'src/auth/role/roles.decorator';
import { UserType } from 'generated/prisma';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  CreateReservationGroupDto,
  UpdateReservationDto,
  UpdateReservationByAdminDto,
  ReservationGroupStatusFilterDto,
  RegisterMemberDto,
  ReservationSearchParamsDto,
} from './reservation.model';
import { User } from 'src/user/user.decorator';
import { type CurrentUser } from 'src/auth/auth.model';
import { FileInterceptor } from '@nestjs/platform-express';

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

  @Get('admin/:reservationGroupId')
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
  @ApiBearerAuth('access-token')
  @Roles(UserType.GUEST)
  @HttpCode(HttpStatus.OK)
  async getReservationGroups(
    @User() user: CurrentUser,
    @Query() filter: ReservationGroupStatusFilterDto,
  ) {
    return await this.reservationService.getReservationGroups(user.id, filter);
  }

  @Get('user/:reservationGroupId')
  @Roles(UserType.GUEST)
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

  @Post(':reservationGroupId/request/receipt')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Anexa um comprovante à reserva e cria uma solicitação de aprovação.' })
  @ApiResponse({
    status: 201,
    description: 'Comprovante anexado e solicitação de aprovação criada com sucesso.',
  })
  @Roles(UserType.GUEST)
  @UseInterceptors(FileInterceptor('paymentReceipt'))
  @ApiConsumes('multipart/form-data')
  async attachReceiptAndRequestApproval(
    @User() user: CurrentUser,
    @Param('reservationGroupId') reservationGroupId: string,
    @UploadedFile() paymentReceipt: Express.Multer.File | null,
  ) {
    await this.reservationService.createDocumentRequest(
      reservationGroupId,
      user.id,
      paymentReceipt,
    );
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

  @Post(':reservationGroupId/members')
  @Roles(UserType.GUEST)
  async registerMembers(
    @User() user: CurrentUser,
    @Body() registerMemberDto: RegisterMemberDto[],
    @Param('reservationGroupId') reservationGroupId: string,
  ) {
    return await this.reservationService.registerMembers(
      reservationGroupId,
      user.id,
      registerMemberDto,
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

  @Post(':reservationId/admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserType.ADMIN)
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

  @Get()
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  async getAllReservationGroups(@Query() searchParams: ReservationSearchParamsDto) {
    return await this.reservationService.getAllReservationGroups(searchParams);
  }
}
