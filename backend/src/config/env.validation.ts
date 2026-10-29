import { plainToInstance, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

/**
 * Схема переменных окружения. Проверяется один раз при старте: упасть здесь
 * намного дешевле, чем отдать 500 на первом же запросе к базе.
 */
export class EnvConfig {
  @IsEnum(NodeEnv)
  @IsOptional()
  NODE_ENV: NodeEnv = NodeEnv.Development;

  // @Type явно, а не через enableImplicitConversion: из окружения порт
  // всегда приходит строкой, и полагаться на выведенные метаданные хрупко.
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT = 4000;

  @IsString()
  @MinLength(1)
  DATABASE_URL!: string;

  /** Список origin через запятую — фронтенд в dev и прод-домен. */
  @IsString()
  @IsOptional()
  CORS_ORIGINS = 'http://localhost:3000';

  @IsString()
  @MinLength(32, {
    message: 'JWT_ACCESS_SECRET должен быть не короче 32 символов',
  })
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @MinLength(32, {
    message: 'JWT_REFRESH_SECRET должен быть не короче 32 символов',
  })
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_ACCESS_TTL = '15m';

  @IsString()
  @IsOptional()
  JWT_REFRESH_TTL = '30d';

  /** Куда складываем вложения заявок и картинки каталога. */
  @IsString()
  @IsOptional()
  UPLOAD_DIR = './uploads';

  /** Публичная база для ссылок на загруженные файлы. */
  @IsString()
  @IsOptional()
  PUBLIC_URL = 'http://localhost:4000';

  @IsString()
  @IsOptional()
  TELEGRAM_BOT_TOKEN?: string;

  /** Несколько чатов через запятую — по одному на менеджера. */
  @IsString()
  @IsOptional()
  TELEGRAM_CHAT_IDS?: string;
}

export function validateEnv(raw: Record<string, unknown>): EnvConfig {
  const config = plainToInstance(EnvConfig, raw, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });

  const errors = validateSync(config, { skipMissingProperties: false });

  if (errors.length > 0) {
    const details = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .join('\n  - ');
    throw new Error(`Некорректное окружение:\n  - ${details}`);
  }

  return config;
}
