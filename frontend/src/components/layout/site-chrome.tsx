import { Suspense } from "react";
import { Header } from "./header";
import { Footer } from "./footer";
import { getCategories } from "@/lib/api/public";
import { categoryHref } from "@/lib/catalog-urls";
import { buildNav, type NavLink } from "@/lib/content/nav";

/**
 * Шапка и подвал публичного сайта. Категории для подменю и подвала —
 * из админки (кешируются, см. lib/api/public.ts). Общий для layout группы
 * (site) и корневой 404, которая лежит вне группы.
 *
 * Под Suspense, потому что без бэкенда на сборке список дорисовывается по
 * запросу. Заглушка — та же шапка без подменю и подвал без списка, так что
 * навигация работает с первого байта.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<Header nav={buildNav([])} />}>
        <HeaderWithCatalog />
      </Suspense>
      {children}
      <Suspense fallback={<Footer catalog={[]} />}>
        <FooterWithCatalog />
      </Suspense>
    </>
  );
}

async function catalogLinks(): Promise<NavLink[]> {
  return (await getCategories()).map((category) => ({
    label: category.title,
    href: categoryHref(category.slug),
  }));
}

async function HeaderWithCatalog() {
  return <Header nav={buildNav(await catalogLinks())} />;
}

async function FooterWithCatalog() {
  return <Footer catalog={await catalogLinks()} />;
}
