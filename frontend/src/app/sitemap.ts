import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/content/company";

const routes = [
  { path: "/", priority: 1 },
  { path: "/oborudovanie", priority: 0.9 },
  { path: "/proizvodstvennye-linii", priority: 0.8 },
  { path: "/uslugi", priority: 0.8 },
  { path: "/proekty", priority: 0.7 },
  { path: "/o-kompanii", priority: 0.7 },
  { path: "/kontakty", priority: 0.9 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // lastModified намеренно не указываем: new Date() в пререндере
  // запрещён при включённом cacheComponents.
  return routes.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "monthly",
    priority,
  }));
}
