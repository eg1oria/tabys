import { redirect } from "next/navigation";

export const instant = false;

/**
 * Карточка товара переехала в выдвижную панель над списком. Маршрут
 * оставлен редиректом: на него ведут старые закладки и ссылки из писем.
 */
export default async function EditProductPage({
  params,
}: PageProps<"/admin/catalog/products/[id]">) {
  const { id } = await params;
  redirect(`/admin/catalog/products?edit=${encodeURIComponent(id)}`);
}
