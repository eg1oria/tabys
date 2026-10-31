import { Controller, Get, HttpStatus, Inject, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { getStorageToken, type ThrottlerStorage } from '@nestjs/throttler';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { RedisThrottlerStorage } from '../common/throttler/redis-throttler.storage.js';

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(getStorageToken())
    private readonly throttlerStorage: ThrottlerStorage,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Проверка живости сервиса и доступности базы' })
  async check(@Res() res: Response): Promise<void> {
    const [dbUp, rateLimit] = await Promise.all([
      this.prisma.isDatabaseReachable(),
      this.rateLimitState(),
    ]);

    // 503, а не 200 с полем: балансировщик смотрит на код, а не на тело.
    // Redis на код не влияет: без него сайт работает, только без лимитов,
    // и перезапускать из-за этого бэкенд бессмысленно.
    res.status(dbUp ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json({
      status: dbUp ? 'ok' : 'degraded',
      db: dbUp ? 'up' : 'down',
      rateLimit,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  }

  private async rateLimitState(): Promise<'redis' | 'redis-down' | 'memory'> {
    if (!(this.throttlerStorage instanceof RedisThrottlerStorage))
      return 'memory';
    return (await this.throttlerStorage.isReachable()) ? 'redis' : 'redis-down';
  }
}
