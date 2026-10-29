import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service.js';
import { PublicLeadsController } from './public-leads.controller.js';
import { AdminLeadsController } from './admin-leads.controller.js';

@Module({
  controllers: [PublicLeadsController, AdminLeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
