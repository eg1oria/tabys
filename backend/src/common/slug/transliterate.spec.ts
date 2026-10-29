import { slugify, transliterate } from './transliterate.js';

describe('slugify', () => {
  // Слаги, которые уже живут в URL каталога (?cat=...). Автогенерация
  // обязана воспроизводить их, иначе новые записи поедут по другим правилам.
  const existing: [string, string][] = [
    ['Ёмкости и резервуары', 'emkosti-i-rezervuary'],
    ['Пастеризационное оборудование', 'pasterizacionnoe-oborudovanie'],
    ['Сыроварни', 'syrovarni'],
    ['Охладители молока', 'ohladiteli-moloka'],
    ['Творожные ванны', 'tvorozhnye-vanny'],
    ['Вакуумно-выпарные установки', 'vakuumno-vyparnye-ustanovki'],
    ['СИП станции', 'sip-stancii'],
    ['Насосы', 'nasosy'],
    ['Торцевые уплотнения', 'torcevye-uplotneniya'],
    ['Другие решения', 'drugie-resheniya'],
  ];

  it.each(existing)('%s -> %s', (title, expected) => {
    expect(slugify(title)).toBe(expected);
  });

  it('убирает скобки и лишние дефисы', () => {
    expect(slugify('Цилиндро-конические танки (ЦКТ)')).toBe(
      'cilindro-konicheskie-tanki-ckt',
    );
  });

  it('не оставляет дефис на конце', () => {
    expect(slugify('Насосы —')).toBe('nasosy');
    expect(slugify('  Ёмкости!  ')).toBe('emkosti');
  });

  it('транслитерирует ц как c, а х как h — как в существующих слагах', () => {
    expect(transliterate('ц')).toBe('c');
    expect(transliterate('х')).toBe('h');
  });

  it('держит казахские буквы', () => {
    expect(slugify('Қазақстан өнімі')).toBe('qazaqstan-onimi');
  });

  it('не падает на строке без латиницы и кириллицы', () => {
    expect(slugify('!!!')).toBe('');
  });
});
