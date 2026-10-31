import { execSync } from 'node:child_process';
import { testDatabaseUrl } from './test-database.js';

/**
 * globalSetup, а не setupFiles: миграции нужно применить один раз на прогон,
 * а setupFiles выполняется для каждого файла тестов.
 */
export default function setup(): void {
  process.env.DATABASE_URL = testDatabaseUrl();

  // deploy, а не dev: без промптов и shadow-базы, идемпотентно.
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: process.env,
  });
}
