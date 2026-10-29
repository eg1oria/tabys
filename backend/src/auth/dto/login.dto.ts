import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@tabys.kz' })
  @IsEmail({}, { message: 'Укажите корректный email' })
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'очень-длинный-пароль' })
  @IsString()
  @MinLength(8, { message: 'Пароль не короче 8 символов' })
  @MaxLength(200)
  password!: string;
}
