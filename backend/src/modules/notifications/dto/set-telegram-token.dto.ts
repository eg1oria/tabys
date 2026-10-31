import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';

export class SetTelegramTokenDto {
  @ApiProperty({
    example: '123456789:AAH…',
    description: 'Токен бота из @BotFather',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  // Формат проверяем до похода в Telegram: опечатку видно сразу, а мусор
  // не уходит в URL запроса.
  @Matches(/^\d{5,}:[\w-]{30,}$/, {
    message: 'Это не похоже на токен бота — он выглядит как 123456789:AAH…',
  })
  token!: string;
}
