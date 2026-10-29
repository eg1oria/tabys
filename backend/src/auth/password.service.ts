import { Injectable } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';

/**
 * Базовые параметры OWASP (19 МиБ, t=2, p=1). algorithm не указываем:
 * у @node-rs/argon2 по умолчанию уже argon2id, а его enum — ambient const,
 * к которому при isolatedModules не обратиться.
 * Сам пакет выбран за готовые бинарники: без node-gyp и Xcode в сборке.
 */
const OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

/**
 * Хеш несуществующего пароля. Логин сверяет пароль даже когда пользователя нет,
 * иначе время ответа выдаёт, какие адреса зарегистрированы.
 */
const DUMMY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHRzb21lc2FsdA$8s0kFqTdz5xQZ1jPbVaWqOzHZ3aLZ5l1tC3hQ0JvPzI';

@Injectable()
export class PasswordService {
  hash(plain: string): Promise<string> {
    return hash(plain, OPTIONS);
  }

  async verify(digest: string, plain: string): Promise<boolean> {
    try {
      return await verify(digest, plain, OPTIONS);
    } catch {
      // Битый или чужого формата хеш — это «не совпало», а не 500.
      return false;
    }
  }

  /** Сжигает примерно столько же времени, сколько реальная проверка. */
  async verifyDummy(plain: string): Promise<void> {
    await this.verify(DUMMY_HASH, plain);
  }
}
