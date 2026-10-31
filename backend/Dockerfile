# syntax=docker/dockerfile:1.7
#
# Образ API. Собирается из compose.yaml в корне репозитория.
# Цели (target):
#   runtime — рабочий сервер: dist/ и только prod-зависимости;
#   tools   — то же плюс dev-зависимости: prisma CLI для миграций и tsx для сида.
#             В compose это одноразовый сервис migrate.

FROM node:24-bookworm-slim AS base
WORKDIR /app
ENV NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
# Клиент Prisma лежит в src/generated и закоммичен; генерируем заново,
# чтобы образ не зависел от того, не забыли ли его обновить. В базу
# generate не ходит, но prisma.config.ts требует DATABASE_URL — даём пустышку.
RUN DATABASE_URL=postgresql://build@localhost/build npx prisma generate && npm run build

FROM build AS tools
# Prisma CLI определяет версию OpenSSL и без неё ругается при каждом запуске.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
# Тот же пользователь, что у runtime: сид пишет фото в общий том uploads,
# и файлы от root бэкенд потом не смог бы ни перезаписать, ни удалить.
# Prisma CLI при старте докладывает движки в свои пакеты — отдаём их node.
RUN mkdir -p /app/uploads \
  && chown node:node /app/uploads \
  && chown -R node:node /app/node_modules/@prisma /app/node_modules/prisma
USER node
ENV NODE_ENV=production
CMD ["npx", "prisma", "migrate", "deploy"]

FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM base AS runtime
ENV NODE_ENV=production \
    PORT=4000 \
    UPLOAD_DIR=/app/uploads
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
# Загрузки — в томе compose; каталог создаём заранее, чтобы том
# унаследовал владельца node, а не root.
RUN mkdir -p /app/uploads && chown node:node /app/uploads
USER node
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:4000/api/v1/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"]
CMD ["node", "dist/main.js"]
