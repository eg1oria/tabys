import { userInfo } from 'node:os';

/**
 * Адрес базы для e2e. Тесты делают TRUNCATE всех таблиц, поэтому:
 *   1. TEST_DATABASE_URL — если задан, берём его;
 *   2. иначе собираем адрес по соглашениям libpq: PGUSER (или пользователь
 *      ОС — так устроен Postgres из Homebrew), PGPASSWORD, PGHOST, PGPORT
 *      и база tabys_test.
 * DATABASE_URL здесь сознательно не читается: в нём обычно рабочая база,
 * и экспортированная в шелле переменная стёрла бы её первым же прогоном.
 */
export function testDatabaseUrl(): string {
  const explicit = process.env.TEST_DATABASE_URL;
  const url = explicit ? new URL(explicit) : fromLibpqEnv();

  const database = url.pathname.replace(/^\//, '');
  if (!database.endsWith('_test')) {
    throw new Error(
      `e2e очищают базу целиком, а «${database}» не похожа на тестовую — ` +
        'имя базы должно оканчиваться на _test (TEST_DATABASE_URL)',
    );
  }
  if (!url.searchParams.has('schema')) url.searchParams.set('schema', 'public');
  return url.toString();
}

function fromLibpqEnv(): URL {
  const url = new URL('postgresql://localhost/tabys_test');
  url.username = process.env.PGUSER ?? userInfo().username;
  if (process.env.PGPASSWORD) url.password = process.env.PGPASSWORD;
  url.hostname = process.env.PGHOST ?? 'localhost';
  url.port = process.env.PGPORT ?? '5432';
  return url;
}
