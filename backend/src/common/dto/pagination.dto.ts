import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export enum SortOrder {
  asc = 'asc',
  desc = 'desc',
}

export class PaginationDto {
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  perPage = 20;

  @ApiPropertyOptional({ description: 'Поле сортировки из разрешённого списка' })
  @IsString()
  @MaxLength(64)
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.asc })
  @IsEnum(SortOrder)
  @IsOptional()
  order: SortOrder = SortOrder.asc;

  @ApiPropertyOptional({ description: 'Поисковая строка' })
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  q?: string;

  get skip(): number {
    return (this.page - 1) * this.perPage;
  }
}

export type Paginated<T> = {
  data: T[];
  meta: { page: number; perPage: number; total: number; totalPages: number };
};

export function paginate<T>(
  data: T[],
  total: number,
  dto: PaginationDto,
): Paginated<T> {
  return {
    data,
    meta: {
      page: dto.page,
      perPage: dto.perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / dto.perPage)),
    },
  };
}
