import { isAbsolute } from 'node:path';
import { plainToInstance, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

/**
 * Схема переменных окружения. Проверяется один раз при старте: упасть здесь
 * намного дешевле, чем отдать 500 на первом же запросе к базе.
 */
export class EnvConfig {
  @IsEnum(NodeEnv)
  @IsOptional()
  NODE_ENV: NodeEnv = NodeEnv.Development;

  // @Type явно, а не через enableImplicitConversion: из окружения порт
  // всегда приходит строкой, и полагаться на выведенные метаданные хрупко.
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT = 4000;

  @IsString()
  @MinLength(1)
  DATABASE_URL!: string;

  /** Список origin через запятую — фронтенд в dev и прод-домен. */
  @IsString()
  @IsOptional()
  CORS_ORIGINS = 'http://localhost:3000';

  @IsString()
  @MinLength(32, {
    message: 'JWT_ACCESS_SECRET должен быть не короче 32 символов',
  })
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @MinLength(32, {
    message: 'JWT_REFRESH_SECRET должен быть не короче 32 символов',
  })
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_ACCESS_TTL = '15m';

  @IsString()
  @IsOptional()
  JWT_REFRESH_TTL = '30d';

  /**
   * Кому доверять заголовок X-Forwarded-For: пусто (никому, как у Express
   * по умолчанию), число хопов, `loopback` или список IP.
   *
   * Фронтенд отправляет заявки со своего сервера, поэтому без доверенного
   * прокси каждая заявка приходит с адреса Next, и лимит «20 в час на IP»
   * срабатывает сразу на всех посетителей. Доверять XFF безусловно нельзя:
   * тогда лимит обходится подделкой заголовка — отсюда явная настройка.
   */
  @IsString()
  @IsOptional()
  TRUST_PROXY = '';

  /**
   * Куда складываем вложения заявок и картинки каталога. Это единственная
   * копия файлов (чертежи и ТЗ заказчиков), поэтому в проде — абсолютный
   * путь на постоянном томе: см. productionProblems ниже.
   */
  @IsString()
  @IsOptional()
  UPLOAD_DIR = './uploads';

  /** Публичная база для ссылок на загруженные файлы. */
  @IsString()
  @IsOptional()
  PUBLIC_URL = 'http://localhost:4000';

  /**
   * Redis для счётчиков лимитов запросов (вход, заявки). Пусто — счётчики
   * в памяти процесса: локально это нормально, в проде запрещено, см.
   * productionProblems ниже.
   */
  @IsString()
  @IsOptional()
  REDIS_URL?: string;

  /**
   * Сколько дней хранить журнал действий админки (AuditLog). 0 — вечно.
   * Год покрывает разбор любого спорного случая и не даёт таблице расти
   * без предела.
   */
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  AUDIT_RETENTION_DAYS = 365;

  // Telegram в окружении не настраивается: бота и чаты подключают в
  // админке (раздел «Уведомления»), они живут в базе.
}

/**
 * Проверки, которые имеют смысл только в проде: локально относительный
 * ./uploads и localhost — нормальны, а на сервере это тихая потеря данных.
 */
function productionProblems(config: EnvConfig): string[] {
  if (config.NODE_ENV !== NodeEnv.Production) return [];
  const problems: string[] = [];

  // Относительный путь в контейнере — это слой самого контейнера: файлы
  // живут до его пересоздания (обновление, docker compose up --build).
  if (!isAbsolute(config.UPLOAD_DIR)) {
    problems.push(
      `UPLOAD_DIR должен быть абсолютным путём на постоянном томе, а не «${config.UPLOAD_DIR}»`,
    );
  }

  // Из PUBLIC_URL собираются адреса картинок каталога: с localhost
  // браузер посетителя их не откроет.
  if (/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/.test(config.PUBLIC_URL)) {
    problems.push(`PUBLIC_URL должен быть публичным адресом сайта, а не «${config.PUBLIC_URL}»`);
  }

  // Вход в админку и заявки приходят к бэкенду от сервера Next. Без
  // доверенного прокси у всех один IP, и лимиты по IP становятся общими:
  // десять чужих неудачных входов — и админка заперта для всех.
  if (!config.TRUST_PROXY.trim()) {
    problems.push(
      'TRUST_PROXY обязателен: без него бэкенд видит один IP сервера Next, и лимиты по IP общие на всех',
    );
  }

  // В памяти процесса каждый инстанс считает свой лимит, а рестарт
  // обнуляет счётчики — защита входа и формы заявок становится условной.
  if (!config.REDIS_URL) {
    problems.push('REDIS_URL обязателен: без Redis лимиты запросов живут в памяти процесса');
  }

  return problems;
}

export function validateEnv(raw: Record<string, unknown>): EnvConfig {
  const config = plainToInstance(EnvConfig, raw, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });

  const errors = validateSync(config, { skipMissingProperties: false });
  const messages = [
    ...errors.map((e) => Object.values(e.constraints ?? {}).join(', ')),
    ...(errors.length === 0 ? productionProblems(config) : []),
  ];

  if (messages.length > 0) {
    throw new Error(`Некорректное окружение:\n  - ${messages.join('\n  - ')}`);
  }

  return config;
}
