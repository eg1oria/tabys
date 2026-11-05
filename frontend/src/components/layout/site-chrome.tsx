import { Suspense } from "react";
import { Header } from "./header";
import { Footer } from "./footer";
import { getCategories, getContacts } from "@/lib/api/public";
import type { Contacts } from "@/lib/api/types";
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
 *
 * Контакты — вне Suspense: getContacts не бросает и пререндерится всегда,
 * так что телефон и адрес в заглушке уже настоящие.
 */
export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const contacts = await getContacts();
  return (
    <>
      <Suspense fallback={<Header nav={buildNav([])} contacts={contacts} />}>
        <HeaderWithCatalog contacts={contacts} />
      </Suspense>
      {children}
      <Suspense fallback={<Footer catalog={[]} contacts={contacts} />}>
        <FooterWithCatalog contacts={contacts} />
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

async function HeaderWithCatalog({ contacts }: { contacts: Contacts }) {
  return <Header nav={buildNav(await catalogLinks())} contacts={contacts} />;
}

async function FooterWithCatalog({ contacts }: { contacts: Contacts }) {
  return <Footer catalog={await catalogLinks()} contacts={contacts} />;
}
