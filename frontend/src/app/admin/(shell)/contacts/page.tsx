import type { Metadata } from "next";
import { getAdminContacts } from "@/lib/api/contacts";
import { PageHeader } from "@/components/admin/page-header";
import { ContactsForm } from "@/components/admin/contacts-form";

export const instant = false;

export const metadata: Metadata = { title: "Контакты" };

export default async function ContactsPage() {
  const contacts = await getAdminContacts();

  return (
    <>
      <PageHeader
        title="Контакты"
        description="Адрес, телефоны, почта и мессенджеры на сайте: в шапке, подвале и на странице «Контакты»."
        breadcrumbs={[{ label: "Контакты" }]}
      />
      <div className="p-5 lg:max-w-4xl lg:p-8">
        <ContactsForm contacts={contacts} />
      </div>
    </>
  );
}
