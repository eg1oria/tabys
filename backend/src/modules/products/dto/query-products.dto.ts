import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';
import { PublishStatus } from '../../../prisma/client.js';

/** Превращает ?facets=aisi304,moloko и ?facets=a&facets=b в массив. */
function toArray(value: unknown): string[] | undefined {
  if (typeof value === 'string') {
    const list = value.split(',').map((v) => v.trim()).filter(Boolean);
    return list.length > 0 ? list : undefined;
  }
  if (Array.isArray(value)) {
    const list = value.filter((v): v is string => typeof v === 'string');
    return list.map((v) => v.trim()).filter(Boolean);
  }
  return undefined;
}

export class QueryProductsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Слаг категории' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ enum: PublishStatus })
  @IsEnum(PublishStatus)
  @IsOptional()
  status?: PublishStatus;

  @ApiPropertyOptional({
    description: 'Значения фасетов: ?facets=aisi304,moloko. И-между группами, ИЛИ-внутри.',
  })
  @Transform(({ value }) => toArray(value))
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  facets?: string[];
}
