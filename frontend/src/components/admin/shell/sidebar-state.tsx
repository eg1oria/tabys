"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Close, Menu2 } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * Состояние выезжающего меню. На широких экранах сайдбар всегда на месте,
 * состояние нужно только мобильной шторке — поэтому тут один булев флаг,
 * а не клиентская копия навигации.
 */
const SidebarContext = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return <SidebarContext value={{ open, setOpen }}>{children}</SidebarContext>;
}

function useSidebar() {
  const value = useContext(SidebarContext);
  if (!value) throw new Error("SidebarProvider не найден");
  return value;
}

/** Кнопка-бургер в шапке. */
export function SidebarToggle() {
  const { open, setOpen } = useSidebar();

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      aria-label={open ? "Закрыть меню" : "Открыть меню"}
      aria-expanded={open}
      aria-controls="admin-sidebar"
      className="grid size-9 place-items-center rounded-card border border-line text-text-2 transition-colors hover:border-ink hover:text-ink lg:hidden"
    >
      {open ? <Close className="size-4" /> : <Menu2 className="size-4" />}
    </button>
  );
}

/** Оболочка сайдбара: на мобильном — шторка, на десктопе — колонка. */
export function SidebarShell({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useSidebar();

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Закрыть меню"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-ink/50 lg:hidden"
        />
      ) : null}

      <aside
        id="admin-sidebar"
        // Клик по любой ссылке внутри закрывает шторку: иначе она осталась
        // бы поверх только что открытой страницы. Делаем это по событию,
        // а не эффектом на pathname — так нет лишнего прохода отрисовки.
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) setOpen(false);
        }}
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[258px] shrink-0 flex-col bg-ink transition-transform duration-200",
          "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {children}
      </aside>
    </>
  );
}
