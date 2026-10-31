import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';
import { LeadStatus } from '../../../prisma/client.js';

export class QueryLeadsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: LeadStatus })
  @IsEnum(LeadStatus)
  @IsOptional()
  status?: LeadStatus;

  @ApiPropertyOptional({
    description: 'false — заявки, о которых Telegram не уведомил',
  })
  // Из исходной строки, а не из value: неявное приведение превращает
  // «false» в true, как любую непустую строку.
  @Transform(({ obj }: { obj: Record<string, unknown> }) =>
    obj.notified === 'true'
      ? true
      : obj.notified === 'false'
        ? false
        : obj.notified,
  )
  @IsBoolean()
  @IsOptional()
  notified?: boolean;
}
