import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PasswordService } from './password.service.js';
import { TokenService } from './token.service.js';
import { LOGIN_ATTEMPTS, type LoginAttempts } from './login-attempts.js';
import { passwordProblem } from './password-policy.js';
import type { AuthUser, TokenPair } from './types.js';

type RequestContext = { ip?: string; userAgent?: string };

const INVALID_CREDENTIALS = 'Неверный email или пароль';

function lockedError(ms: number): HttpException {
  const minutes = Math.max(1, Math.ceil(ms / 60_000));
  return new HttpException(
    `Слишком много неудачных попыток. Вход для этого адреса закрыт на ${minutes} мин.`,
    HttpStatus.TOO_MANY_REQUESTS,
  );
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    @Inject(LOGIN_ATTEMPTS) private readonly attempts: LoginAttempts,
  ) {}

  async login(
    email: string,
    password: string,
    ctx: RequestContext,
  ): Promise<TokenPair> {
    const normalized = email.toLowerCase().trim();

    // Закрытый адрес не пускаем и с верным паролем — иначе блокировка
    // ничего бы не стоила. argon2 при этом не считаем: незачем.
    const locked = await this.attempts.lockedFor(normalized);
    if (locked > 0) throw lockedError(locked);

    const user = await this.prisma.adminUser.findUnique({
      where: { email: normalized },
    });

    // Пользователя нет — всё равно считаем хеш, чтобы по времени ответа
    // нельзя было перебрать существующие адреса.
    if (!user) {
      await this.passwords.verifyDummy(password);
      return this.failLogin(normalized, ctx);
    }

    const ok = await this.passwords.verify(user.passwordHash, password);
    if (!ok || !user.isActive) return this.failLogin(normalized, ctx);

    await this.attempts.reset(normalized);

    await this.prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.tokens.issuePair(user, ctx);
  }

  /** Неудачный вход: в счётчик адреса, и 401 — или 429, если это была последняя попытка. */
  private async failLogin(email: string, ctx: RequestContext): Promise<never> {
    const lock = await this.attempts.recordFailure(email);
    if (lock > 0) {
      this.logger.warn(
        `Вход для ${email} закрыт на ${lock / 60_000} мин после серии неудач (последняя с ${ctx.ip ?? '?'})`,
      );
      throw lockedError(lock);
    }
    throw new UnauthorizedException(INVALID_CREDENTIALS);
  }

  refresh(refreshToken: string, ctx: RequestContext): Promise<TokenPair> {
    return this.tokens.rotate(refreshToken, ctx);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.tokens.revokeByToken(refreshToken);
  }

  async me(userId: string) {
    return this.prisma.adminUser.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
  }

  /**
   * Меняет пароль и возвращает новую пару токенов.
   *
   * Отзываем вообще все refresh-токены, включая токен текущей вкладки —
   * иначе украденная сессия переживёт смену пароля. Чтобы при этом не
   * выбросить самого администратора, сразу выдаём ему новую пару: вызывающая
   * сторона записывает её в cookie.
   */
  async changePassword(
    user: AuthUser,
    currentPassword: string,
    newPassword: string,
    ctx: { ip?: string; userAgent?: string } = {},
  ): Promise<TokenPair> {
    const record = await this.prisma.adminUser.findUniqueOrThrow({
      where: { id: user.id },
    });

    const ok = await this.passwords.verify(
      record.passwordHash,
      currentPassword,
    );
    if (!ok) throw new UnauthorizedException('Текущий пароль неверен');

    const problem = passwordProblem(newPassword, record.email);
    if (problem) throw new BadRequestException(problem);
    if (newPassword === currentPassword) {
      throw new BadRequestException('Новый пароль совпадает с текущим');
    }

    await this.prisma.adminUser.update({
      where: { id: user.id },
      data: { passwordHash: await this.passwords.hash(newPassword) },
    });

    await this.tokens.revokeAllForUser(user.id);
    return this.tokens.issuePair(record, ctx);
  }
}
