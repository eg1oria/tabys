import { Module } from '@nestjs/common';
import { MediaService } from './media.service.js';
import { AdminMediaController } from './admin-media.controller.js';

@Module({
  controllers: [AdminMediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
