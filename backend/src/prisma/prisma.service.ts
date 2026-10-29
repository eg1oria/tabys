import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './client.js';
import { AppConfigService } from '../config/app-config.service.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: AppConfigService) {
    super({
      // В Prisma 7 адаптер обязателен: без него конструктор бросает
      // "A driver adapter is required to connect to your database".
      adapter: new PrismaPg({
        connectionString: config.databaseUrl,
        max: config.isProduction ? 10 : 5,
        // В v7 пул берёт дефолты из pg, а там таймаута подключения нет —
        // без этого лежащая база заставляет запросы висеть, а не падать.
        connectionTimeoutMillis: 10_000,
        idleTimeoutMillis: 30_000,
      }),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Prisma подключена');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /** Используется health-check'ом: отличает «сервис жив» от «база доступна». */
  async isDatabaseReachable(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('База недоступна', error instanceof Error ? error.stack : String(error));
      return false;
    }
  }
}
