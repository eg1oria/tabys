import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminProject } from "@/lib/api/projects";
import { currentImage, getFormOptions, withCurrentImage } from "@/lib/admin/catalog-form-data";
import { ApiError } from "@/lib/api/errors";
import { PageHeader } from "@/components/admin/page-header";
import { ProjectForm } from "@/components/admin/project-form";
import { ImagePicker } from "@/components/admin/image-picker";
import { Badge } from "@/components/ui/badge";
import type { AdminProject } from "@/lib/api/types";

export const instant = false;

export const metadata: Metadata = { title: "Проект" };

export default async function EditProjectPage({ params }: PageProps<"/admin/projects/[id]">) {
  const { id } = await params;

  let project: AdminProject;
  try {
    project = await getAdminProject(id);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) notFound();
    throw error;
  }

  const { images, assets } = await getFormOptions();

  return (
    <>
      <PageHeader
        title={project.title}
        description={[project.location, project.year].filter(Boolean).join(" · ") || undefined}
        breadcrumbs={[{ label: "Проекты", href: "/admin/projects" }, { label: project.title }]}
        actions={
          <Badge tone={project.status === "PUBLISHED" ? "ok" : "neutral"}>
            {project.status === "PUBLISHED" ? "На сайте" : "Черновик"}
          </Badge>
        }
      />
      <div className="p-5 lg:p-8">
        <ProjectForm
          project={project}
          imagePicker={
            <ImagePicker
              images={withCurrentImage(images, project.imageId, project.image)}
              value={project.imageId}
              current={currentImage(assets, project.imageId, project.image)}
            />
          }
        />
      </div>
    </>
  );
}
