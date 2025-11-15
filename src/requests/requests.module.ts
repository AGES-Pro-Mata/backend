import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  providers: [RequestsService],
  controllers: [RequestsController],
  imports: [JwtModule.register({})],
})
export class RequestsModule {}
