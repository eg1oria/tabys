import type { NextConfig } from "next";

// Картинки каталога раздаёт бэкенд (/uploads). Хост берём из той же
// переменной, что и API, чтобы адрес не пришлось держать в двух местах.
const apiOrigin = new URL(process.env.API_ORIGIN ?? "http://localhost:4000");

const nextConfig: NextConfig = {
  // Самодостаточная сборка для Docker: server.js и только нужные модули
  // (frontend/Dockerfile). На next dev не влияет.
  output: "standalone",
  experimental: {
    agentFeedback: true,
    serverActions: {
      // Вложение к заявке — 4 МБ (MAX_FILE_BYTES), но в тело Server Action
      // попадают ещё поля формы и multipart-обвязка. С лимитом ровно 4mb
      // файл в 4 МБ отвергался бы раньше нашей проверки, и посетитель
      // увидел бы ошибку фреймворка вместо понятного текста.
      // Перед Next стоит Caddy (deploy/Caddyfile) без своего лимита тела,
      // так что 5 МБ доходят до Next целиком.
      bodySizeLimit: "5mb",
    },
    // При наличии proxy.ts Next буферизует тело запроса, и превышение
    // лимита не возвращает ошибку, а молча обрезает тело. Загрузка
    // картинки в админке — до 10 МБ, поэтому берём с запасом.
    proxyClientMaxBodySize: "12mb",
  },
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  images: {
    // С 16-й версии оптимизатор не ходит на локальные адреса (защита от SSRF),
    // а в dev бэкенд как раз на localhost — без этого фото каталога на сайте
    // отдавали 400. В проде бэкенд на публичном домене, флаг там выключен.
    // Доступ всё равно ограничен remotePatterns ниже: только /uploads бэкенда.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    remotePatterns: [
      {
        protocol: apiOrigin.protocol.replace(":", "") as "http" | "https",
        hostname: apiOrigin.hostname,
        port: apiOrigin.port,
        pathname: "/uploads/**",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
