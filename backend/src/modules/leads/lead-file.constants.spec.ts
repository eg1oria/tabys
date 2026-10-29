import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ALLOWED_EXTENSIONS, MAX_FILE_BYTES } from './lead-file.constants.js';

/**
 * Читаем фронтенд как ТЕКСТ, а не импортом: это отдельный npm-пакет
 * со своим tsconfig и алиасами, и тянуть его в сборку бэкенда ради
 * одной константы — лишняя связь. Регулярки достаточно, чтобы расхождение
 * списков упало здесь, а не у пользователя при отправке файла.
 */
const source = readFileSync(
  resolve(process.cwd(), '../frontend/src/lib/actions/request-state.ts'),
  'utf8',
);

describe('ограничения на вложение совпадают с фронтендом', () => {
  it('список расширений идентичен', () => {
    const block = /ALLOWED_EXTENSIONS\s*=\s*\[([\s\S]*?)\]/.exec(source);
    expect(block, 'не нашли ALLOWED_EXTENSIONS во фронтенде').not.toBeNull();

    const frontend = [...block![1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    expect(frontend.length).toBeGreaterThan(0);
    expect([...frontend].sort()).toEqual([...ALLOWED_EXTENSIONS].sort());
  });

  it('лимит размера идентичен', () => {
    const match = /MAX_FILE_BYTES\s*=\s*(\d+)\s*\*\s*(\d+)\s*\*\s*(\d+)/.exec(source);
    expect(match, 'не нашли MAX_FILE_BYTES во фронтенде').not.toBeNull();
    const frontend = Number(match![1]) * Number(match![2]) * Number(match![3]);
    expect(frontend).toBe(MAX_FILE_BYTES);
  });
});
