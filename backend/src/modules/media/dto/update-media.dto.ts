import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

/**
 * Правка alt уже загруженного файла. Без неё опечатку в подписи можно было
 * исправить только удалением — а используемый файл удалить нельзя.
 */
export class UpdateMediaDto {
  @ApiProperty({ example: 'Ёмкость из нержавеющей стали' })
  @IsString()
  @MaxLength(300)
  alt!: string;
}
