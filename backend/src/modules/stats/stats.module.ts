import { Module } from '@nestjs/common';
import { StatsService } from './stats.service.js';
import { AdminStatsController } from './admin-stats.controller.js';

@Module({
  controllers: [AdminStatsController],
  providers: [StatsService],
})
export class StatsModule {}
