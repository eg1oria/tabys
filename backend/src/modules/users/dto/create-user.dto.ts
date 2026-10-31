import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { AdminRole } from '../../../prisma/client.js';

export class CreateUserDto {
  @ApiProperty({ example: 'manager@tabys.kz' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Укажите корректный email' })
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'Айгерим' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1, { message: 'Укажите имя' })
  @MaxLength(100)
  name!: string;

  @ApiProperty({ enum: AdminRole })
  @IsEnum(AdminRole, { message: 'Выберите роль' })
  role!: AdminRole;
}
