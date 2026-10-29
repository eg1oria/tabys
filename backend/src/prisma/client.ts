/**
 * Единственное место, которое знает путь к сгенерированному клиенту.
 * Расширение .js обязательно: под nodenext + "type": "module" путь без
 * расширения не резолвится, а документация Prisma показывает именно его.
 */
export * from '../generated/prisma/client.js';
export * from '../generated/prisma/enums.js';
