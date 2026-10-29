import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PasswordService } from './password.service.js';
import { TokenService } from './token.service.js';
import type { AuthUser, TokenPair } from './types.js';

type RequestContext = { ip?: string; userAgent?: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
  ) {}

  async login(
    email: string,
    password: string,
    ctx: RequestContext,
  ): Promise<TokenPair> {
    const user = await this.prisma.adminUser.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Пользователя нет — всё равно считаем хеш, чтобы по времени ответа
    // нельзя было перебрать существующие адреса.
    if (!user) {
      await this.passwords.verifyDummy(password);
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const ok = await this.passwords.verify(user.passwordHash, password);
    if (!ok || !user.isActive) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    await this.prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.tokens.issuePair(user, ctx);
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

  async changePassword(
    user: AuthUser,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const record = await this.prisma.adminUser.findUniqueOrThrow({
      where: { id: user.id },
    });

    const ok = await this.passwords.verify(record.passwordHash, currentPassword);
    if (!ok) throw new UnauthorizedException('Текущий пароль неверен');

    await this.prisma.adminUser.update({
      where: { id: user.id },
      data: { passwordHash: await this.passwords.hash(newPassword) },
    });

    // Смена пароля должна выбить все прочие сессии.
    await this.tokens.revokeAllForUser(user.id);
  }
}
