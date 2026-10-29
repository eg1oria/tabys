import { Module } from '@nestjs/common';
import { FacetsService } from './facets.service.js';
import { PublicFacetsController } from './public-facets.controller.js';
import { AdminFacetsController } from './admin-facets.controller.js';

@Module({
  controllers: [PublicFacetsController, AdminFacetsController],
  providers: [FacetsService],
  exports: [FacetsService],
})
export class FacetsModule {}
