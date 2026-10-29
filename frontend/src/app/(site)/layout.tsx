import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

/**
 * Чром публичного сайта. Вынесен из корневого layout, потому что рядом
 * появился /admin: у админки своя оболочка, и шапка с подвалом сайта
 * ей не нужны. Группа (site) не влияет на URL — адреса страниц не изменились.
 */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
