import { Controller, Get, HttpCode, HttpStatus, Param, Query } from '@nestjs/common';
import { Roles } from 'src/auth/role/roles.decorator';
import { UserType } from 'generated/prisma';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequestService } from './request.service';
import { GetRequestsQueryDto, PaginatedRequestResponseDto, GetRequestsProfessorQueryDto } from './request.model';

@ApiTags('request')
@Controller('request')
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 200, type: PaginatedRequestResponseDto })
  async getAllRequest(@Query() query: GetRequestsQueryDto): Promise<PaginatedRequestResponseDto> {
    return await this.requestService.getRequestReservation(query);
  }

  @Get('teacher')
  @HttpCode(HttpStatus.OK)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 200, type: PaginatedRequestResponseDto })
  async getAllRequests(@Query() query: GetRequestsProfessorQueryDto): Promise<PaginatedRequestResponseDto> {
    return await this.requestService.getRequestProfessor(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 200, description: 'Request found successfully.' })
  @ApiResponse({ status: 404, description: 'Request not found.' })
  async getRequestById(@Param('id') id: string) {
    return await this.requestService.getRequestByIdAdmin(id);
  }

  @Get('teacher/:id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 200, description: 'Request found successfully.' })
  @ApiResponse({ status: 404, description: 'Request not found.' })
  async getProfessorRequestById(@Param('id') id: string) {
    return await this.requestService.getRequestProfessorById(id);
  }
}