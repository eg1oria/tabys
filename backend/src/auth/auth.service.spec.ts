import { BadRequestException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { MAX_FAILURES, MemoryLoginAttempts } from './login-attempts.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { PasswordService } from './password.service.js';
import type { TokenService } from './token.service.js';

const user = {
  id: 'u1',
  email: 'owner@tabys.kz',
  passwordHash: 'hash:correct-horse-battery',
  isActive: true,
  role: 'OWNER',
};

describe('AuthService', () => {
  let prisma: {
    adminUser: {
      findUnique: ReturnType<typeof vi.fn>;
      findUniqueOrThrow: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };
  let passwords: { verify: ReturnType<typeof vi.fn>; verifyDummy: ReturnType<typeof vi.fn>; hash: ReturnType<typeof vi.fn> };
  let svc: AuthService;

  beforeEach(() => {
    prisma = {
      adminUser: {
        findUnique: vi.fn(async ({ where }: { where: { email: string } }) =>
          where.email === user.email ? user : null,
        ),
        findUniqueOrThrow: vi.fn().mockResolvedValue(user),
        update: vi.fn().mockResolvedValue(user),
      },
    };
    passwords = {
      verify: vi.fn(async (digest: string, plain: string) => digest === `hash:${plain}`),
      verifyDummy: vi.fn(),
      hash: vi.fn(async (plain: string) => `hash:${plain}`),
    };
    const tokens = {
      issuePair: vi.fn().mockResolvedValue({ accessToken: 'a', refreshToken: 'r' }),
      revokeAllForUser: vi.fn(),
    };
    svc = new AuthService(
      prisma as unknown as PrismaService,
      passwords as unknown as PasswordService,
      tokens as unknown as TokenService,
      new MemoryLoginAttempts(),
    );
  });

  const status = (promise: Promise<unknown>) =>
    promise.then(
      () => 200,
      (error: { getStatus?: () => number }) => error.getStatus?.(),
    );

  describe('блокировка входа', () => {
    it('после серии неудач не пускает даже с верным паролем', async () => {
      for (let i = 1; i < MAX_FAILURES; i++) {
        await expect(svc.login(user.email, 'wrong', {})).rejects.toBeInstanceOf(
          UnauthorizedException,
        );
      }
      expect(await status(svc.login(user.email, 'wrong', {}))).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );

      passwords.verify.mockClear();
      await expect(svc.login(user.email, 'correct-horse-battery', {})).rejects.toThrow(
        /закрыт на 15 мин/,
      );
      // Закрытый адрес argon2 не тратит.
      expect(passwords.verify).not.toHaveBeenCalled();
    });

    it('несуществующий адрес блокируется так же — блокировка не выдаёт, кто заведён', async () => {
      for (let i = 1; i < MAX_FAILURES; i++) {
        expect(await status(svc.login('nobody@tabys.kz', 'wrong', {}))).toBe(401);
      }
      expect(await status(svc.login('nobody@tabys.kz', 'wrong', {}))).toBe(429);
    });

    it('удачный вход сбрасывает счётчик неудач', async () => {
      for (let i = 1; i < MAX_FAILURES; i++) {
        await svc.login(user.email, 'wrong', {}).catch(() => undefined);
      }
      await svc.login(user.email, 'correct-horse-battery', {});
      expect(await status(svc.login(user.email, 'wrong', {}))).toBe(401);
    });
  });

  describe('смена пароля', () => {
    const actor = { id: user.id, email: user.email, role: 'OWNER' as const };

    it('новый пароль проходит ту же политику', async () => {
      await expect(
        svc.changePassword(actor, 'correct-horse-battery', 'Password2026!'),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        svc.changePassword(actor, 'correct-horse-battery', 'owner-and-something'),
      ).rejects.toThrow(/email/);
      expect(prisma.adminUser.update).not.toHaveBeenCalled();
    });

    it('не принимает тот же пароль', async () => {
      await expect(
        svc.changePassword(actor, 'correct-horse-battery', 'correct-horse-battery'),
      ).rejects.toThrow(/совпадает/);
    });

    it('годный пароль сохраняет', async () => {
      await svc.changePassword(actor, 'correct-horse-battery', 'синий трактор едет в цех');
      expect(prisma.adminUser.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: { passwordHash: 'hash:синий трактор едет в цех' },
      });
    });
  });
});
