"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isGroup, navEntries, type NavLink } from "./nav-items";
import { cn } from "@/lib/utils";

function active(pathname: string, item: NavLink): boolean {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

/**
 * Разделы админки. Клиентский компонент только ради usePathname: счётчик
 * заявок приходит готовым узлом из серверной части оболочки.
 */
export function AdminNav({
  leadsBadge,
  isOwner = false,
}: {
  leadsBadge?: React.ReactNode;
  /** Пока роль не пришла, пункты владельца скрыты — потом дорисуются. */
  isOwner?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Разделы админки" className="flex flex-1 flex-col gap-1 overflow-y-auto">
      {navEntries.map((entry) => {
        if (!isGroup(entry)) {
          if (entry.ownerOnly && !isOwner) return null;
          return (
            <Item key={entry.href} item={entry} pathname={pathname} badge={leadsBadge} />
          );
        }

        // Группа раскрыта, пока мы внутри неё: собственного состояния нет,
        // поэтому после перехода она не «схлопывается» неожиданно.
        const inside = entry.children.some((child) => pathname.startsWith(child.href));
        return (
          <div key={entry.label} className="mt-1">
            <p
              className={cn(
                "flex items-center gap-2.5 rounded-card px-3 py-2 text-[13px] font-medium",
                inside ? "text-white" : "text-white/55",
              )}
            >
              <entry.Icon className="size-4 shrink-0" />
              {entry.label}
            </p>
            <div className="mt-0.5 ml-[26px] flex flex-col gap-0.5 border-l border-white/10 pl-2.5">
              {entry.children.map((child) => (
                <Item key={child.href} item={child} pathname={pathname} compact />
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function Item({
  item,
  pathname,
  badge,
  compact,
}: {
  item: NavLink;
  pathname: string;
  badge?: React.ReactNode;
  compact?: boolean;
}) {
  const isActive = active(pathname, item);

  return (
    <Link
      href={item.href}
      // Префетч выключен осознанно: страницы админки динамические,
      // кешировать их нечем, а каждый префетч — ещё один запрос,
      // способный совпасть с обновлением токена.
      prefetch={false}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-card px-3 text-[13px] font-medium transition-colors",
        compact ? "py-1.5" : "py-2",
        isActive ? "bg-accent/15 text-white" : "text-white/55 hover:bg-white/8 hover:text-white",
      )}
    >
      {item.Icon && !compact ? <item.Icon className="size-4 shrink-0" /> : null}
      {compact ? (
        <span
          aria-hidden
          className={cn("size-1.5 shrink-0 rounded-full", isActive ? "bg-accent" : "bg-white/20")}
        />
      ) : null}
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge ? badge : null}
    </Link>
  );
}
