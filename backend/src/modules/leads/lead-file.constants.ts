/**
 * Зеркало frontend/src/lib/actions/request-state.ts.
 *
 * Источник правды — фронтенд (там это видит пользователь при выборе файла),
 * здесь копия: серверную проверку обойти нельзя, а клиентскую можно.
 * Расхождение опасно — фронтенд примет файл, который бэкенд отвергнет,
 * поэтому совпадение списков закреплено тестом lead-file.constants.spec.ts.
 */
export const MAX_FILE_BYTES = 4 * 1024 * 1024;

export const ALLOWED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'dwg', 'dxf',
  'jpg', 'jpeg', 'png', 'zip', 'rar', '7z',
];

/**
 * Ожидаемые magic-типы по расширению. Чертежи (dwg/dxf) и часть архивов
 * надёжного сигнатурного признака не имеют — для них остаётся только
 * расширение, и это осознанная уступка, а не забытая проверка.
 */
export const EXTENSION_MIME: Record<string, string[]> = {
  pdf: ['application/pdf'],
  doc: ['application/msword', 'application/x-cfb'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip'],
  xls: ['application/vnd.ms-excel', 'application/x-cfb'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/zip'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  zip: ['application/zip'],
  rar: ['application/x-rar-compressed', 'application/vnd.rar'],
  '7z': ['application/x-7z-compressed'],
};

/** Расширения без устойчивой сигнатуры — проверяем только по имени. */
export const SNIFF_EXEMPT = new Set(['dwg', 'dxf']);
