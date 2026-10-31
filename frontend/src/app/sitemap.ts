import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/content/company";
import { getAllProducts, getCategories } from "@/lib/api/public";
import { categoryHref, productHref } from "@/lib/catalog-urls";

const routes = [
  { path: "/", priority: 1 },
  { path: "/oborudovanie", priority: 0.9 },
  { path: "/proizvodstvennye-linii", priority: 0.8 },
  { path: "/uslugi", priority: 0.8 },
  { path: "/proekty", priority: 0.7 },
  { path: "/o-kompanii", priority: 0.7 },
  { path: "/kontakty", priority: 0.9 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Категории и товары — опубликованные в админке: снятые с публикации
  // уходят и отсюда, как только сбросится кеш каталога.
  const [categories, products] = await Promise.all([getCategories(), getAllProducts()]);

  // lastModified намеренно не указываем: new Date() в пререндере
  // запрещён при включённом cacheComponents.
  return [
    ...routes.map(({ path, priority }) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: "monthly" as const,
      priority,
    })),
    ...categories.map((category) => ({
      url: `${SITE_URL}${categoryHref(category.slug)}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: `${SITE_URL}${productHref(product.category.slug, product.slug)}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
