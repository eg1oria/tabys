import { LOCK_MS, MAX_FAILURES, FAILURE_WINDOW_MS, MemoryLoginAttempts } from './login-attempts.js';

describe('блокировка входа по адресу (в памяти)', () => {
  let now: number;
  let attempts: MemoryLoginAttempts;

  beforeEach(() => {
    now = 1_000_000;
    attempts = new MemoryLoginAttempts(() => now);
  });

  const fail = async (email = 'owner@tabys.kz', times = 1) => {
    let lock = 0;
    for (let i = 0; i < times; i++) lock = await attempts.recordFailure(email);
    return lock;
  };

  it(`закрывает вход на ${MAX_FAILURES}-й неудаче`, async () => {
    expect(await fail(undefined, MAX_FAILURES - 1)).toBe(0);
    expect(await attempts.lockedFor('owner@tabys.kz')).toBe(0);

    expect(await fail()).toBe(LOCK_MS);
    expect(await attempts.lockedFor('owner@tabys.kz')).toBe(LOCK_MS);
  });

  it('регистр и пробелы в адресе — тот же счётчик', async () => {
    await fail('owner@tabys.kz', MAX_FAILURES - 1);
    expect(await fail('  OWNER@tabys.kz ')).toBe(LOCK_MS);
  });

  it('блокировка временная', async () => {
    await fail(undefined, MAX_FAILURES);
    now += LOCK_MS;
    expect(await attempts.lockedFor('owner@tabys.kz')).toBe(0);
    // После блокировки счёт начинается заново.
    expect(await fail()).toBe(0);
  });

  it('удачный вход обнуляет счётчик', async () => {
    await fail(undefined, MAX_FAILURES - 1);
    await attempts.reset('owner@tabys.kz');
    expect(await fail(undefined, MAX_FAILURES - 1)).toBe(0);
  });

  it('старые неудачи за окном не копятся', async () => {
    await fail(undefined, MAX_FAILURES - 1);
    now += FAILURE_WINDOW_MS;
    expect(await fail(undefined, MAX_FAILURES - 1)).toBe(0);
  });

  it('другие адреса не задевает', async () => {
    await fail('owner@tabys.kz', MAX_FAILURES);
    expect(await attempts.lockedFor('manager@tabys.kz')).toBe(0);
  });
});
