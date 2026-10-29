"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Checkbox, Field, FormError, Select, TextArea, TextInput } from "@/components/ui/field";
import { SubmitButton } from "./submit-button";
import { SpecsEditor } from "./specs-editor";
import { saveProduct } from "@/lib/admin/catalog-actions";
import { FORM_ERROR, initialFormState } from "@/lib/admin/form-state";
import type { AdminProduct } from "@/lib/api/types";

export function ProductForm({
  product,
  categories,
  defaultCategoryId,
  imagePicker,
  facetPicker,
}: {
  product: AdminProduct | null;
  categories: { id: string; title: string }[];
  defaultCategoryId?: string;
  imagePicker: React.ReactNode;
  facetPicker: React.ReactNode;
}) {
  const [state, formAction] = useActionState(saveProduct, initialFormState);
  const errors = state.errors;

  return (
    <form action={formAction} className="space-y-5">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <FormError message={errors[FORM_ERROR]} />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4 rounded-card border border-line bg-white p-5">
          <Field label="Категория" htmlFor="categoryId" error={errors.categoryId} required>
            <Select
              id="categoryId"
              name="categoryId"
              defaultValue={product?.categoryId ?? defaultCategoryId ?? ""}
              error={errors.categoryId}
            >
              <option value="">Выберите категорию</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Название" htmlFor="title" error={errors.title} required>
            <TextInput
              id="title"
              name="title"
              defaultValue={product?.title ?? ""}
              error={errors.title}
              maxLength={300}
            />
          </Field>

          <Field
            label="Адрес (slug)"
            htmlFor="slug"
            error={errors.slug}
            hint="Пусто — соберётся из названия."
          >
            <TextInput
              id="slug"
              name="slug"
              defaultValue={product?.slug ?? ""}
              error={errors.slug}
              maxLength={80}
            />
          </Field>

          <Field label="Описание" htmlFor="description" error={errors.description}>
            <TextArea
              id="description"
              name="description"
              defaultValue={product?.description ?? ""}
              error={errors.description}
              rows={5}
              maxLength={5000}
            />
          </Field>

          <div>
            <span className="mb-1.5 block text-[12.5px] font-medium">Характеристики</span>
            <SpecsEditor specs={product?.specs ?? null} />
          </div>
        </div>

        <div className="space-y-5">
          <section className="space-y-3 rounded-card border border-line bg-white p-5">
            <h2 className="section-label">Цена</h2>
            <Field
              label="Цена от, ₸"
              htmlFor="priceFrom"
              error={errors.priceFrom}
              hint="Пусто — показываем «по запросу»."
            >
              <TextInput
                id="priceFrom"
                name="priceFrom"
                inputMode="decimal"
                defaultValue={product?.priceFrom ?? ""}
                error={errors.priceFrom}
              />
            </Field>
            <Checkbox
              name="priceOnRequest"
              defaultChecked={product ? product.priceOnRequest : true}
              label="Цена по запросу"
            />
          </section>

          <section className="space-y-3 rounded-card border border-line bg-white p-5">
            <h2 className="section-label">Картинка</h2>
            {imagePicker}
          </section>

          <section className="space-y-3 rounded-card border border-line bg-white p-5">
            <h2 className="section-label">Фильтры</h2>
            {facetPicker}
          </section>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton>{product ? "Сохранить" : "Создать товар"}</SubmitButton>
        <Link
          href="/admin/catalog/products"
          prefetch={false}
          className="text-[12.5px] text-text-2 hover:text-ink"
        >
          Отмена
        </Link>
        {state.status === "success" ? (
          <span className="text-[12.5px] text-emerald-600">Сохранено</span>
        ) : null}
      </div>
    </form>
  );
}
