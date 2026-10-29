import type { Metadata } from "next";
import { getMedia, thumbUrl } from "@/lib/api/media";
import { EmptyState, PageHeader, Panel } from "@/components/admin/page-header";
import { Pagination } from "@/components/admin/pagination";
import { MediaUpload } from "@/components/admin/media-upload";
import { MediaCard } from "@/components/admin/media-card";

/**
 * Страница читает данные под авторизацией на каждый запрос: кешировать
 * их нечем, мгновенной навигация быть не может. Проверка instant
 * выключена осознанно (см. комментарий в src/app/admin/layout.tsx).
 */
export const instant = false;

export const metadata: Metadata = { title: "Медиа" };

export default async function MediaPage({ searchParams }: PageProps<"/admin/media">) {
  const params = await searchParams;
  const page = Number(params.page) > 1 ? Number(params.page) : undefined;

  const { data, meta } = await getMedia({ page });

  return (
    <>
      <PageHeader
        title="Медиа"
        description="Картинки каталога. Удалить можно только те, что нигде не используются."
      />

      <div className="space-y-5 p-5 lg:p-8">
        <Panel title="Загрузить">
          <MediaUpload />
        </Panel>

        <Panel title={`Загружено: ${meta.total}`}>
          {data.length === 0 ? (
            <EmptyState
              message="Пока ничего не загружено"
              hint="Картинки отсюда подставляются в категории и товары."
            />
          ) : (
            <>
              <ul className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data.map((asset) => (
                  <MediaCard key={asset.id} asset={asset} thumbUrl={thumbUrl(asset)} />
                ))}
              </ul>
              <Pagination basePath="/admin/media" params={{}} meta={meta} />
            </>
          )}
        </Panel>
      </div>
    </>
  );
}
