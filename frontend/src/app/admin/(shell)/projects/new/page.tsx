import type { Metadata } from "next";
import { getFormOptions } from "@/lib/admin/catalog-form-data";
import { PageHeader } from "@/components/admin/page-header";
import { ProjectForm } from "@/components/admin/project-form";
import { ImagePicker } from "@/components/admin/image-picker";

export const instant = false;

export const metadata: Metadata = { title: "Новый проект" };

export default async function NewProjectPage() {
  const { images } = await getFormOptions();

  return (
    <>
      <PageHeader
        title="Новый проект"
        description="Фото сначала загрузите в «Файлы» — здесь его можно будет выбрать."
        breadcrumbs={[{ label: "Проекты", href: "/admin/projects" }, { label: "Новый проект" }]}
      />
      <div className="p-5 lg:p-8">
        <ProjectForm
          project={null}
          imagePicker={<ImagePicker images={images} value={null} current={null} />}
        />
      </div>
    </>
  );
}
