/**
 * Политика паролей админки — одна на все места, где пароль задаётся:
 * смена в «Настройках» и SEED_ADMIN_PASSWORD у сида. На входе её нет:
 * там пароль просто либо совпал, либо нет, а 400 на «коротком» пароле
 * подсказывал бы правила перебора.
 *
 * Правила — в духе NIST SP 800-63B: длина вместо «заглавная + цифра +
 * спецсимвол» и отказ от очевидного. Принудительной смены по сроку нет.
 */
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 200;

/** Меньше разных символов — это повтор вроде «aaaa…» или «abcabc…». */
const MIN_DISTINCT_CHARS = 6;

/**
 * Слова, которые первыми идут в любой словарь перебора. Сравниваем с
 * буквенной частью пароля: «Password2026!» и «qwerty123456» — это они же.
 */
const OBVIOUS_WORDS = new Set([
  'password',
  'pass',
  'parol',
  'пароль',
  'qwerty',
  'qwertyuiop',
  'asdfgh',
  'asdfghjkl',
  'zxcvbnm',
  'йцукен',
  'йцукенгшщзхъ',
  'фывапролджэ',
  'ячсмить',
  'admin',
  'administrator',
  'админ',
  'root',
  'user',
  'login',
  'welcome',
  'letmein',
  'iloveyou',
  'tabys',
  'табыс',
]);

/** Первая проблема пароля словами для администратора; null — пароль годится. */
export function passwordProblem(password: string, email?: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Пароль не короче ${PASSWORD_MIN_LENGTH} символов`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Пароль не длиннее ${PASSWORD_MAX_LENGTH} символов`;
  }
  if (/^\d+$/.test(password)) {
    return 'Пароль не может состоять из одних цифр';
  }
  if (new Set(password).size < MIN_DISTINCT_CHARS) {
    return 'В пароле слишком много повторов — возьмите фразу из нескольких слов';
  }

  const lower = password.toLowerCase();
  const letters = lower.replace(/[^\p{L}]/gu, '');
  if (OBVIOUS_WORDS.has(letters)) {
    return 'Слишком очевидный пароль — такие подбирают первыми';
  }

  const local = email?.toLowerCase().split('@')[0] ?? '';
  if (local.length >= 3 && lower.includes(local)) {
    return 'Пароль не должен содержать email';
  }

  return null;
}
