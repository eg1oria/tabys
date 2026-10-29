import Link from "next/link";
import { formatDateTime } from "@/lib/admin/format";
import { LEAD_STATUS_LABEL, LEAD_STATUS_TONE } from "@/lib/admin/lead-status";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/admin/page-header";
import type { AdminStats } from "@/lib/api/types";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return (parts.map((part) => part[0]).join("") || "?").toUpperCase();
}

/**
 * Последние заявки в правой колонке. Время показываем абсолютное:
 * относительное («2 часа назад») требует «сейчас», а синхронный Date.now()
 * при cacheComponents запрещён (см. комментарий в lib/admin/format.ts).
 */
export function LatestLeads({ leads }: { leads: AdminStats["latestLeads"] }) {
  if (leads.length === 0) {
    return <EmptyState message="Заявок пока нет" hint="Здесь появятся обращения с сайта." />;
  }

  return (
    <ul className="divide-y divide-line">
      {leads.map((lead) => (
        <li key={lead.id}>
          <Link
            href={`/admin/leads/${lead.id}`}
            prefetch={false}
            className="flex gap-3 px-5 py-4 transition-colors hover:bg-muted"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/10 text-[12px] font-semibold text-accent">
              {initials(lead.name)}
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[13px] font-medium">{lead.name}</span>
                <span className="shrink-0 text-[11.5px] text-text-2">
                  {formatDateTime(lead.createdAt)}
                </span>
              </span>
              <span className="mt-0.5 block truncate text-[12px] text-text-2">{lead.phone}</span>
              {lead.message ? (
                <span className="mt-1.5 line-clamp-2 block text-[12.5px] leading-snug text-text-2">
                  {lead.message}
                </span>
              ) : null}
              <span className="mt-2 block">
                <Badge tone={LEAD_STATUS_TONE[lead.status]}>
                  {LEAD_STATUS_LABEL[lead.status]}
                </Badge>
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
