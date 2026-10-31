import { Module } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD } from '@nestjs/core';
import { AppConfigModule } from './config/config.module.js';
import { AppConfigService } from './config/app-config.service.js';
import { RedisThrottlerStorage } from './common/throttler/redis-throttler.storage.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';
import { RolesGuard } from './auth/guards/roles.guard.js';
import { HealthModule } from './health/health.module.js';
import { AuditModule } from './common/audit/audit.module.js';
import { FacetsModule } from './modules/facets/facets.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { ProductsModule } from './modules/products/products.module.js';
import { MediaModule } from './modules/media/media.module.js';
import { LeadsModule } from './modules/leads/leads.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { StatsModule } from './modules/stats/stats.module.js';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        throttlers: [{ name: 'default', ttl: 60_000, limit: 120 }],
        // Без REDIS_URL — встроенное хранилище в памяти: так работают
        // локальная разработка и e2e. В проде REDIS_URL обязателен.
        storage: config.redisUrl ? RedisThrottlerStorage.fromUrl(config.redisUrl) : undefined,
      }),
    }),
    AuthModule,
    AuditModule,
    FacetsModule,
    CategoriesModule,
    ProductsModule,
    MediaModule,
    LeadsModule,
    UsersModule,
    NotificationsModule,
    StatsModule,
    HealthModule,
  ],
  providers: [
    // Порядок важен: сначала лимиты, затем аутентификация, затем роли.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
