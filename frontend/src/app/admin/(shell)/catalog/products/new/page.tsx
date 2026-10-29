import { redirect } from "next/navigation";
import { textParam } from "@/lib/admin/search-params";

export const instant = false;

/** Создание товара тоже в панели — сохраняем выбранную категорию. */
export default async function NewProductPage({
  searchParams,
}: PageProps<"/admin/catalog/products/new">) {
  const params = await searchParams;
  const category = textParam(params.category, 80);
  const search = new URLSearchParams({ edit: "new" });
  if (category) search.set("category", category);
  redirect(`/admin/catalog/products?${search.toString()}`);
}
