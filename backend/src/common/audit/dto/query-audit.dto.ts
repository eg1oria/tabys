import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginationDto } from '../../dto/pagination.dto.js';

/** Сущности, которые пишут в журнал (entity в AuditService.log). */
export const AUDIT_ENTITIES = [
  'Category',
  'Product',
  'FacetValue',
  'MediaAsset',
  'Lead',
  'AdminUser',
  'TelegramBot',
  'TelegramChat',
] as const;

export class QueryAuditDto extends PaginationDto {
  @ApiPropertyOptional({ enum: AUDIT_ENTITIES })
  @IsIn(AUDIT_ENTITIES)
  @IsOptional()
  entity?: (typeof AUDIT_ENTITIES)[number];

  @ApiPropertyOptional({ description: 'История одной записи' })
  @IsString()
  @MaxLength(64)
  @IsOptional()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Действия одного администратора' })
  @IsUUID()
  @IsOptional()
  actorId?: string;
}
