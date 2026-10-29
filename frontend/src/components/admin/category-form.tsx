"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormError, TextArea, TextInput } from "@/components/ui/field";
import { SubmitButton } from "./submit-button";
import { saveCategory } from "@/lib/admin/catalog-actions";
import { FORM_ERROR, initialFormState, str } from "@/lib/admin/form-state";
import type { AdminCategory } from "@/lib/api/types";

/**
 * Выбор картинки и значений фильтров приходит готовой разметкой из
 * серверного компонента: это обычные поля формы, клиентского состояния
 * им не нужно, а медиатеку и фасеты страница и так уже загрузила.
 */
export function CategoryForm({
  category,
  imagePicker,
  facetPicker,
}: {
  category: AdminCategory | null;
  imagePicker: React.ReactNode;
  facetPicker: React.ReactNode;
}) {
  const [state, formAction] = useActionState(saveCategory, initialFormState);
  const errors = state.errors;
  /** Что ввели до ошибки: React 19 сбрасывает поля после любой отправки. */
  const was = (name: string) => str(state.values, name);

  return (
    // key по номеру отправки: поля перемонтируются с новыми defaultValue.
    <form key={state.submissionId ?? 0} action={formAction} className="space-y-5">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      <FormError message={errors[FORM_ERROR]} />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4 rounded-card border border-line bg-white p-5">
          <Field label="Название" htmlFor="title" error={errors.title} required>
            <TextInput
              id="title"
              name="title"
              defaultValue={was("title") ?? category?.title ?? ""}
              error={errors.title}
              maxLength={200}
            />
          </Field>

          <Field
            label="Адрес (slug)"
            htmlFor="slug"
            error={errors.slug}
            hint={
              category
                ? "Слаг уже в ссылках каталога — меняйте только осознанно."
                : "Оставьте пустым — соберётся из названия."
            }
          >
            <TextInput
              id="slug"
              name="slug"
              defaultValue={was("slug") ?? category?.slug ?? ""}
              error={errors.slug}
              placeholder="emkosti-i-rezervuary"
              maxLength={80}
            />
          </Field>

          <Field
            label="Короткое имя"
            htmlFor="short"
            error={errors.short}
            hint="Для боковой панели каталога. Пусто — возьмём название."
          >
            <TextInput
              id="short"
              name="short"
              defaultValue={was("short") ?? category?.short ?? ""}
              error={errors.short}
              maxLength={200}
            />
          </Field>

          <Field label="Описание" htmlFor="description" error={errors.description} required>
            <TextArea
              id="description"
              name="description"
              defaultValue={was("description") ?? category?.description ?? ""}
              error={errors.description}
              rows={4}
              maxLength={1000}
            />
          </Field>

          <Field
            label="Преимущества"
            htmlFor="highlights"
            hint="По одному пункту на строку."
          >
            <TextArea
              id="highlights"
              name="highlights"
              defaultValue={was("highlights") ?? (category?.highlights ?? []).join("\n")}
              rows={4}
            />
          </Field>

          <Field
            label="Число позиций"
            htmlFor="positionCount"
            error={errors.positionCount}
            hint="Витринное число на карточке. Пусто — посчитаем по товарам."
          >
            <span className="block w-32">
              <TextInput
                id="positionCount"
                name="positionCount"
                type="number"
                min={0}
                defaultValue={was("positionCount") ?? category?.positionCount ?? ""}
                error={errors.positionCount}
              />
            </span>
          </Field>
        </div>

        <div className="space-y-5">
          <section className="space-y-3 rounded-card border border-line bg-white p-5">
            <h2 className="section-label">Картинка</h2>
            {imagePicker}
          </section>

          <section className="space-y-3 rounded-card border border-line bg-white p-5">
            <h2 className="section-label">Фильтры</h2>
            {facetPicker}
          </section>

          <section className="space-y-4 rounded-card border border-line bg-white p-5">
            <h2 className="section-label">SEO</h2>
            <Field label="Заголовок" htmlFor="seoTitle" error={errors.seoTitle}>
              <TextInput
                id="seoTitle"
                name="seoTitle"
                defaultValue={was("seoTitle") ?? category?.seoTitle ?? ""}
                error={errors.seoTitle}
                maxLength={200}
              />
            </Field>
            <Field label="Описание" htmlFor="seoDescription" error={errors.seoDescription}>
              <TextArea
                id="seoDescription"
                name="seoDescription"
                defaultValue={was("seoDescription") ?? category?.seoDescription ?? ""}
                error={errors.seoDescription}
                rows={3}
                maxLength={400}
              />
            </Field>
          </section>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton>{category ? "Сохранить" : "Создать категорию"}</SubmitButton>
        <Link
          href="/admin/catalog/categories"
          prefetch={false}
          className="text-[12.5px] text-text-2 hover:text-ink"
        >
          Отмена
        </Link>
        <span role="status" aria-live="polite" className="text-[12.5px] text-emerald-600">
          {state.status === "success" ? "Сохранено" : null}
        </span>
      </div>
    </form>
  );
}
