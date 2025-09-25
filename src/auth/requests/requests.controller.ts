import { Controller, Get, Query } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { GetRequestsDto } from './requests.model';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  async getRequests(@Query() query: GetRequestsDto) {
    return this.requestsService.getRequests(query);
  }
}