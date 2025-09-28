import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { RoleGuard } from 'src/auth/role/role.guard';

@Module({
  providers: [RequestsService, RoleGuard],
  controllers: [RequestsController],
})
export class ReservationModule {}
