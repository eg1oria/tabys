"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  Field,
  FormError,
  Select,
  TextArea,
  TextInput,
} from "@/components/ui/field";
import { SubmitButton } from "./submit-button";
import { SpecsEditor } from "./specs-editor";
import { DeleteSubmit } from "./catalog/delete-submit";
import { ProductGallery, type GalleryItem } from "./catalog/product-gallery";
import { deleteProduct, saveProduct } from "@/lib/admin/catalog-actions";
import { FORM_ERROR, initialFormState, str } from "@/lib/admin/form-state";
import type { AdminProduct } from "@/lib/api/types";
import type { PickableImage } from "./image-picker";

/**
 * Карточка товара в выдвижной панели.
 *
 * Поля неуправляемые, но форма перемонтируется по submissionId и
 * пересевается тем, что человек отправил: React 19 после любого действия
 * сбрасывает неуправляемые поля, и без этого неудачное сохранение
 * стирало бы весь ввод вместе с показом ошибки.
 */
export function ProductForm({
  product,
  categories,
  defaultCategoryId,
  gallery,
  library,
  returnTo,
  facetPicker,
}: {
  product: AdminProduct | null;
  categories: { id: string; title: string }[];
  defaultCategoryId?: string;
  gallery: GalleryItem[];
  library: PickableImage[];
  returnTo: string;
  facetPicker: React.ReactNode;
}) {
  const [state, formAction] = useActionState(saveProduct, initialFormState);
  // Отдельное состояние для удаления: кнопка отправляет ту же форму
  // другим действием, поэтому её ошибки приходят сюда.
  const [removeState, removeAction] = useActionState(
    deleteProduct,
    initialFormState,
  );
  const errors = state.errors;
  const was = (name: string) => str(state.values, name);

  return (
    <form
      key={state.submissionId ?? 0}
      action={formAction}
      className="space-y-5"
    >
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <input type="hidden" name="returnTo" value={returnTo} />

      <FormError
        message={errors[FORM_ERROR] ?? removeState.errors[FORM_ERROR]}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4 rounded-card border border-line bg-white p-5">
          <Field label="Название" htmlFor="title" error={errors.title} required>
            <TextInput
              id="title"
              name="title"
              defaultValue={was("title") ?? product?.title ?? ""}
              error={errors.title}
              maxLength={300}
            />
          </Field>

          <Field
            label="Артикул"
            htmlFor="sku"
            error={errors.sku}
            hint="Латиница, цифры и дефис. Должен быть уникальным."
          >
            <TextInput
              id="sku"
              name="sku"
              defaultValue={was("sku") ?? product?.sku ?? ""}
              error={errors.sku}
              placeholder="TC-R-500"
              maxLength={64}
            />
          </Field>

          <Field
            label="Категория"
            htmlFor="categoryId"
            error={errors.categoryId}
            required
          >
            <Select
              id="categoryId"
              name="categoryId"
              defaultValue={
                was("categoryId") ??
                product?.categoryId ??
                defaultCategoryId ??
                ""
              }
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

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Цена от, ₸"
              htmlFor="priceFrom"
              error={errors.priceFrom}
              hint="Пусто — «по запросу»."
            >
              <TextInput
                id="priceFrom"
                name="priceFrom"
                inputMode="decimal"
                defaultValue={was("priceFrom") ?? product?.priceFrom ?? ""}
                error={errors.priceFrom}
                placeholder="12 500 000"
              />
            </Field>

            <Field label="Статус" htmlFor="status">
              <Select
                id="status"
                name="status"
                defaultValue={was("status") ?? product?.status ?? "PUBLISHED"}
              >
                <option value="PUBLISHED">Опубликован</option>
                <option value="DRAFT">Черновик</option>
              </Select>
            </Field>
          </div>

          <Field
            label="Адрес (slug)"
            htmlFor="slug"
            error={errors.slug}
            hint={
              product
                ? "Уже может стоять в ссылках."
                : "Пусто — соберём из названия."
            }
          >
            <TextInput
              id="slug"
              name="slug"
              defaultValue={was("slug") ?? product?.slug ?? ""}
              error={errors.slug}
              maxLength={80}
            />
          </Field>

          <Field
            label="Краткое описание"
            htmlFor="description"
            error={errors.description}
          >
            <TextArea
              id="description"
              name="description"
              defaultValue={was("description") ?? product?.description ?? ""}
              error={errors.description}
              rows={4}
              maxLength={5000}
            />
          </Field>

          <div>
            <h3 className="section-label mb-2">Характеристики</h3>
            <SpecsEditor specs={product?.specs ?? null} />
          </div>
        </div>

        <div className="space-y-5">
          <section className="space-y-3 rounded-card border border-line bg-white p-5">
            <h2 className="section-label">Фотографии</h2>
            <ProductGallery initial={gallery} library={library} />
          </section>

          <section className="space-y-3 rounded-card border border-line bg-white p-5">
            <h2 className="section-label">Фильтры каталога</h2>
            {facetPicker}
          </section>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-white px-5 py-4">
        <span>{product ? <DeleteSubmit action={removeAction} /> : null}</span>
        <span className="flex items-center gap-3">
          <span
            role="status"
            aria-live="polite"
            className="text-[12.5px] text-emerald-600"
          >
            {state.status === "success" ? "Сохранено" : null}
          </span>
          <Link
            href={returnTo}
            prefetch={false}
            className="text-[12.5px] text-text-2 hover:text-ink"
          >
            Отмена
          </Link>
          <SubmitButton>Сохранить</SubmitButton>
        </span>
      </div>
    </form>
  );
}
