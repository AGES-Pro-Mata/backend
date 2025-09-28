import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/role/roles.decorator';
import { RoleGuard } from '../auth/role/role.guard';
import { RequestsService } from './requests.service';
import { GetRequestsDto } from './requests.model';

@Controller('requests')
@UseGuards(RoleGuard)
@Roles('ADMIN')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  async getRequests(@Query() query: GetRequestsDto) {
    return this.requestsService.getRequests(query);
  }
}
