import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { PublishStatus } from '../../../prisma/client.js';

const trim = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );

export class CreateProjectDto {
  @ApiProperty({ example: 'Сыроварня под ключ' })
  @trim()
  @IsString()
  @MinLength(2, { message: 'title: название не короче двух символов' })
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'Проектирование, производство, монтаж' })
  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(300)
  subtitle?: string;

  @ApiPropertyOptional({ example: 'Шымкент' })
  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional({ example: '2024' })
  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(20, {
    message: 'year: год — коротко, например 2024 или 2023–2024',
  })
  year?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Что сделали, по пунктам',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20, { message: 'scope: не больше двадцати пунктов' })
  @IsString({ each: true })
  @MaxLength(200, {
    each: true,
    message: 'scope: пункт не длиннее 200 символов',
  })
  scope?: string[];

  @ApiPropertyOptional({ nullable: true, description: 'id файла из медиатеки' })
  @IsOptional()
  @ValidateIf((_: unknown, value: unknown) => value !== null)
  @IsUUID()
  imageId?: string | null;

  @ApiPropertyOptional({ enum: PublishStatus })
  @IsOptional()
  @IsEnum(PublishStatus)
  status?: PublishStatus;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
