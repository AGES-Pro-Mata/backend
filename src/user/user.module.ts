import { Module } from '@nestjs/common';
import { AnalyticsModule } from 'src/analytics/analytics.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ObfuscateModule } from 'src/obfuscate/obfuscate.module';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [AnalyticsModule, ObfuscateModule, StorageModule],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
