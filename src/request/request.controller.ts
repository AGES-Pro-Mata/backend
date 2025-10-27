import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { Roles } from 'src/auth/role/roles.decorator';
import { UserType } from 'generated/prisma';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequestService } from './request.service';
import { GetRequestsQueryDto, PaginatedRequestResponseDto } from './request.model';

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
    return await this.requestService.getRequest(query);
  }
}