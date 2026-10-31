import { SiteChrome } from "@/components/layout/site-chrome";

/**
 * Чром публичного сайта. Вынесен из корневого layout, потому что рядом
 * появился /admin: у админки своя оболочка, и шапка с подвалом сайта
 * ей не нужны. Группа (site) не влияет на URL — адреса страниц не изменились.
 */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <SiteChrome>
      <main className="flex-1">{children}</main>
    </SiteChrome>
  );
}
