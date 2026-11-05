import type { Metadata } from "next";
import Link from "next/link";
import { getAdminProjects } from "@/lib/api/projects";
import { apiRead } from "@/lib/api/server";
import type { CurrentUser } from "@/lib/api/types";
import { deleteProject, reorderProjects, setProjectStatus } from "@/lib/admin/project-actions";
import { EmptyState, PageHeader, Panel } from "@/components/admin/page-header";
import { Table, Td, Th, Tr } from "@/components/admin/data-table";
import { ReorderList } from "@/components/admin/reorder-list";
import { DeleteButton, PublishToggle } from "@/components/admin/row-actions";
import { Badge } from "@/components/ui/badge";
import { Plus } from "@/components/ui/icons";

export const instant = false;

export const metadata: Metadata = { title: "Проекты" };

export default async function ProjectsPage() {
  const [projects, me] = await Promise.all([getAdminProjects(), apiRead<CurrentUser>("/auth/me")]);

  return (
    <>
      <PageHeader
        title="Проекты"
        description="Реализованные проекты: страница «Проекты» и блок на главной (там — первые три)."
        breadcrumbs={[{ label: "Проекты" }]}
        actions={
          <Link
            href="/admin/projects/new"
            prefetch={false}
            className="inline-flex h-9 items-center gap-2 rounded-card bg-accent px-4 text-[12.5px] font-medium text-white transition-colors hover:bg-accent-strong"
          >
            <Plus className="size-4" />
            Новый проект
          </Link>
        }
      />

      <div className="space-y-5 p-5 lg:p-8">
        <Panel title={`Всего: ${projects.length}`}>
          {projects.length === 0 ? (
            <EmptyState message="Проектов пока нет" hint="Добавьте первый — он появится на сайте." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Название</Th>
                  <Th>Где и когда</Th>
                  <Th>Фото</Th>
                  <Th>Статус</Th>
                  <Th>
                    <span className="sr-only">Действия</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <Tr key={project.id}>
                    <Td>
                      <Link
                        href={`/admin/projects/${project.id}`}
                        prefetch={false}
                        className="font-medium hover:text-accent"
                      >
                        {project.title}
                      </Link>
                    </Td>
                    <Td className="text-text-2">
                      {[project.location, project.year].filter(Boolean).join(" · ") || "—"}
                    </Td>
                    <Td className="text-text-2">{project.imageId ? "есть" : "нет"}</Td>
                    <Td>
                      <Badge tone={project.status === "PUBLISHED" ? "ok" : "neutral"}>
                        {project.status === "PUBLISHED" ? "На сайте" : "Черновик"}
                      </Badge>
                    </Td>
                    <Td>
                      <span className="flex items-start justify-end gap-2 whitespace-nowrap">
                        <PublishToggle
                          id={project.id}
                          published={project.status === "PUBLISHED"}
                          action={setProjectStatus}
                        />
                        {me.role === "OWNER" ? (
                          <DeleteButton id={project.id} action={deleteProject} />
                        ) : null}
                      </span>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>

        {projects.length > 1 ? (
          <Panel title="Порядок на сайте">
            <ReorderList
              items={projects.map((project) => ({ id: project.id, title: project.title }))}
              action={reorderProjects}
            />
          </Panel>
        ) : null}
      </div>
    </>
  );
}
