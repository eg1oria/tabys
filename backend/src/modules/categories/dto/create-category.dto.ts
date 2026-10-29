import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Ёмкости и резервуары' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    description: 'Если не передан — транслитерируется из title',
    example: 'emkosti-i-rezervuary',
  })
  @IsString()
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug: строчные латинские буквы, цифры и дефис',
  })
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ description: 'Короткое имя для боковой панели' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  short?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  description!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  @ArrayMaxSize(20)
  @IsOptional()
  highlights?: string[];

  @ApiPropertyOptional({
    description: 'Витринное число позиций. Пусто — считается по товарам.',
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  positionCount?: number | null;

  @ApiPropertyOptional({ description: 'id загруженного изображения' })
  @IsString()
  @IsOptional()
  imageId?: string | null;

  @ApiPropertyOptional({ description: 'Значения фасетов: id из /admin/facets' })
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  @IsOptional()
  facetValueIds?: string[];

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(200)
  @IsOptional()
  seoTitle?: string;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(400)
  @IsOptional()
  seoDescription?: string;
}
