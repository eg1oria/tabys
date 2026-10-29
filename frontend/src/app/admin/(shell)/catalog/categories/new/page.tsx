import type { Metadata } from "next";
import { getFormOptions } from "@/lib/admin/catalog-form-data";
import { PageHeader } from "@/components/admin/page-header";
import { CategoryForm } from "@/components/admin/category-form";
import { ImagePicker } from "@/components/admin/image-picker";
import { FacetPicker } from "@/components/admin/facet-picker";

export const instant = false;

export const metadata: Metadata = { title: "Новая категория" };

export default async function NewCategoryPage() {
  const { groups, images } = await getFormOptions();

  return (
    <>
      <PageHeader
        title="Новая категория"
        description="После создания категория будет черновиком — опубликуйте её, когда всё готово."
      />
      <div className="p-5 lg:p-8">
        <CategoryForm
          category={null}
          imagePicker={<ImagePicker images={images} value={null} current={null} />}
          facetPicker={<FacetPicker groups={groups} selected={[]} />}
        />
      </div>
    </>
  );
}
