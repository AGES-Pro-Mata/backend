import { Body, Controller, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { Roles } from 'src/auth/role/roles.decorator';
import { UserType } from 'generated/prisma';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UpdateReservationDto } from './reservation.model';
import { AttachReceiptDto } from './dtos/attach-receipt.dto';

interface AuthUser {
  id: string;
}

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

  @Post(':reservationId/document')
  async attachDocument(
  @Param('reservationId') reservationId: string,
  @Body() body: { url: string, userId: string },)
  {return this.reservationService.attachDocument(reservationId, body.url, body.userId);}

  @Post(':reservationId/request-document')
  async requestDocumentApproval(
  @Param('reservationId') reservationId: string,
  @Body() body: { userId: string },)
  {return this.reservationService.createDocumentRequest(reservationId, body.userId);}

  @Post(':reservationId/receipt')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Anexa um comprovante à reserva e cria uma solicitação de aprovação.' })
  @ApiResponse({ status: 201, description: 'Comprovante anexado e solicitação de aprovação criada com sucesso.' })
  async attachReceiptAndRequestApproval(
  @Param('reservationId') reservationId: string,
  @Body() attachReceiptDto: AttachReceiptDto,)
    
  {const userId = 'USER_ID_PLACEHOLDER'; 

    await this.reservationService.attachDocument(
      reservationId,
      attachReceiptDto.url,
      userId,
    );

    await this.reservationService.createDocumentRequest(
      reservationId,
      userId,
    );

    return { 
      statusCode: HttpStatus.CREATED,
      message: 'Comprovante anexado e solicitação de aprovação enviada.',
    };
  }
}

