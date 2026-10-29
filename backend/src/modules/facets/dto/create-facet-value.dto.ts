import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

export class CreateFacetValueDto {
  @ApiProperty({ example: 'material', description: 'Ключ существующей группы' })
  @IsString()
  @MaxLength(64)
  groupKey!: string;

  @ApiProperty({ example: 'aisi321' })
  @IsString()
  @MaxLength(64)
  // Значение уходит в query-строку фильтра, поэтому только безопасные символы.
  @Matches(/^[a-z0-9][a-z0-9+-]*$/, {
    message: 'value: только строчные латинские буквы, цифры, дефис и плюс',
  })
  value!: string;

  @ApiProperty({ example: 'Нержавеющая сталь AISI 321' })
  @IsString()
  @MaxLength(200)
  label!: string;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
