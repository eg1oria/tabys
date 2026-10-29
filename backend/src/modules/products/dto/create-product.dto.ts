import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ description: 'id категории' })
  @IsString()
  categoryId!: string;

  @ApiProperty({ example: 'Ёмкости пищевые 100–10 000 л' })
  @IsString()
  @MinLength(2)
  @MaxLength(300)
  title!: string;

  @ApiPropertyOptional({ description: 'Не передан — транслитерируется из title' })
  @IsString()
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug: строчные латинские буквы, цифры и дефис',
  })
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(5000)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Характеристики парами',
    example: { 'Объём': '1 000 л', 'Материал': 'AISI 304' },
  })
  @IsObject()
  @IsOptional()
  specs?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Цена «от». Пусто — цена по запросу.' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  priceFrom?: number | null;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  priceOnRequest?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageId?: string | null;

  @ApiPropertyOptional({ description: 'Значения фасетов' })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  @IsOptional()
  facetValueIds?: string[];

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
