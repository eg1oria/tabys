"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./logo";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ChevronDown, Close, Menu, Phone, Search } from "@/components/ui/icons";
import { nav } from "@/lib/content/nav";
import { company, primaryPhone } from "@/lib/content/company";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  const base = href.split("?")[0];
  if (base === "/") return pathname === "/";
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Закрываем всё при переходе на другую страницу. Сбрасываем прямо во время
  // рендера, а не в эффекте: так React не делает лишний проход и не ругается
  // правило react-hooks/set-state-in-effect.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpenMenu(false);
    setOpenSearch(false);
    setOpenDropdown(null);
  }

  useEffect(() => {
    if (openSearch) searchInput.current?.focus();
  }, [openSearch]);

  // Esc закрывает, клик вне шапки закрывает выпадающее меню и поиск.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setOpenMenu(false);
      setOpenSearch(false);
      setOpenDropdown(null);
    }
    function onPointerDown(e: PointerEvent) {
      if (headerRef.current?.contains(e.target as Node)) return;
      setOpenSearch(false);
      setOpenDropdown(null);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  // Блокируем прокрутку под открытым мобильным меню.
  useEffect(() => {
    document.body.style.overflow = openMenu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [openMenu]);

  function submitSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get("q");
    const q = typeof value === "string" ? value.trim() : "";
    router.push(q ? `/oborudovanie?q=${encodeURIComponent(q)}` : "/oborudovanie");
    setOpenSearch(false);
  }

  return (
    <header ref={headerRef} className="sticky top-0 z-50 bg-ink text-white">
      <Container className="flex h-[68px] items-center gap-4 xl:h-[76px] xl:gap-6">
        <Logo />

        <nav aria-label="Основная навигация" className="ml-auto hidden items-center gap-1 xl:flex">
          {nav.map((item) =>
            item.children ? (
              <div key={item.href} className="relative">
                <button
                  type="button"
                  aria-expanded={openDropdown === item.href}
                  onClick={() =>
                    setOpenDropdown((cur) => (cur === item.href ? null : item.href))
                  }
                  className={cn(
                    "inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-[13px] transition-colors",
                    isActive(pathname, item.href)
                      ? "text-accent"
                      : "text-white/80 hover:text-white",
                  )}
                >
                  {item.label}
                  <ChevronDown
                    className={cn(
                      "size-3.5 transition-transform",
                      openDropdown === item.href && "rotate-180",
                    )}
                  />
                </button>

                {openDropdown === item.href ? (
                  <div className="absolute left-0 top-full z-50 w-[310px] border border-line bg-white p-2 shadow-xl">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block rounded-card px-3 py-2.5 text-[13px] text-ink transition-colors hover:bg-muted hover:text-accent"
                      >
                        {child.label}
                      </Link>
                    ))}
                    <Link
                      href="/oborudovanie"
                      className="mt-1 block border-t border-line px-3 pb-1 pt-3 text-[13px] font-medium text-accent"
                    >
                      Весь каталог →
                    </Link>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap px-3 py-2 text-[13px] transition-colors",
                  isActive(pathname, item.href)
                    ? "text-accent"
                    : "text-white/80 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1 xl:ml-2 xl:gap-3">
          <button
            type="button"
            aria-label="Поиск по оборудованию"
            aria-expanded={openSearch}
            onClick={() => setOpenSearch((v) => !v)}
            className="grid size-10 place-items-center text-white/80 transition-colors hover:text-white"
          >
            {openSearch ? <Close className="size-5" /> : <Search className="size-5" />}
          </button>

          <a
            href={primaryPhone.href}
            className="hidden items-center gap-2 whitespace-nowrap border-l border-white/15 pl-4 text-[13px] text-white/90 transition-colors hover:text-white 2xl:inline-flex"
          >
            <Phone className="size-4 text-accent" />
            {primaryPhone.display}
          </a>

          <span className="hidden sm:block">
            <Button href="/kontakty" arrow className="whitespace-nowrap">
              Обсудить проект
            </Button>
          </span>

          <button
            type="button"
            aria-label={openMenu ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={openMenu}
            onClick={() => setOpenMenu((v) => !v)}
            className="grid size-10 place-items-center text-white xl:hidden"
          >
            {openMenu ? <Close className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </Container>

      {openSearch ? (
        <div className="border-t border-white/10 bg-ink-soft">
          <Container className="py-4">
            <form onSubmit={submitSearch} className="flex items-center gap-3">
              <Search className="size-5 shrink-0 text-white/40" />
              <input
                ref={searchInput}
                name="q"
                type="search"
                placeholder="Поиск по оборудованию…"
                className="h-11 w-full bg-transparent text-[15px] text-white placeholder:text-white/35 focus:outline-none"
              />
              <Button type="submit" size="md">
                Найти
              </Button>
            </form>
          </Container>
        </div>
      ) : null}

      {openMenu ? (
        <div className="fixed inset-x-0 bottom-0 top-[68px] z-40 overflow-y-auto bg-ink xl:hidden">
          <Container className="flex min-h-full flex-col py-6">
            <nav aria-label="Мобильная навигация" className="flex flex-col">
              {nav.map((item) => (
                <div key={item.href} className="border-b border-white/10">
                  <Link
                    href={item.href}
                    className={cn(
                      "block py-4 font-display text-lg font-bold uppercase tracking-tight",
                      isActive(pathname, item.href) ? "text-accent" : "text-white",
                    )}
                  >
                    {item.label}
                  </Link>
                  {item.children ? (
                    <div className="-mt-1 flex flex-wrap gap-x-4 gap-y-2 pb-4">
                      {item.children.slice(0, 6).map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="text-[13px] text-white/55 transition-colors hover:text-accent"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </nav>

            <div className="mt-8 space-y-3">
              {company.phones.map((phone) => (
                <a
                  key={phone.href}
                  href={phone.href}
                  className="flex items-baseline gap-3 text-white"
                >
                  <span className="text-[15px]">{phone.display}</span>
                  <span className="text-xs text-white/45">{phone.label}</span>
                </a>
              ))}
              <a href={`mailto:${company.email}`} className="block text-[15px] text-white/80">
                {company.email}
              </a>
            </div>

            <Button href="/kontakty" arrow size="lg" className="mt-8 w-full">
              Обсудить проект
            </Button>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
