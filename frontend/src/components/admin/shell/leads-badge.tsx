import { getLeads } from "@/lib/api/leads";

/**
 * Счётчик новых заявок в меню. Отдельный async-компонент внутри
 * <Suspense>: один лишний запрос не должен задерживать саму страницу.
 * Отдельная ручка на бэкенде не нужна — берём meta.total списка.
 */
export async function LeadsBadge() {
  const { meta } = await getLeads({ status: "NEW", perPage: 1 });
  if (meta.total === 0) return null;

  return (
    <span className="ml-auto inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-white">
      {meta.total > 99 ? "99+" : meta.total}
    </span>
  );
}

/** То же число для колокольчика в шапке — точкой, без цифры. */
export async function LeadsDot() {
  const { meta } = await getLeads({ status: "NEW", perPage: 1 });
  if (meta.total === 0) return null;

  return (
    <span
      aria-label={`Новых заявок: ${meta.total}`}
      className="absolute top-1.5 right-1.5 size-2 rounded-full bg-red-500 ring-2 ring-white"
    />
  );
}
