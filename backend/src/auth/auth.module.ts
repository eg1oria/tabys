import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PasswordService } from './password.service.js';
import { TokenService } from './token.service.js';
import { AppConfigService } from '../config/app-config.service.js';
import { connectRedis } from '../common/redis/connect.js';
import {
  LOGIN_ATTEMPTS,
  MemoryLoginAttempts,
  RedisLoginAttempts,
} from './login-attempts.js';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    {
      provide: LOGIN_ATTEMPTS,
      inject: [AppConfigService],
      // Там же, где лимиты запросов: без REDIS_URL — в памяти процесса.
      useFactory: (config: AppConfigService) =>
        config.redisUrl
          ? new RedisLoginAttempts(connectRedis(config.redisUrl))
          : new MemoryLoginAttempts(),
    },
  ],
  exports: [TokenService, PasswordService],
})
export class AuthModule {}
