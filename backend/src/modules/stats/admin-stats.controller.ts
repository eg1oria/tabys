import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StatsService } from './stats.service.js';
import { QueryStatsDto } from './dto/query-stats.dto.js';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin/stats')
export class AdminStatsController {
  constructor(private readonly stats: StatsService) {}

  @Get()
  @ApiOperation({ summary: 'Сводка для главной страницы админки' })
  find(@Query() dto: QueryStatsDto) {
    return this.stats.summary(dto);
  }
}
