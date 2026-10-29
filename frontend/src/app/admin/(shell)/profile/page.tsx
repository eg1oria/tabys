import type { Metadata } from "next";
import { apiRead } from "@/lib/api/server";
import { formatDateTime } from "@/lib/admin/format";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { PasswordForm } from "@/components/admin/password-form";
import { Badge } from "@/components/ui/badge";
import type { CurrentUser } from "@/lib/api/types";

export const instant = false;

export const metadata: Metadata = { title: "Профиль" };

export default async function ProfilePage() {
  const me = await apiRead<CurrentUser>("/auth/me");

  return (
    <>
      <PageHeader title="Профиль" description="Ваша учётная запись в админке." />

      <div className="grid gap-5 p-5 lg:max-w-4xl lg:grid-cols-2 lg:p-8">
        <Panel title="Учётная запись">
          <dl className="divide-y divide-line">
            <Row label="Имя">{me.name}</Row>
            <Row label="Email">{me.email}</Row>
            <Row label="Роль">
              <Badge tone={me.role === "OWNER" ? "accent" : "neutral"}>
                {me.role === "OWNER" ? "Владелец" : "Редактор"}
              </Badge>
            </Row>
            <Row label="Вход">
              {me.lastLoginAt ? formatDateTime(me.lastLoginAt) : "—"}
            </Row>
          </dl>
        </Panel>

        <Panel title="Смена пароля">
          <div className="px-5 py-4">
            <PasswordForm />
          </div>
        </Panel>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 px-5 py-2.5">
      <dt className="w-24 shrink-0 text-[12.5px] text-text-2">{label}</dt>
      <dd className="min-w-0 flex-1 text-[13px]">{children}</dd>
    </div>
  );
}
