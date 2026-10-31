import type { NextConfig } from "next";

// Картинки каталога раздаёт бэкенд (/uploads). Хост берём из той же
// переменной, что и API, чтобы адрес не пришлось держать в двух местах.
const apiOrigin = new URL(process.env.API_ORIGIN ?? "http://localhost:4000");

const isDev = process.env.NODE_ENV === "development";

/**
 * CSP без nonce, с 'unsafe-inline' для скриптов. Nonce требует рендерить
 * каждую страницу на запрос (node_modules/next/dist/docs/01-app/02-guides/
 * content-security-policy.md), а сайт держится на статических оболочках
 * cacheComponents и partialPrefetching — в них nonce не попадает, и Next
 * отказался бы их отдавать. Политика всё равно отрезает главное: чужие
 * скрипты, фреймы, плагины, подмену <base> и отправку форм на чужой домен.
 *
 * Сторонних скриптов на сайте нет; шрифты next/font отдаёт сам Next.
 * Картинки — свои и с бэкенда (/uploads), в проде это тот же домен.
 * 'unsafe-eval' и ws: — только для next dev: им пользуются React и HMR.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${apiOrigin.origin}`,
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

/**
 * Заголовки ставит сам Next, а не только Caddy: так они есть при любом
 * способе запуска. Caddy (deploy/Caddyfile) дублирует часть из них
 * с теми же значениями и перекрывает их своими.
 */
const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // Браузер учитывает HSTS только по https, так что в dev он лишний.
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]),
];

const nextConfig: NextConfig = {
  // Самодостаточная сборка для Docker: server.js и только нужные модули
  // (frontend/Dockerfile). На next dev не влияет.
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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
