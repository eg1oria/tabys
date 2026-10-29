import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { AppConfigService } from '../config/app-config.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AdminUser } from '../prisma/client.js';
import type { JwtPayload, TokenPair } from './types.js';

type IssueContext = { ip?: string; userAgent?: string };

/**
 * Refresh-токен — непрозрачные 256 бит случайности, в базе лежит его SHA-256.
 *
 * Хеш именно детерминированный, а не argon2: строку нужно находить ПО хешу,
 * а argon2 со случайной солью такой поиск делает невозможным. Медленный KDF
 * здесь и не нужен — перебирать 256 бит случайности нечем, в отличие от пароля.
 */
function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function parseTtlToMs(ttl: string): number {
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) throw new Error(`Непонятный TTL: ${ttl}`);
  const value = Number(match[1]);
  const unit = match[2] as 's' | 'm' | 'h' | 'd';
  const factor = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
  return value * factor;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: AppConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private get accessTtlSeconds(): number {
    return Math.floor(parseTtlToMs(this.config.jwtAccessTtl) / 1000);
  }

  private async signAccess(
    user: Pick<AdminUser, 'id' | 'email' | 'role'>,
  ): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
    };
    return this.jwt.signAsync(payload, {
      secret: this.config.jwtAccessSecret,
      // Секундами, а не строкой: signAsync типизирует expiresIn как
      // number | StringValue, и обычный string туда не подходит.
      expiresIn: this.accessTtlSeconds,
    });
  }

  async verifyAccess(token: string): Promise<JwtPayload> {
    const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
      secret: this.config.jwtAccessSecret,
    });
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Ожидался access-токен');
    }
    return payload;
  }

  /** Выдаёт новую пару и открывает новое семейство ротации. */
  async issuePair(
    user: Pick<AdminUser, 'id' | 'email' | 'role'>,
    ctx: IssueContext = {},
  ): Promise<TokenPair> {
    return this.issueWithFamily(user, randomUUID(), ctx);
  }

  private async issueWithFamily(
    user: Pick<AdminUser, 'id' | 'email' | 'role'>,
    familyId: string,
    ctx: IssueContext,
  ): Promise<TokenPair> {
    const raw = randomBytes(32).toString('base64url');
    const ttlMs = parseTtlToMs(this.config.jwtRefreshTtl);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(raw),
        familyId,
        expiresAt: new Date(Date.now() + ttlMs),
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      },
    });

    return {
      accessToken: await this.signAccess(user),
      refreshToken: raw,
      expiresIn: this.accessTtlSeconds,
    };
  }

  /**
   * Ротация с обнаружением повторного использования: если предъявили уже
   * отозванный токен, значит он утёк — гасим всё семейство, а не одну строку.
   */
  async rotate(rawToken: string, ctx: IssueContext = {}): Promise<TokenPair> {
    const tokenHash = hashToken(rawToken);

    // Гасим строку условным UPDATE, а не read-then-write: две параллельные
    // ротации одного токена иначе обе проходят, семейство раздваивается и
    // обнаружение утечки перестаёт работать. Выигрывает ровно один запрос.
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
      data: { revokedAt: new Date() },
    });

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored) {
      throw new UnauthorizedException('Недействительный refresh-токен');
    }

    if (count === 0) {
      if (stored.expiresAt.getTime() <= Date.now()) {
        throw new UnauthorizedException('Refresh-токен истёк');
      }
      // Строка уже была отозвана — токен предъявили повторно.
      await this.revokeFamily(stored.familyId);
      throw new UnauthorizedException(
        'Повторное использование токена — все сессии завершены',
      );
    }

    if (!stored.user.isActive) {
      await this.revokeFamily(stored.familyId);
      throw new UnauthorizedException('Пользователь отключён');
    }

    return this.issueWithFamily(stored.user, stored.familyId, ctx);
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Выход: гасим семейство предъявленного токена, остальные устройства живут. */
  async revokeByToken(rawToken: string): Promise<void> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(rawToken) },
      select: { familyId: true },
    });
    if (stored) await this.revokeFamily(stored.familyId);
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
