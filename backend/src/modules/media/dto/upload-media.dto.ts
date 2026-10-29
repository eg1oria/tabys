import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadMediaDto {
  @ApiPropertyOptional({ description: 'Альтернативный текст для next/image' })
  @IsString()
  @MaxLength(300)
  @IsOptional()
  alt?: string;
}
