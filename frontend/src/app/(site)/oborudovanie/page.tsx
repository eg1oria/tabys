import { Suspense } from "react";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/ui/page-hero";
import { Container } from "@/components/ui/container";
import { CatalogBrowser } from "@/components/catalog/catalog-browser";
import { CtaBand } from "@/components/home/cta-band";
import { getCategories, getFacetGroups } from "@/lib/api/public";

export const metadata: Metadata = pageMetadata({
  title: "Каталог оборудования",
  description:
    "Каталог оборудования из нержавеющей стали для пищевой промышленности: ёмкости и резервуары, пастеризационное оборудование, сыроварни, охладители молока, насосы и торцевые уплотнения.",
  path: "/oborudovanie",
});

export default function CatalogPage() {
  return (
    <>
      <PageHero
        breadcrumb="Оборудование"
        title="Каталог"
        titleAccent="оборудования"
        description="Проектируем и производим оборудование для пищевой промышленности из нержавеющей стали. Подберём решение под вашу технологическую задачу."
      />
      <Suspense fallback={<CatalogSkeleton />}>
        <Catalog />
      </Suspense>
      <CtaBand />
    </>
  );
}

/**
 * Под Suspense: CatalogBrowser читает ?q= через useSearchParams, а каталог
 * при недоступном на сборке бэкенде дорисовывается по запросу.
 * Старые адреса ?cat=<слаг> уводит на страницу категории proxy.ts.
 */
async function Catalog() {
  const [categories, facetGroups] = await Promise.all([getCategories(), getFacetGroups()]);
  return <CatalogBrowser categories={categories} facetGroups={facetGroups} />;
}

function CatalogSkeleton() {
  return (
    <section className="bg-white py-12 lg:py-16">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="space-y-2 lg:col-span-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-11 rounded-card bg-muted" />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-9 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 rounded-card bg-muted" />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
