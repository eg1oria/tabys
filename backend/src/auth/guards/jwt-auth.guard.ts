import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { TokenService } from '../token.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthUser } from '../types.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokens: TokenService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Нужен заголовок Authorization: Bearer');
    }

    const payload = await this.tokens
      .verifyAccess(header.slice('Bearer '.length).trim())
      .catch(() => {
        throw new UnauthorizedException('Недействительный или истёкший токен');
      });

    // Сверяемся с базой: отключённый админ не должен ходить по API
    // до истечения своего 15-минутного токена.
    const user = await this.prisma.adminUser.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user?.isActive) {
      throw new UnauthorizedException('Пользователь не найден или отключён');
    }

    request.user = { id: user.id, email: user.email, role: user.role };
    return true;
  }
}
