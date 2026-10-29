import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLead } from "@/lib/api/leads";
import { getAdminUsers } from "@/lib/api/users";
import { ApiError } from "@/lib/api/errors";
import { formatBytes, formatDateTime } from "@/lib/admin/format";
import { LEAD_STATUS_LABEL, LEAD_STATUS_TONE } from "@/lib/admin/lead-status";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { LeadAssignForm, LeadNoteForm, LeadStatusForm } from "@/components/admin/lead-forms";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download } from "@/components/ui/icons";
import type { Lead } from "@/lib/api/types";

/**
 * Страница читает данные под авторизацией на каждый запрос: кешировать
 * их нечем, мгновенной навигация быть не может. Проверка instant
 * выключена осознанно (см. комментарий в src/app/admin/layout.tsx).
 */
export const instant = false;

export const metadata: Metadata = { title: "Заявка" };

export default async function LeadPage({ params }: PageProps<"/admin/leads/[id]">) {
  const { id } = await params;

  let lead: Lead;
  try {
    lead = await getLead(id);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) notFound();
    throw error;
  }

  const admins = await getAdminUsers();

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Заявки", href: "/admin/leads" }, { label: lead.name }]}
        title={lead.name}
        description={`Заявка от ${formatDateTime(lead.createdAt)}`}
        actions={
          <Link
            href="/admin/leads"
            prefetch={false}
            className="inline-flex h-9 items-center gap-2 rounded-card border border-line px-3.5 text-[12.5px] font-medium transition-colors hover:border-ink hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
            К списку
          </Link>
        }
      />

      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_320px] lg:gap-6 lg:p-8">
        <div className="space-y-5">
          <Panel title="Контакты">
            <dl className="divide-y divide-line">
              <Row label="Имя">{lead.name}</Row>
              <Row label="Телефон">
                <a href={`tel:+${lead.phoneDigits}`} className="hover:text-accent">
                  {lead.phone}
                </a>
              </Row>
              <Row label="Email">
                {lead.email ? (
                  <a href={`mailto:${lead.email}`} className="hover:text-accent">
                    {lead.email}
                  </a>
                ) : (
                  <span className="text-text-2">не указан</span>
                )}
              </Row>
              <Row label="Согласие">{formatDateTime(lead.consentAt)}</Row>
            </dl>
          </Panel>

          <Panel title="Сообщение">
            <div className="px-5 py-4">
              {lead.message ? (
                <p className="text-[13.5px] leading-relaxed whitespace-pre-line">{lead.message}</p>
              ) : (
                <p className="text-[13px] text-text-2">Без сообщения.</p>
              )}
            </div>
          </Panel>

          {lead.attachments.length > 0 ? (
            <Panel title="Вложения">
              <ul className="divide-y divide-line">
                {lead.attachments.map((file) => (
                  <li key={file.id} className="flex items-center justify-between gap-4 px-5 py-3">
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium">
                        {file.originalName}
                      </span>
                      <span className="mt-0.5 block text-[12px] text-text-2">
                        {formatBytes(file.bytes)}
                      </span>
                    </span>
                    {/* Обычная ссылка: скачивание работает и в новой вкладке. */}
                    <a
                      href={`/api/admin/leads/${lead.id}/attachments/${file.id}`}
                      className="inline-flex h-9 shrink-0 items-center gap-2 rounded-card border border-line px-3.5 text-[12.5px] font-medium transition-colors hover:border-ink hover:bg-muted"
                    >
                      <Download className="size-4" />
                      Скачать
                    </a>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          <Panel title="Внутренняя заметка">
            <div className="px-5 py-4">
              <LeadNoteForm id={lead.id} note={lead.internalNote} />
            </div>
          </Panel>
        </div>

        <aside className="space-y-5">
          <Panel title="Статус">
            <div className="space-y-4 px-5 py-4">
              <Badge tone={LEAD_STATUS_TONE[lead.status]}>{LEAD_STATUS_LABEL[lead.status]}</Badge>
              <LeadStatusForm id={lead.id} status={lead.status} />
            </div>
          </Panel>

          <Panel title="Ответственный">
            <div className="px-5 py-4">
              <LeadAssignForm
                id={lead.id}
                assignedToId={lead.assignedToId}
                assignedToName={lead.assignedTo?.name}
                admins={admins}
              />
            </div>
          </Panel>

          <Panel title="Служебное">
            <dl className="divide-y divide-line">
              <Row label="IP">{lead.ip ?? "—"}</Row>
              <Row label="Уведомление">
                {lead.notifiedAt ? formatDateTime(lead.notifiedAt) : "не отправлено"}
              </Row>
              <Row label="Изменена">{formatDateTime(lead.updatedAt)}</Row>
              <Row label="Браузер">
                <span className="break-all text-[11.5px] text-text-2">
                  {lead.userAgent ?? "—"}
                </span>
              </Row>
            </dl>
          </Panel>
        </aside>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 px-5 py-2.5">
      <dt className="w-28 shrink-0 text-[12.5px] text-text-2">{label}</dt>
      <dd className="min-w-0 flex-1 text-[13px]">{children}</dd>
    </div>
  );
}
