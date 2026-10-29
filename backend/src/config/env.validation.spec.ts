import { validateEnv } from './env.validation.js';

const base = {
  DATABASE_URL: 'postgresql://egor@localhost:5432/tabys',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
};

describe('validateEnv', () => {
  it('подставляет значения по умолчанию', () => {
    const env = validateEnv({ ...base });
    expect(env.PORT).toBe(4000);
    expect(env.CORS_ORIGINS).toBe('http://localhost:3000');
    expect(env.UPLOAD_DIR).toBe('./uploads');
  });

  it('приводит PORT из строки к числу', () => {
    const env = validateEnv({ ...base, PORT: '4100' });
    expect(env.PORT).toBe(4100);
  });

  it('падает без DATABASE_URL', () => {
    const { DATABASE_URL: _unused, ...rest } = base;
    expect(() => validateEnv(rest)).toThrow(/DATABASE_URL/);
  });

  it('падает на коротком JWT-секрете — иначе токены подделываются перебором', () => {
    expect(() => validateEnv({ ...base, JWT_ACCESS_SECRET: 'short' })).toThrow(
      /JWT_ACCESS_SECRET/,
    );
  });

  it('отвергает нечисловой порт', () => {
    expect(() => validateEnv({ ...base, PORT: 'abc' })).toThrow(/PORT/);
  });
});
