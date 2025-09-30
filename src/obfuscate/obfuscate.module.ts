import { Module } from '@nestjs/common';
import { ObfuscateService } from './obfuscate.service';

@Module({
  providers: [ObfuscateService],
  exports: [ObfuscateService],
})
export class ObfuscateModule {}
