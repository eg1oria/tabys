import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional } from 'class-validator';

export class QueryStatsDto {
  @ApiPropertyOptional({ description: 'Начало периода, YYYY-MM-DD включительно' })
  @IsISO8601({ strict: true })
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({ description: 'Конец периода, YYYY-MM-DD включительно' })
  @IsISO8601({ strict: true })
  @IsOptional()
  to?: string;
}
