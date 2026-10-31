# Tabys Consulting

Сайт ТОО «Табыс Consulting» с каталогом оборудования и админкой.

| Каталог | Что внутри |
| --- | --- |
| [`frontend/`](frontend/README.md) | Next.js 16: публичный сайт и админка `/admin` |
| [`backend/`](backend/README.md) | NestJS + PostgreSQL (Prisma): каталог, заявки, медиа, REST API |
| `compose.yaml`, `deploy/` | прод на одном сервере: Docker Compose и Caddy |
| `.github/workflows/ci.yml` | проверки на каждый push и pull request |

Нужен **Node 24+** (`nvm use` — версия в `.nvmrc`): бэкенд использует
top-level await, оба проекта — `AbortSignal.timeout`.

## Локальная разработка

```bash
cd backend && npm install && cp .env.example .env   # заполнить JWT-секреты
createdb tabys && npm run db:migrate && npm run db:seed
npm run start:dev                                    # http://localhost:4000

cd ../frontend && npm install && cp .env.example .env.local
npm run dev                                          # http://localhost:3000
```

Подробности — в README каждого проекта.

## Деплой

Всё живёт на одном сервере в Docker Compose:

```
             :80 / :443
                 │
              caddy ── HTTPS (Let's Encrypt), сжатие, заголовки
             ╱      ╲
   /uploads/*        всё остальное
       │                  │
    backend:4000  ◀── frontend:3000   (Next ходит в API по внутренней сети)
       │
      db:5432        migrate — одноразовый: миграции перед стартом бэкенда
```

Наружу открыты только 80 и 443. API бэкенда (`/api/v1`) снаружи не виден:
к нему ходит только сервер Next. Через Caddy бэкенд отдаёт лишь `/uploads` —
фото каталога (вложения заявок он по этому пути не отдаёт).

### Что нужно

- Linux-сервер с Docker Engine и плагином Compose v2. Памяти лучше от 2 ГБ:
  образы собираются на самом сервере, а сборка Next к памяти требовательна
  (на 1 ГБ добавьте swap).
- DNS: A-запись домена (и `www`) указывает на сервер.
- Открытые порты 80 и 443 (TCP и UDP 443 для HTTP/3).

### Первый запуск

```bash
git clone https://github.com/eg1oria/tabys.git /srv/tabys && cd /srv/tabys
cp .env.example .env
nano .env        # домен, почта, пароль базы, два JWT-секрета
docker compose up -d --build
docker compose run --rm migrate npm run db:seed
```

Сид создаёт фильтры, 12 категорий, 54 товара, переносит фото категорий из
`frontend/public` и заводит администратора `SEED_ADMIN_EMAIL`. Если
`SEED_ADMIN_PASSWORD` пуст, пароль сгенерируется и напечатается **один раз**.
Запускайте сид только на пустой базе: повторный прогон вернёт названия
и описания категорий к исходным и затрёт правки из админки.

Проверка: `docker compose ps` — все сервисы `healthy`, `migrate` — `exited (0)`;
сайт открывается по `https://<домен>`, админка — `https://<домен>/admin`.
Картинки каталога оптимизирует Next: он скачивает их по публичному адресу
`https://<домен>/uploads/...` изнутри контейнера. Убедитесь, что сервер
может открыть собственный домен (`docker compose exec frontend node -e
"fetch('https://<домен>/robots.txt').then(r=>console.log(r.status))"` → 200).

### Обновление

```bash
cd /srv/tabys && git pull
docker compose up -d --build
```

Миграции применяет сервис `migrate` при каждом запуске, до старта бэкенда
(`depends_on: service_completed_successfully`). Если миграция упала,
`docker compose up` завершится ошибкой, а новый бэкенд не запустится —
причина в `docker compose logs migrate`.

Фронтенд собирается без доступа к бэкенду — каталог дорисуется по первому
запросу, а дальше берётся из кеша (см. «Каталог на сайте» в
`frontend/README.md`). Кеш живёт в памяти процесса, поэтому экземпляр
фронтенда должен быть один.

### Переменные `.env`

| Переменная | Обязательна | Зачем |
| --- | --- | --- |
| `DOMAIN` | да | домен, на который Caddy выпустит сертификат |
| `SITE_URL` | да | полный адрес сайта: ссылки, canonical, sitemap, картинки. Встраивается во фронтенд **при сборке** — после смены пересоберите |
| `ACME_EMAIL` | да | почта для писем Let's Encrypt |
| `POSTGRES_PASSWORD` | да | пароль базы внутри compose |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | да | не короче 32 символов, разные (`openssl rand -base64 48`) |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | для сида | первый администратор |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_IDS` | нет | уведомления о заявках |

Остальное (адреса сервисов, `TRUST_PROXY`, `PUBLIC_URL`, `CORS_ORIGINS`)
задано в `compose.yaml` и для этой схемы менять не нужно.

### Данные и резервные копии

Данные — в томах Docker: `db-data` (база), `uploads` (фото и вложения
заявок), `caddy-data` (сертификаты). `docker compose down` их не трогает,
`docker compose down -v` — **удаляет**.

`deploy/backup.sh` делает дамп базы и архив загрузок в `backups/` и хранит
последние 14 копий. Поставьте его в cron и выносите копии с сервера:

```bash
15 3 * * * cd /srv/tabys && ./deploy/backup.sh >> backups/backup.log 2>&1
```

Восстановление:

```bash
docker compose exec -T db pg_restore -U tabys -d tabys --clean --if-exists < backups/db-<дата>.dump
docker compose exec -T backend tar -C /app/uploads -xzf - < backups/uploads-<дата>.tar.gz
docker compose restart frontend   # сбросить кеш каталога
```

### Обслуживание

```bash
docker compose logs -f backend frontend      # логи (у бэкенда — JSON)
docker compose run --rm migrate npx prisma migrate status
docker compose exec db psql -U tabys tabys   # консоль базы
```

Перезапуск после перезагрузки сервера — `restart: unless-stopped`, отдельный
systemd-юнит не нужен; достаточно, чтобы сам Docker стартовал с системой
(`systemctl enable docker`).

## CI

`.github/workflows/ci.yml` на каждый push в `main` и pull request:

- **бэкенд** — клиент Prisma совпадает со схемой, типы, линтер, юнит- и
  e2e-тесты против Postgres, сборка;
- **фронтенд** — типы, линтер и прод-сборка **без бэкенда** (проверяет, что
  сборка от него не зависит);
- **docker** — `compose.yaml` собирается из `.env.example`, образы собираются.

Деплой из CI не настроен: нужен доступ к серверу. Обновление — две команды
из раздела «Обновление».
