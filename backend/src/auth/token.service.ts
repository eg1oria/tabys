import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, createHmac, randomBytes, randomUUID } from 'node:crypto';
import { AppConfigService } from '../config/app-config.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AdminUser } from '../prisma/client.js';
import type { JwtPayload, TokenPair } from './types.js';

type IssueContext = { ip?: string; userAgent?: string };

/**
 * Сколько после ротации повторное предъявление того же токена считается
 * гонкой, а не утечкой. Два экземпляра Next (или две вкладки) обновляют
 * сессию параллельно с одной cookie: без окна второй запрос гасил бы всё
 * семейство и выбрасывал редактора из админки.
 */
const REUSE_GRACE_MS = 30_000;

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

  /**
   * Наследник refresh-токена выводится из родителя, а не случаен: тогда
   * повтор в льготном окне получает ровно тот же токен, что и первый
   * запрос, — обе стороны гонки запишут в cookie одно и то же, и сессия не
   * раздвоится. Без секрета наследника не вычислить, а сам секрет на
   * клиент не уходит.
   */
  private successorOf(rawToken: string): string {
    return createHmac('sha256', this.config.jwtRefreshSecret)
      .update(rawToken)
      .digest('base64url');
  }

  private get refreshTtlMs(): number {
    return parseTtlToMs(this.config.jwtRefreshTtl);
  }

  /** Выдаёт новую пару и открывает новое семейство ротации. */
  async issuePair(
    user: Pick<AdminUser, 'id' | 'email' | 'role'>,
    ctx: IssueContext = {},
  ): Promise<TokenPair> {
    const raw = randomBytes(32).toString('base64url');
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(raw),
        familyId: randomUUID(),
        expiresAt: new Date(Date.now() + this.refreshTtlMs),
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      },
    });
    return this.pair(user, raw);
  }

  private async pair(
    user: Pick<AdminUser, 'id' | 'email' | 'role'>,
    refreshToken: string,
  ): Promise<TokenPair> {
    return {
      accessToken: await this.signAccess(user),
      refreshToken,
      expiresIn: this.accessTtlSeconds,
    };
  }

  /**
   * Ротация с обнаружением повторного использования: если предъявили уже
   * отозванный токен, значит он утёк — гасим всё семейство, а не одну строку.
   * Исключение — повтор в первые REUSE_GRACE_MS после ротации, пока
   * наследник жив: это параллельное обновление, и ему отдаётся тот же
   * наследник.
   */
  async rotate(rawToken: string, ctx: IssueContext = {}): Promise<TokenPair> {
    const tokenHash = hashToken(rawToken);
    const successor = this.successorOf(rawToken);
    const now = new Date();

    // Отзыв и наследник — одной транзакцией. Гасим строку условным UPDATE,
    // а не read-then-write: из двух параллельных ротаций выигрывает ровно
    // одна, вторая ждёт блокировку строки и после коммита видит и отзыв,
    // и уже созданного наследника — никогда одно без другого.
    const { rotated, stored } = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null, expiresAt: { gt: now } },
        data: { revokedAt: now },
      });
      const found = await tx.refreshToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });
      if (count === 1 && found?.user.isActive) {
        await tx.refreshToken.create({
          data: {
            userId: found.userId,
            tokenHash: hashToken(successor),
            familyId: found.familyId,
            expiresAt: new Date(now.getTime() + this.refreshTtlMs),
            ip: ctx.ip,
            userAgent: ctx.userAgent,
          },
        });
      }
      return { rotated: count === 1, stored: found };
    });

    if (!stored) {
      throw new UnauthorizedException('Недействительный refresh-токен');
    }

    if (!stored.user.isActive) {
      await this.revokeFamily(stored.familyId);
      throw new UnauthorizedException('Пользователь отключён');
    }

    if (rotated) return this.pair(stored.user, successor);

    if (stored.expiresAt.getTime() <= now.getTime()) {
      throw new UnauthorizedException('Refresh-токен истёк');
    }

    if (await this.isConcurrentRotation(stored.revokedAt, successor, now)) {
      return this.pair(stored.user, successor);
    }

    // Строка отозвана давно, выходом или её наследник уже ушёл дальше —
    // токен предъявили повторно.
    await this.revokeFamily(stored.familyId);
    throw new UnauthorizedException(
      'Повторное использование токена — все сессии завершены',
    );
  }

  /**
   * Повтор считается гонкой, только если родителя отозвали только что и
   * его наследник ещё жив. Выход гасит и наследника, а следующая ротация
   * отзывает его — в обоих случаях это уже не гонка, а повтор.
   */
  private async isConcurrentRotation(
    revokedAt: Date | null,
    successor: string,
    now: Date,
  ): Promise<boolean> {
    if (!revokedAt || now.getTime() - revokedAt.getTime() > REUSE_GRACE_MS) {
      return false;
    }
    const child = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(successor) },
      select: { revokedAt: true, expiresAt: true },
    });
    return child !== null && child.revokedAt === null && child.expiresAt > now;
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
