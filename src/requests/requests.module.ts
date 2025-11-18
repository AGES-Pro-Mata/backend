import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { DatabaseService } from 'src/database/database.service';
import { MailService } from 'src/mail/mail.service';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [RequestsService, DatabaseService, MailService, ConfigService],
  controllers: [RequestsController],
})
export class RequestsModule {}
