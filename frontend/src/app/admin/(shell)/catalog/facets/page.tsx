import type { Metadata } from "next";
import { getFacets } from "@/lib/api/catalog";
import { apiRead } from "@/lib/api/server";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { FacetValueCreate, FacetValueRow } from "@/components/admin/facet-forms";
import type { CurrentUser } from "@/lib/api/types";

export const instant = false;

export const metadata: Metadata = { title: "Фильтры" };

export default async function FacetsPage() {
  const [groups, me] = await Promise.all([getFacets(), apiRead<CurrentUser>("/auth/me")]);
  // Значения фильтров меняет только владелец — редактору список для справки.
  const isOwner = me.role === "OWNER";

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Каталог" }, { label: "Параметры" }]}
        title="Фильтры каталога"
        description={
          isOwner
            ? "Значения, по которым посетитель отбирает оборудование. Сами группы фильтров задаются в коде бэкенда."
            : "Значения, по которым посетитель отбирает оборудование. Менять их может владелец."
        }
      />

      <div className="space-y-5 p-5 lg:p-8">
        {groups.map((group) => (
          <Panel key={group.id} title={`${group.title} · ${group.key}`}>
            <ul className="divide-y divide-line">
              {group.values.map((value) =>
                isOwner ? (
                  <FacetValueRow key={value.id} value={value} />
                ) : (
                  <li key={value.id} className="flex items-baseline gap-3 px-4 py-2.5 text-[13px]">
                    <code className="w-28 shrink-0 truncate text-[12px] text-text-2">
                      {value.value}
                    </code>
                    <span className="min-w-0 flex-1 truncate">{value.label}</span>
                    <span className="text-[11.5px] text-text-2">
                      {value._count.categories + value._count.products || "не используется"}
                    </span>
                  </li>
                ),
              )}
            </ul>
            {isOwner ? <FacetValueCreate groupKey={group.key} /> : null}
          </Panel>
        ))}
      </div>
    </>
  );
}
