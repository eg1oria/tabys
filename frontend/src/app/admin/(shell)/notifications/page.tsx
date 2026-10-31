import type { Metadata } from "next";
import Link from "next/link";
import { apiRead } from "@/lib/api/server";
import { getTelegramStatus } from "@/lib/api/notifications";
import { formatDateTime } from "@/lib/admin/format";
import { PageHeader, Panel } from "@/components/admin/page-header";
import {
  BotTokenForm,
  ConnectChat,
  RemoveBotButton,
  RemoveChatButton,
  TestMessageButton,
} from "@/components/admin/telegram-settings";
import { Badge } from "@/components/ui/badge";
import type { CurrentUser } from "@/lib/api/types";

export const instant = false;

export const metadata: Metadata = { title: "Уведомления" };

export default async function NotificationsPage() {
  const [status, me] = await Promise.all([
    getTelegramStatus(),
    apiRead<CurrentUser>("/auth/me"),
  ]);
  const isOwner = me.role === "OWNER";
  const { bot, chats, pendingLeads } = status;

  return (
    <>
      <PageHeader
        title="Уведомления"
        description="Куда приходят новые заявки с сайта. Сейчас — в Telegram."
        breadcrumbs={[{ label: "Уведомления" }]}
      />

      <div className="grid gap-5 p-5 lg:max-w-5xl lg:grid-cols-2 lg:p-8">
        {pendingLeads > 0 ? (
          <p className="rounded-card border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] leading-relaxed text-amber-800 lg:col-span-2">
            {bot && chats.length > 0
              ? `Новых заявок без уведомления: ${pendingLeads}. Заявки за последние трое суток бот отправит повторно сам.`
              : `Новых заявок без уведомления: ${pendingLeads}. Подключите бота и чат — заявки за последние трое суток придут сами.`}{" "}
            <Link
              href="/admin/leads?status=NEW&notified=false"
              prefetch={false}
              className="font-medium underline underline-offset-2"
            >
              Открыть заявки
            </Link>
          </p>
        ) : null}

        <Panel title="Бот">
          <div className="space-y-4 px-5 py-4">
            {bot ? (
              <>
                <p className="flex flex-wrap items-center gap-2 text-[13px]">
                  <Badge tone="ok">Подключён</Badge>
                  <a
                    href={bot.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium hover:text-accent"
                  >
                    @{bot.username}
                  </a>
                </p>
                {isOwner ? (
                  <details className="group">
                    <summary className="cursor-pointer text-[12.5px] text-text-2 hover:text-ink">
                      Заменить токен
                    </summary>
                    <div className="mt-3">
                      <BotTokenForm replacing />
                    </div>
                  </details>
                ) : null}
                {isOwner ? <RemoveBotButton /> : null}
              </>
            ) : (
              <>
                <ol className="list-decimal space-y-1.5 pl-5 text-[12.5px] leading-relaxed">
                  <li>
                    Откройте в Telegram{" "}
                    <a
                      href="https://t.me/BotFather"
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-accent hover:underline"
                    >
                      @BotFather
                    </a>{" "}
                    и отправьте команду <code>/newbot</code>.
                  </li>
                  <li>Придумайте боту имя и адрес — он должен кончаться на «bot».</li>
                  <li>BotFather пришлёт токен — скопируйте его и вставьте ниже.</li>
                </ol>
                <p className="text-[12px] leading-relaxed text-text-2">
                  Бот нужен отдельный, только для сайта: если он уже работает где-то ещё,
                  подключение чатов ему помешает.
                </p>
                {isOwner ? (
                  <BotTokenForm />
                ) : (
                  <p className="text-[12.5px] text-text-2">
                    Подключить бота может только владелец — попросите его.
                  </p>
                )}
              </>
            )}
          </div>
        </Panel>

        <Panel title="Получатели">
          <div className="space-y-4 px-5 py-4">
            {chats.length === 0 ? (
              <p className="text-[12.5px] text-text-2">
                {bot
                  ? "Пока ни одного чата — заявки уходить некуда. Подключите свой Telegram."
                  : "Чаты подключаются после бота."}
              </p>
            ) : (
              <ul className="divide-y divide-line rounded-card border border-line">
                {chats.map((chat) => (
                  <li key={chat.id} className="flex items-start justify-between gap-3 px-3.5 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium">{chat.title}</p>
                      <p className="mt-0.5 text-[11.5px] text-text-2">
                        {formatDateTime(chat.createdAt)}
                        {chat.addedBy ? ` · подключил ${chat.addedBy.name}` : null}
                      </p>
                      {chat.lastError ? (
                        <p className="mt-1 text-[11.5px] text-red-600">
                          Не доставлено
                          {chat.lastErrorAt ? ` ${formatDateTime(chat.lastErrorAt)}` : null}:{" "}
                          {chat.lastError}
                        </p>
                      ) : null}
                    </div>
                    {isOwner ? <RemoveChatButton id={chat.id} title={chat.title} /> : null}
                  </li>
                ))}
              </ul>
            )}

            {chats.length > 0 ? (
              <p className="text-[12px] leading-relaxed text-text-2">
                Чаты, подключённые владельцем, получают ещё и технические алерты: ошибки
                сервера и недоступность базы.
              </p>
            ) : null}
            {bot ? <ConnectChat /> : null}
            {bot && chats.length > 0 ? <TestMessageButton /> : null}
          </div>
        </Panel>
      </div>
    </>
  );
}
