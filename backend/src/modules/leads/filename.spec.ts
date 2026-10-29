import { decodeMultipartFilename } from './filename.js';

describe('decodeMultipartFilename', () => {
  it('восстанавливает кириллицу, которую multer отдал как latin1', () => {
    const original = 'Техзадание на сыроварню.pdf';
    const asMulterSeesIt = Buffer.from(original, 'utf8').toString('latin1');

    expect(asMulterSeesIt).not.toBe(original);
    expect(decodeMultipartFilename(asMulterSeesIt)).toBe(original);
  });

  it('не трогает чистый ASCII', () => {
    expect(decodeMultipartFilename('drawing-01.dwg')).toBe('drawing-01.dwg');
  });

  it('оставляет как есть то, что не является искажённым UTF-8', () => {
    // Одиночный байт 0xE9 (é в latin1) — валидный latin1, но не UTF-8.
    const latin1Only = Buffer.from([0x72, 0xe9, 0x73, 0x75, 0x6d, 0x65]).toString('latin1');
    expect(decodeMultipartFilename(latin1Only)).toBe(latin1Only);
  });

  it('идемпотентен на уже корректном имени', () => {
    const name = 'Техзадание.pdf';
    expect(decodeMultipartFilename(decodeMultipartFilename(name))).toBe(
      decodeMultipartFilename(name),
    );
  });
});
