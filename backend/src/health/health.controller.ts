import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service.js';
import { Public } from '../auth/decorators/public.decorator.js';

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Проверка живости сервиса и доступности базы' })
  async check(@Res() res: Response): Promise<void> {
    const dbUp = await this.prisma.isDatabaseReachable();

    // 503, а не 200 с полем: балансировщик смотрит на код, а не на тело.
    res.status(dbUp ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json({
      status: dbUp ? 'ok' : 'degraded',
      db: dbUp ? 'up' : 'down',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  }
}
