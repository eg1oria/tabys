// Prisma 7 читает конфиг отсюда, а не из блока datasource в schema.prisma.
// CLI сам .env не загружает (dotenv больше не его зависимость) — отсюда импорт.
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
