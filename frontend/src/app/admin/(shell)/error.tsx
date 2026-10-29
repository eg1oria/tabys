"use client";

import { AlertCircle } from "@/components/ui/icons";

/**
 * Сюда попадают сбои, которые экран не ожидал: упавший бэкенд, 500,
 * неразобранный ответ. Ошибки форм показываются на месте и сюда не доходят.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-red-50 text-red-600">
          <AlertCircle className="size-6" />
        </span>
        <h1 className="display-title mt-5 text-[1.1rem]">Что-то пошло не так</h1>
        <p className="mt-3 text-[13px] leading-relaxed text-text-2">
          {error.message || "Не удалось загрузить данные."}
          {/* Совет про порт уместен только когда бэкенд и правда молчит:
              на 403 или 500 он сбивает с толку. */}
          {error.message.includes("недоступен")
            ? " Проверьте, запущен ли бэкенд на порту 4000."
            : null}
        </p>
        {error.digest ? (
          <p className="mt-2 text-[11.5px] text-text-2">Код для логов: {error.digest}</p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex h-10 items-center rounded-card bg-accent px-5 text-[13px] font-medium text-white transition-colors hover:bg-accent-strong"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  );
}
