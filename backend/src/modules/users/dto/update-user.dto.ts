import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { AdminRole } from '../../../prisma/client.js';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1, { message: 'Укажите имя' })
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: AdminRole })
  @IsEnum(AdminRole, { message: 'Выберите роль' })
  @IsOptional()
  role?: AdminRole;

  @ApiPropertyOptional({ description: 'false — отключить вход' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
