"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Checkbox, Field, FormError, TextArea, TextInput } from "@/components/ui/field";
import { SubmitButton } from "./submit-button";
import { saveProject } from "@/lib/admin/project-actions";
import { FORM_ERROR, initialFormState, str } from "@/lib/admin/form-state";
import type { AdminProject } from "@/lib/api/types";

/**
 * Проект для страницы «Проекты» и блока на главной. Выбор фото приходит
 * готовой разметкой из серверной страницы — как у категорий.
 */
export function ProjectForm({
  project,
  imagePicker,
}: {
  project: AdminProject | null;
  imagePicker: React.ReactNode;
}) {
  const [state, formAction] = useActionState(saveProject, initialFormState);
  const errors = state.errors;
  /** Что ввели до ошибки: React 19 сбрасывает поля после любой отправки. */
  const was = (name: string) => str(state.values, name);
  const submitted = state.values !== undefined;
  const published = submitted
    ? was("published") === "on"
    : project
      ? project.status === "PUBLISHED"
      : true;

  return (
    <form key={state.submissionId ?? 0} action={formAction} className="space-y-5">
      {project ? <input type="hidden" name="id" value={project.id} /> : null}
      <FormError message={errors[FORM_ERROR]} />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4 rounded-card border border-line bg-white p-5">
          <Field label="Название" htmlFor="title" error={errors.title} required>
            <TextInput
              id="title"
              name="title"
              defaultValue={was("title") ?? project?.title ?? ""}
              error={errors.title}
              placeholder="Сыроварня под ключ"
              maxLength={200}
            />
          </Field>

          <Field
            label="Подзаголовок"
            htmlFor="subtitle"
            error={errors.subtitle}
            hint="Строка под названием: что сделали или где."
          >
            <TextInput
              id="subtitle"
              name="subtitle"
              defaultValue={was("subtitle") ?? project?.subtitle ?? ""}
              error={errors.subtitle}
              placeholder="Проектирование, производство, монтаж"
              maxLength={300}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
            <Field label="Город или регион" htmlFor="location" error={errors.location}>
              <TextInput
                id="location"
                name="location"
                defaultValue={was("location") ?? project?.location ?? ""}
                error={errors.location}
                placeholder="Шымкент"
                maxLength={100}
              />
            </Field>
            <Field label="Год" htmlFor="year" error={errors.year}>
              <TextInput
                id="year"
                name="year"
                defaultValue={was("year") ?? project?.year ?? ""}
                error={errors.year}
                placeholder="2024"
                maxLength={20}
              />
            </Field>
          </div>

          <Field
            label="Что сделали"
            htmlFor="scope"
            error={errors.scope}
            hint="По одному пункту на строку — на сайте это список с галочками."
          >
            <TextArea
              id="scope"
              name="scope"
              defaultValue={was("scope") ?? (project?.scope ?? []).join("\n")}
              error={errors.scope}
              rows={5}
              placeholder={"Сыродельная ванна 1 000 л\nМонтаж и пусконаладка"}
            />
          </Field>
        </div>

        <div className="space-y-5">
          <section className="space-y-3 rounded-card border border-line bg-white p-5">
            <h2 className="section-label">Фото</h2>
            {imagePicker}
            {errors.imageId ? (
              <p className="text-[12px] text-red-600">{errors.imageId}</p>
            ) : null}
          </section>

          <section className="space-y-3 rounded-card border border-line bg-white p-5">
            <h2 className="section-label">Публикация</h2>
            <Checkbox
              name="published"
              defaultChecked={published}
              label="Показывать на сайте"
            />
            <p className="text-[12px] leading-relaxed text-text-2">
              На главной — первые три проекта по порядку, на странице «Проекты» — все.
            </p>
          </section>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton>{project ? "Сохранить" : "Добавить проект"}</SubmitButton>
        <Link
          href="/admin/projects"
          prefetch={false}
          className="text-[12.5px] text-text-2 hover:text-ink"
        >
          К списку
        </Link>
        <span role="status" aria-live="polite" className="text-[12.5px] text-emerald-600">
          {state.status === "success" ? "Сохранено" : null}
        </span>
      </div>
    </form>
  );
}
