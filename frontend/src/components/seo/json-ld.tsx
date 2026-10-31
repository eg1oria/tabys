import { SITE_URL } from "@/lib/content/company";

/**
 * Структурированные данные schema.org для поисковиков. JSON экранируем:
 * название товара с «</script>» внутри закрыло бы тег раньше времени.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

/** Хлебные крошки: [{ name, path }] от главной до текущей страницы. */
export function breadcrumbList(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
