import { datePrefix, resolveWithin, safeFilename } from './storage.js';

describe('safeFilename', () => {
  it('не переносит оригинальное имя на диск', () => {
    const name = safeFilename('../../etc/passwd.jpg');
    expect(name).not.toContain('..');
    expect(name).not.toContain('/');
    expect(name).not.toContain('passwd');
    expect(name).toMatch(/^[0-9a-f-]{36}\.jpg$/);
  });

  it('отбрасывает подозрительное расширение', () => {
    expect(safeFilename('file.tar.gz')).toMatch(/^[0-9a-f-]{36}\.gz$/);
    expect(safeFilename('noext')).toMatch(/^[0-9a-f-]{36}$/);
    expect(safeFilename('weird.<script>')).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('resolveWithin', () => {
  it('пропускает путь внутри каталога', () => {
    expect(resolveWithin('/base', '2026/10/a.jpg')).toBe('/base/2026/10/a.jpg');
  });

  it('отвергает выход за пределы каталога', () => {
    expect(() => resolveWithin('/base', '../secrets')).toThrow(/вне каталога/);
    expect(() => resolveWithin('/base', 'a/../../b')).toThrow(/вне каталога/);
    // Префикс совпадает, а каталог другой — startsWith без разделителя
    // пропустил бы этот путь.
    expect(() => resolveWithin('/base', '../base-other/x')).toThrow(/вне каталога/);
  });

  it('абсолютный ключ не выводит за каталог, а приклеивается внутрь', () => {
    // path.join трактует второй абсолютный путь как относительный,
    // поэтому /etc/passwd становится /base/etc/passwd, а не побегом.
    expect(resolveWithin('/base', '/etc/passwd')).toBe('/base/etc/passwd');
  });
});

describe('datePrefix', () => {
  it('форматирует год/месяц с ведущим нулём', () => {
    expect(datePrefix(new Date('2026-01-15T00:00:00Z'))).toBe('2026/01');
    expect(datePrefix(new Date('2026-10-29T00:00:00Z'))).toBe('2026/10');
  });
});
