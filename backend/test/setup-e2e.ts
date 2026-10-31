import './setup-env.js';

/**
 * Параллельные запросы по одному соединению pg пока только предупреждает
 * об этом (и один раз за процесс), а в pg@9 они сломаются. Prisma делает
 * так, когда внутри интерактивной транзакции читает связи, — e2e должен
 * падать на этом сразу, а не в день обновления pg.
 */
process.on('warning', (warning) => {
  if (warning.name === 'DeprecationWarning' && /already executing a query/.test(warning.message)) {
    throw new Error(
      `pg: параллельный запрос на одном соединении — внутри $transaction читайте без связей. ${warning.stack ?? ''}`,
    );
  }
});
