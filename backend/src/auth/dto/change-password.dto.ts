import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../password-policy.js';

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Введите текущий пароль' })
  @MaxLength(PASSWORD_MAX_LENGTH)
  currentPassword!: string;

  /** Здесь только длина; остальная политика — в AuthService, ей нужен email. */
  @ApiProperty({ minLength: PASSWORD_MIN_LENGTH, maxLength: PASSWORD_MAX_LENGTH })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: `Новый пароль не короче ${PASSWORD_MIN_LENGTH} символов`,
  })
  @MaxLength(PASSWORD_MAX_LENGTH)
  newPassword!: string;
}
