"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { IconButton } from "@/components/ui/icon-button";
import { Close } from "@/components/ui/icons";

/**
 * Выдвижная панель редактирования. Содержимое приходит с сервера как
 * children — клиентского тут только закрытие по Escape, по фону и
 * возврат фокуса.
 */
export function DrawerShell({
  title,
  closeHref,
  children,
}: {
  title: string;
  closeHref: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") router.push(closeHref);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [router, closeHref]);

  useEffect(() => {
    // Фокус внутрь панели: иначе он остаётся на строке таблицы под ней
    // и Tab уводит мимо формы.
    panel.current?.querySelector<HTMLElement>("input, select, textarea, button")?.focus();
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label="Закрыть панель"
        onClick={() => router.push(closeHref)}
        className="fixed inset-0 z-40 bg-ink/40"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col border-l border-line bg-white shadow-xl"
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 className="font-display text-[15px] font-bold">{title}</h2>
          <IconButton label="Закрыть" onClick={() => router.push(closeHref)}>
            <Close className="size-4" />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  );
}
