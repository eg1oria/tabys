import type { Metadata } from "next";
import Link from "next/link";
import { getLeads } from "@/lib/api/leads";
import { formatDateTime } from "@/lib/admin/format";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABEL,
  LEAD_STATUS_TONE,
  isLeadStatus,
} from "@/lib/admin/lead-status";
import { PageHeader, EmptyState, Panel } from "@/components/admin/page-header";
import { Table, Td, Th, Tr } from "@/components/admin/data-table";
import { Pagination } from "@/components/admin/pagination";
import { ListFilters } from "@/components/admin/list-filters";
import { Badge } from "@/components/ui/badge";
import { Paperclip } from "@/components/ui/icons";
import { fieldBase, fieldBorder } from "@/components/ui/field";
import { cn } from "@/lib/utils";

/**
 * Страница читает данные под авторизацией на каждый запрос: кешировать
 * их нечем, мгновенной навигация быть не может. Проверка instant
 * выключена осознанно (см. комментарий в src/app/admin/layout.tsx).
 */
export const instant = false;

export const metadata: Metadata = { title: "Заявки" };

export default async function LeadsPage({ searchParams }: PageProps<"/admin/leads">) {
  const params = await searchParams;
  const status = isLeadStatus(params.status) ? params.status : undefined;
  const q = typeof params.q === "string" && params.q !== "" ? params.q : undefined;
  const page = Number(params.page) > 1 ? Number(params.page) : undefined;

  const { data, meta } = await getLeads({ status, q, page });

  return (
    <>
      <PageHeader
        title="Заявки"
        description="Всё, что приходит с формы на сайте. Вложения скачиваются только отсюда."
      />

      <div className="p-5 lg:p-8">
        <Panel>
          <ListFilters action="/admin/leads" searchValue={q} searchPlaceholder="Имя, телефон, email, текст">
            <select
              name="status"
              defaultValue={status ?? ""}
              aria-label="Статус"
              className={cn(fieldBase, "h-9 w-auto cursor-pointer pr-8", fieldBorder(false))}
            >
              <option value="">Все статусы</option>
              {LEAD_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {LEAD_STATUS_LABEL[value]}
                </option>
              ))}
            </select>
          </ListFilters>

          {data.length === 0 ? (
            <EmptyState
              message={q || status ? "Ничего не найдено" : "Заявок пока нет"}
              hint={
                q || status
                  ? "Попробуйте изменить фильтры."
                  : "Как только с сайта отправят форму, заявка появится здесь."
              }
            />
          ) : (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th>Дата</Th>
                    <Th>Кто</Th>
                    <Th>Телефон</Th>
                    <Th>Статус</Th>
                    <Th>Ответственный</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((lead) => (
                    <Tr key={lead.id}>
                      <Td className="whitespace-nowrap text-text-2">
                        {formatDateTime(lead.createdAt)}
                      </Td>
                      <Td>
                        <Link
                          href={`/admin/leads/${lead.id}`}
                          prefetch={false}
                          className="font-medium text-ink hover:text-accent"
                        >
                          {lead.name}
                        </Link>
                        {lead.email ? (
                          <span className="mt-0.5 block text-[12px] text-text-2">{lead.email}</span>
                        ) : null}
                        {lead.attachments.length > 0 ? (
                          <span className="mt-1 inline-flex items-center gap-1 text-[12px] text-text-2">
                            <Paperclip className="size-3.5" />
                            {lead.attachments.length}
                          </span>
                        ) : null}
                      </Td>
                      <Td className="whitespace-nowrap">
                        <a href={`tel:+${lead.phoneDigits}`} className="hover:text-accent">
                          {lead.phone}
                        </a>
                      </Td>
                      <Td>
                        <Badge tone={LEAD_STATUS_TONE[lead.status]}>
                          {LEAD_STATUS_LABEL[lead.status]}
                        </Badge>
                      </Td>
                      <Td className="text-text-2">{lead.assignedTo?.name ?? "—"}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>

              <Pagination
                basePath="/admin/leads"
                params={{ status, q }}
                meta={meta}
              />
            </>
          )}
        </Panel>
      </div>
    </>
  );
}
