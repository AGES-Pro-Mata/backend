import { Module } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { ReservationController } from './reservation.controller';
import { StorageModule } from 'src/storage/storage.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [StorageModule, MailModule],
  providers: [ReservationService],
  controllers: [ReservationController],
})
export class ReservationModule {}
