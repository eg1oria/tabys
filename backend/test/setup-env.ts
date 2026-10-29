import 'reflect-metadata';

/**
 * Тесты не должны зависеть от локального .env (он в .gitignore и в CI его нет).
 * Заполняем только то, чего ещё нет в окружении.
 */
process.env.NODE_ENV ??= 'test';
process.env.PORT ??= '4000';
process.env.DATABASE_URL ??= 'postgresql://egor@localhost:5432/tabys_test?schema=public';
process.env.CORS_ORIGINS ??= 'http://localhost:3000';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-at-least-32-characters-long';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-at-least-32-characters-long';
process.env.UPLOAD_DIR ??= './test/tmp-uploads';
process.env.PUBLIC_URL ??= 'http://localhost:4000';
