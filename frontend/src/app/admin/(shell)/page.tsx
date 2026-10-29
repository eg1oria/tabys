import { redirect } from "next/navigation";

/** Корень админки — это инбокс: заявки важнее каталога. */
export default function AdminIndexPage() {
  redirect("/admin/leads");
}
