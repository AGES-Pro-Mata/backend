import { Module } from '@nestjs/common';
import { HighlightController } from './highlight.controller';
import { HighlightService } from './highlight.service';
import { StorageService } from 'src/storage/storage.service';

@Module({
  controllers: [HighlightController],
  providers: [HighlightService, StorageService],
  exports: [HighlightService],
})
export class HighlightModule {}
