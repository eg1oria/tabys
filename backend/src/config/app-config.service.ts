import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodeEnv, type EnvConfig } from './env.validation.js';

/**
 * Типизированная обёртка над ConfigService: ниже по коду никто не трогает
 * process.env и не угадывает имена ключей строками.
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<EnvConfig, true>) {}

  private get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    return this.config.get(key, { infer: true });
  }

  get nodeEnv(): NodeEnv {
    return this.get('NODE_ENV');
  }

  get isProduction(): boolean {
    return this.nodeEnv === NodeEnv.Production;
  }

  get port(): number {
    return this.get('PORT');
  }

  get databaseUrl(): string {
    return this.get('DATABASE_URL');
  }

  get corsOrigins(): string[] {
    return this.get('CORS_ORIGINS')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
  }

  get jwtAccessSecret(): string {
    return this.get('JWT_ACCESS_SECRET');
  }

  get jwtRefreshSecret(): string {
    return this.get('JWT_REFRESH_SECRET');
  }

  get jwtAccessTtl(): string {
    return this.get('JWT_ACCESS_TTL');
  }

  get jwtRefreshTtl(): string {
    return this.get('JWT_REFRESH_TTL');
  }

  get uploadDir(): string {
    return this.get('UPLOAD_DIR');
  }

  get publicUrl(): string {
    return this.get('PUBLIC_URL').replace(/\/+$/, '');
  }

  get telegramBotToken(): string | undefined {
    return this.get('TELEGRAM_BOT_TOKEN');
  }

  get telegramChatIds(): string[] {
    return (this.get('TELEGRAM_CHAT_IDS') ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  }
}
