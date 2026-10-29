import { buildOrderBy } from './order-by.js';

const allowed = ['title', 'sortOrder'] as const;
const fallback = { sortOrder: 'asc' as const };

describe('buildOrderBy', () => {
  it('использует разрешённое поле', () => {
    expect(buildOrderBy('title', 'desc', allowed, fallback)).toEqual({ title: 'desc' });
  });

  it('игнорирует поле вне списка — иначе в orderBy уедет произвольный ключ', () => {
    expect(buildOrderBy('passwordHash', 'asc', allowed, fallback)).toEqual(fallback);
    expect(buildOrderBy('category.products', 'asc', allowed, fallback)).toEqual(fallback);
  });

  it('без sortBy отдаёт значение по умолчанию', () => {
    expect(buildOrderBy(undefined, 'desc', allowed, fallback)).toEqual(fallback);
  });
});
