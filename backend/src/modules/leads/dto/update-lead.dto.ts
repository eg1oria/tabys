import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { LeadStatus } from '../../../prisma/client.js';

export class UpdateLeadDto {
  @ApiPropertyOptional({ enum: LeadStatus })
  @IsEnum(LeadStatus)
  @IsOptional()
  status?: LeadStatus;

  @ApiPropertyOptional({ description: 'Внутренняя заметка менеджера' })
  @IsString()
  @MaxLength(5000)
  @IsOptional()
  internalNote?: string;

  @ApiPropertyOptional({ description: 'id администратора-ответственного' })
  @IsString()
  @IsOptional()
  assignedToId?: string | null;
}
