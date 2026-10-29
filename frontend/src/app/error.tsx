"use client";

import Link from "next/link";

/**
 * Границы ошибок у публичного сайта не было вовсе: любой сбой в рендере
 * показывал стандартный экран Next с трассировкой в dev и пустотой в проде.
 */
export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="section-label">Ошибка</p>
      <h1 className="display-title mt-4 text-[clamp(1.5rem,5vw,2.25rem)]">
        Страница не загрузилась
      </h1>
      <p className="mt-4 text-[14px] leading-relaxed text-text-2">
        Мы уже знаем о сбое. Попробуйте обновить страницу или вернитесь на главную.
      </p>
      {error.digest ? (
        <p className="mt-2 text-[12px] text-text-2">Код для поддержки: {error.digest}</p>
      ) : null}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center rounded-card bg-accent px-5 text-[13px] font-medium text-white transition-colors hover:bg-accent-strong"
        >
          Обновить
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-card border border-line px-5 text-[13px] font-medium transition-colors hover:border-ink"
        >
          На главную
        </Link>
      </div>
    </main>
  );
}
