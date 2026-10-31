import { passwordProblem } from './password-policy.js';

describe('политика пароля', () => {
  it('пропускает длинную фразу', () => {
    expect(passwordProblem('синий трактор едет в цех', 'owner@tabys.kz')).toBeNull();
    expect(passwordProblem('e2e-password-long-enough')).toBeNull();
  });

  it.each([
    ['короткий', 'short-pass1', /не короче 12/],
    ['одни цифры', '202620262026', /одних цифр/],
    ['повторы', 'abcabcabcabc', /повторов/],
    ['password с цифрами', 'Password2026!', /очевидный/],
    ['раскладка', 'qwerty123456', /очевидный/],
    ['раскладка по-русски', 'йцукен123456', /очевидный/],
    ['название компании', 'Tabys-2026-!!', /очевидный/],
  ])('отвергает: %s', (_name, password, message) => {
    expect(passwordProblem(password)).toMatch(message);
  });

  it('не даёт вписать в пароль свой email', () => {
    expect(passwordProblem('aigerim.manager-2026', 'Aigerim.Manager@tabys.kz')).toMatch(
      /email/,
    );
  });

  it('отвергает слишком длинный', () => {
    expect(passwordProblem('слово '.repeat(40))).toMatch(/не длиннее/);
  });
});
