import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { PublishStatus } from '../../../prisma/client.js';

/** Одна характеристика. Массив пар, а не объект: так сохраняется порядок. */
export class ProductSpecDto {
  @ApiProperty({ example: 'Объём' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  key!: string;

  @ApiProperty({ example: '1 000 л' })
  @IsString()
  @MaxLength(300)
  value!: string;
}

/** Пустое поле формы приходит как null — это «очистить», а не «не передано». */
const notNull = () => ValidateIf((_: unknown, value: unknown) => value !== null);

export class CreateProductDto {
  @ApiProperty({ description: 'id категории' })
  @IsString()
  categoryId!: string;

  @ApiProperty({ example: 'Ёмкости пищевые 100–10 000 л' })
  @IsString()
  @MinLength(2)
  @MaxLength(300)
  title!: string;

  @ApiPropertyOptional({
    description: 'Не передан — транслитерируется из title; null при правке — собрать заново',
  })
  @notNull()
  @IsString()
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug: строчные латинские буквы, цифры и дефис',
  })
  @IsOptional()
  slug?: string | null;

  @ApiPropertyOptional({ description: 'Артикул, например TC-R-500', example: 'TC-R-500' })
  @notNull()
  @IsString()
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9][A-Za-z0-9 ._/-]*$/, {
    message: 'sku: латинские буквы, цифры, пробел, точка, дефис, слэш',
  })
  @IsOptional()
  sku?: string | null;

  @ApiPropertyOptional()
  @notNull()
  @IsString()
  @MaxLength(5000)
  @IsOptional()
  description?: string | null;

  @ApiPropertyOptional({
    description: 'Характеристики по порядку. Пустой массив — стереть все.',
    type: [ProductSpecDto],
    example: [
      { key: 'Объём', value: '1 000 л' },
      { key: 'Материал', value: 'AISI 304' },
    ],
  })
  @IsArray()
  @ArrayMaxSize(50)
  // В объекте повтор молча затирал первое значение — здесь он ошибка.
  @ArrayUnique((spec: ProductSpecDto) => spec.key, {
    message: 'specs: названия характеристик не должны повторяться',
  })
  @ValidateNested({ each: true })
  @Type(() => ProductSpecDto)
  @IsOptional()
  specs?: ProductSpecDto[];

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

  @ApiPropertyOptional({ description: 'Главное фото' })
  @notNull()
  @IsString()
  @IsOptional()
  imageId?: string | null;

  @ApiPropertyOptional({ description: 'Галерея: id картинок по порядку, первая — главная' })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(12)
  @IsOptional()
  imageIds?: string[];

  @ApiPropertyOptional({ enum: PublishStatus, description: 'По умолчанию PUBLISHED' })
  @IsEnum(PublishStatus)
  @IsOptional()
  status?: PublishStatus;

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
