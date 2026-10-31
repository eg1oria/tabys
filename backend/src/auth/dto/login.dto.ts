import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { PASSWORD_MAX_LENGTH } from '../password-policy.js';

export class LoginDto {
  @ApiProperty({ example: 'admin@tabys.kz' })
  @IsEmail({}, { message: 'Укажите корректный email' })
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'очень-длинный-пароль' })
  // Длину не проверяем: правила пароля — при его смене (password-policy),
  // а здесь «короткий» — такой же неверный пароль, 401, а не 400.
  @IsString()
  @IsNotEmpty({ message: 'Введите пароль' })
  @MaxLength(PASSWORD_MAX_LENGTH)
  password!: string;
}
