import type { Metadata } from "next";
import { getFacets } from "@/lib/api/catalog";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { FacetValueCreate, FacetValueRow } from "@/components/admin/facet-forms";

export const instant = false;

export const metadata: Metadata = { title: "Фильтры" };

export default async function FacetsPage() {
  const groups = await getFacets();

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Каталог" }, { label: "Параметры" }]}
        title="Фильтры каталога"
        description="Значения, по которым посетитель отбирает оборудование. Сами группы фильтров задаются в коде бэкенда."
      />

      <div className="space-y-5 p-5 lg:p-8">
        {groups.map((group) => (
          <Panel key={group.id} title={`${group.title} · ${group.key}`}>
            <ul className="divide-y divide-line">
              {group.values.map((value) => (
                <FacetValueRow key={value.id} value={value} />
              ))}
            </ul>
            <FacetValueCreate groupKey={group.key} />
          </Panel>
        ))}
      </div>
    </>
  );
}
