import { Module } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { ReservationController } from './reservation.controller';
import { MailService } from 'src/mail/mail.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [ReservationService, MailService],
  controllers: [ReservationController],
})
export class ReservationModule {}
