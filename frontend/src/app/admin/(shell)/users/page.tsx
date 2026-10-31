import type { Metadata } from "next";
import { apiRead } from "@/lib/api/server";
import { getAdminAccounts } from "@/lib/api/users";
import { formatDateTime } from "@/lib/admin/format";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { CreateUserForm, UserActions } from "@/components/admin/user-forms";
import { Badge } from "@/components/ui/badge";
import type { CurrentUser } from "@/lib/api/types";

export const instant = false;

export const metadata: Metadata = { title: "Администраторы" };

export default async function UsersPage() {
  const me = await apiRead<CurrentUser>("/auth/me");
  const header = (
    <PageHeader
      title="Администраторы"
      description="Кто входит в админку и что ему можно."
      breadcrumbs={[{ label: "Администраторы" }]}
    />
  );

  // Бэкенд всё равно ответил бы 403 — показываем понятный текст вместо ошибки.
  if (me.role !== "OWNER") {
    return (
      <>
        {header}
        <p className="p-5 text-[13px] text-text-2 lg:p-8">
          Управлять учётными записями может только владелец.
        </p>
      </>
    );
  }

  const accounts = await getAdminAccounts();

  return (
    <>
      {header}

      <div className="grid gap-5 p-5 lg:max-w-6xl lg:grid-cols-[1fr_340px] lg:p-8">
        <Panel title="Учётные записи">
          <ul className="divide-y divide-line">
            {accounts.map((account) => (
              <li key={account.id} className="space-y-3 px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium">
                      {account.name}
                      {account.id === me.id ? (
                        <span className="ml-2 text-[12px] font-normal text-text-2">это вы</span>
                      ) : null}
                    </p>
                    <p className="truncate text-[12px] text-text-2">{account.email}</p>
                    <p className="mt-0.5 text-[11.5px] text-text-2">
                      {account.lastLoginAt
                        ? `Последний вход ${formatDateTime(account.lastLoginAt)}`
                        : "Ещё не входил"}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <Badge tone={account.role === "OWNER" ? "accent" : "neutral"}>
                      {account.role === "OWNER" ? "Владелец" : "Редактор"}
                    </Badge>
                    {account.isActive ? null : <Badge tone="danger">Вход отключён</Badge>}
                  </span>
                </div>
                {account.id === me.id ? null : (
                  <UserActions
                    id={account.id}
                    name={account.name}
                    role={account.role}
                    isActive={account.isActive}
                  />
                )}
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-5">
          <Panel title="Новый администратор">
            <div className="px-5 py-4">
              <CreateUserForm />
            </div>
          </Panel>

          <Panel title="Роли">
            <dl className="space-y-3 px-5 py-4 text-[12.5px] leading-relaxed">
              <div>
                <dt className="font-medium">Редактор</dt>
                <dd className="text-text-2">
                  Заявки; товары и категории — создать, изменить, опубликовать; загрузка
                  картинок; свой Telegram для уведомлений.
                </dd>
              </div>
              <div>
                <dt className="font-medium">Владелец</dt>
                <dd className="text-text-2">
                  Всё то же плюс удаление товаров, категорий и картинок, значения фильтров,
                  бот Telegram и администраторы. Технические сбои приходят в чаты,
                  подключённые владельцем.
                </dd>
              </div>
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}
