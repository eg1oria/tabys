import { execSync } from 'node:child_process';

/**
 * globalSetup, а не setupFiles: миграции нужно применить один раз на прогон,
 * а setupFiles выполняется для каждого файла тестов.
 */
export default function setup(): void {
  process.env.DATABASE_URL ??=
    'postgresql://egor@localhost:5432/tabys_test?schema=public';

  // deploy, а не dev: без промптов и shadow-базы, идемпотентно.
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: process.env,
  });
}
