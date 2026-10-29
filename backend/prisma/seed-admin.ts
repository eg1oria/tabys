import { hash } from '@node-rs/argon2';
import { randomBytes } from 'node:crypto';
import type { PrismaClient } from '../src/prisma/client.js';

// algorithm не указываем: по умолчанию argon2id, а его enum ambient const.
const OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

/**
 * Первый администратор. Пароль берётся из SEED_ADMIN_PASSWORD; если его нет —
 * генерируется и печатается один раз. В коде пароля нет ни в каком виде.
 */
export async function seedAdmin(prisma: PrismaClient): Promise<void> {
  const email = (process.env.SEED_ADMIN_EMAIL ?? 'admin@tabys.kz').toLowerCase();
  const existing = await prisma.adminUser.findUnique({ where: { email } });

  if (existing) {
    console.log(`  админ ${email} уже есть — пароль не трогаем`);
    return;
  }

  const provided = process.env.SEED_ADMIN_PASSWORD?.trim();
  const password = provided || randomBytes(12).toString('base64url');

  await prisma.adminUser.create({
    data: {
      email,
      name: 'Владелец',
      role: 'OWNER',
      passwordHash: await hash(password, OPTIONS),
    },
  });

  if (provided) {
    console.log(`  создан админ ${email} (пароль из SEED_ADMIN_PASSWORD)`);
  } else {
    console.log(`  создан админ ${email}`);
    console.log(`  СГЕНЕРИРОВАННЫЙ ПАРОЛЬ (больше не покажем): ${password}`);
  }
}
