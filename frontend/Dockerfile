# syntax=docker/dockerfile:1.7
#
# Образ сайта и админки (Next.js, output: "standalone").
#
# Часть настроек Next запекается при сборке, поэтому это build-аргументы:
#   NEXT_PUBLIC_SITE_URL — встраивается в клиентский код, метаданные и sitemap;
#   API_ORIGIN           — попадает в images.remotePatterns (next.config.ts).
# Бэкенд на сборке не нужен: каталог без него дорисовывается по первому
# запросу (см. «Сборка от бэкенда не зависит» в src/lib/api/public.ts).

FROM node:24-bookworm-slim AS base
WORKDIR /app
ENV NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false \
    NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
ARG NEXT_PUBLIC_SITE_URL
ARG API_ORIGIN
ARG API_URL=http://backend:4000/api/v1
RUN test -n "$NEXT_PUBLIC_SITE_URL" && test -n "$API_ORIGIN" \
  || (echo "Нужны build-аргументы NEXT_PUBLIC_SITE_URL и API_ORIGIN" >&2; exit 1)
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    API_ORIGIN=$API_ORIGIN \
    API_URL=$API_URL
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/robots.txt').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"]
CMD ["node", "server.js"]
