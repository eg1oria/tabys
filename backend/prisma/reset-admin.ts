/**
 * Восстановление доступа, когда войти в админку некому: единственный
 * владелец забыл пароль или его учётную запись отключили.
 *
 *   docker compose run --rm migrate npm run admin:reset -- owner@tabys.kz
 *
 * Задаёт новый пароль (печатается один раз), включает вход, делает
 * пользователя владельцем и завершает все его сессии. Если адреса нет —
 * создаёт нового владельца. Обычный сброс пароля сотруднику — в админке,
 * раздел «Администраторы»; этот скрипт — для доступа с сервера.
 */
import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/prisma/client.js';
import { hashPassword } from './seed-admin.js';

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
  console.error('Использование: npm run admin:reset -- <email>');
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL не задан');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

try {
  const password = randomBytes(12).toString('base64url');
  const passwordHash = await hashPassword(password);

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  const user = await prisma.adminUser.upsert({
    where: { email },
    create: { email, name: 'Владелец', role: 'OWNER', passwordHash },
    update: { role: 'OWNER', isActive: true, passwordHash },
  });
  await prisma.refreshToken.updateMany({
    where: { userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  await prisma.auditLog.create({
    data: {
      action: existing ? 'user.password.reset' : 'user.create',
      entity: 'AdminUser',
      entityId: user.id,
      after: { email, role: 'OWNER', isActive: true, via: 'cli' },
    },
  });

  console.log(
    existing ? `Доступ ${email} восстановлен.` : `Создан владелец ${email}.`,
  );
  console.log(`НОВЫЙ ПАРОЛЬ (больше не покажем): ${password}`);
  console.log('Войдите и смените его в «Настройках».');
} finally {
  await prisma.$disconnect();
}
