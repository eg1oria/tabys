import Link from "next/link";
import { Suspense } from "react";
import { AdminNav } from "./nav";
import { LeadsBadge } from "./leads-badge";
import { SidebarShell } from "./sidebar-state";
import { SidebarLogout } from "./user-menu";
import { apiRead } from "@/lib/api/server";
import type { CurrentUser } from "@/lib/api/types";

/** Меню с учётом роли: ждёт /auth/me, но только внутри своего Suspense. */
async function RoleAwareNav({ leadsBadge }: { leadsBadge: React.ReactNode }) {
  const me = await apiRead<CurrentUser>("/auth/me");
  return <AdminNav leadsBadge={leadsBadge} isOwner={me.role === "OWNER"} />;
}

/**
 * Тёмная колонка с разделами. Серверный компонент: клиентского тут
 * только раскрытие шторки и подсветка активного пункта.
 */
export function Sidebar() {
  const leadsBadge = (
    <Suspense fallback={null}>
      <LeadsBadge />
    </Suspense>
  );

  return (
    <SidebarShell>
      <Link
        href="/admin"
        prefetch={false}
        className="flex items-center gap-3 border-b border-white/10 px-5 py-5"
      >
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-card bg-accent font-display text-[13px] font-extrabold text-white"
        >
          TT
        </span>
        <span className="min-w-0">
          <span className="block font-display text-[14px] leading-tight font-extrabold tracking-[0.02em] text-white">
            TABYS
          </span>
          <span className="block font-display text-[9px] leading-tight font-semibold tracking-[0.3em] text-white/45">
            CONSULTING
          </span>
        </span>
      </Link>

      <div className="flex-1 overflow-y-auto p-3">
        <Suspense fallback={<AdminNav leadsBadge={leadsBadge} />}>
          <RoleAwareNav leadsBadge={leadsBadge} />
        </Suspense>
      </div>

      <SidebarLogout />
    </SidebarShell>
  );
}
