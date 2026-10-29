import type { NextConfig } from "next";

// Картинки каталога раздаёт бэкенд (/uploads). Хост берём из той же
// переменной, что и API, чтобы адрес не пришлось держать в двух местах.
const apiOrigin = new URL(process.env.API_ORIGIN ?? "http://localhost:4000");

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
    serverActions: {
      // Вложение к заявке — 4 МБ (MAX_FILE_BYTES), но в тело Server Action
      // попадают ещё поля формы и multipart-обвязка. С лимитом ровно 4mb
      // файл в 4 МБ отвергался бы раньше нашей проверки, и посетитель
      // увидел бы ошибку фреймворка вместо понятного текста.
      // На Vercel потолок ~4.5 МБ: там нужен либо свой хостинг,
      // либо загрузка напрямую в бэкенд.
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
