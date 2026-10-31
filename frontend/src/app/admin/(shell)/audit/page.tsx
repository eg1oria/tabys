import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { apiRead } from "@/lib/api/server";
import { getAudit } from "@/lib/api/audit";
import { getAdminAccounts } from "@/lib/api/users";
import { formatDateTime } from "@/lib/admin/format";
import { oneOf, pageParam, textParam } from "@/lib/admin/search-params";
import {
  AUDIT_ENTITIES,
  AUDIT_ENTITY_LABEL,
  actionLabel,
  auditChanges,
  entityHref,
  entityTitle,
  isDestructive,
} from "@/lib/admin/audit-labels";
import { EmptyState, PageHeader, Panel } from "@/components/admin/page-header";
import { Table, Td, Th, Tr } from "@/components/admin/data-table";
import { Pagination } from "@/components/admin/pagination";
import { ListFilters } from "@/components/admin/list-filters";
import { fieldBase, fieldBorder } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import type { AuditEntry, CurrentUser } from "@/lib/api/types";

export const instant = false;

export const metadata: Metadata = { title: "Журнал" };

/** Сколько изменений показывать сразу; остальное — под «ещё». */
const VISIBLE_CHANGES = 3;

export default async function AuditPage({
  searchParams,
}: PageProps<"/admin/audit">) {
  const me = await apiRead<CurrentUser>("/auth/me");
  const header = (
    <PageHeader
      title="Журнал"
      description="Кто и что менял в админке. Записи старше срока хранения (AUDIT_RETENTION_DAYS) удаляются."
      breadcrumbs={[{ label: "Журнал" }]}
    />
  );

  // Бэкенд всё равно ответил бы 403 — показываем понятный текст вместо ошибки.
  if (me.role !== "OWNER") {
    return (
      <>
        {header}
        <p className="p-5 text-[13px] text-text-2 lg:p-8">
          Журнал доступен только владельцу.
        </p>
      </>
    );
  }

  const params = await searchParams;
  const entity = oneOf(params.entity, AUDIT_ENTITIES);
  const entityId = textParam(params.entityId, 64);
  const page = pageParam(params.page);

  const accounts = await getAdminAccounts();
  // actorId бэкенд проверяет как UUID: чужое значение из адреса — 400.
  const actorId = oneOf(
    params.actorId,
    accounts.map((account) => account.id),
  );

  const { data, meta } = await getAudit({ entity, entityId, actorId, page });
  const userNames = new Map(
    accounts.map((account) => [account.id, account.name]),
  );

  const filters = { entity, entityId, actorId };
  if (page && meta.total > 0 && page > meta.totalPages) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(filters))
      if (value) search.set(key, value);
    const query = search.toString();
    redirect(`/admin/audit${query ? `?${query}` : ""}`);
  }
  const filtered = Boolean(entity || entityId || actorId);

  return (
    <>
      {header}

      <div className="p-5 lg:p-8">
        <Panel>
          <ListFilters
            action="/admin/audit"
            withSearch={false}
            hidden={{ entityId }}
          >
            <span className="w-[200px]">
              <select
                name="entity"
                defaultValue={entity ?? ""}
                aria-label="Раздел"
                className={cn(
                  fieldBase,
                  "h-9 w-auto cursor-pointer pr-8",
                  fieldBorder(false),
                )}
              >
                <option value="">Все разделы</option>
                {AUDIT_ENTITIES.map((value) => (
                  <option key={value} value={value}>
                    {AUDIT_ENTITY_LABEL[value]}
                  </option>
                ))}
              </select>
            </span>
            <span className="w-[220px]">
              <select
                name="actorId"
                defaultValue={actorId ?? ""}
                aria-label="Кто"
                className={cn(
                  fieldBase,
                  "h-9 w-auto cursor-pointer pr-8",
                  fieldBorder(false),
                )}
              >
                <option value="">Все администраторы</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </span>
            {entityId ? (
              <Link
                href={`/admin/audit${entity ? `?entity=${entity}` : ""}`}
                prefetch={false}
                className="text-[12.5px] text-text-2 hover:text-accent"
              >
                Показана история одной записи — сбросить
              </Link>
            ) : null}
          </ListFilters>

          {data.length === 0 ? (
            <EmptyState
              message={filtered ? "Ничего не найдено" : "Журнал пуст"}
              hint={
                filtered
                  ? "Попробуйте изменить фильтры."
                  : "Здесь появится каждое изменение каталога, заявок, файлов и доступа."
              }
            />
          ) : (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th>Когда</Th>
                    <Th>Кто</Th>
                    <Th>Что сделал</Th>
                    <Th>Изменения</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((entry) => (
                    <AuditRow
                      key={entry.id}
                      entry={entry}
                      userNames={userNames}
                    />
                  ))}
                </tbody>
              </Table>

              <Pagination
                basePath="/admin/audit"
                params={filters}
                meta={meta}
              />
            </>
          )}
        </Panel>
      </div>
    </>
  );
}

function AuditRow({
  entry,
  userNames,
}: {
  entry: AuditEntry;
  userNames: ReadonlyMap<string, string>;
}) {
  const title = entityTitle(entry.before, entry.after);
  const href = entityHref(entry.entity, entry.entityId, entry.action);
  const changes = auditChanges(entry.before, entry.after, userNames);
  const shown = changes.slice(0, VISIBLE_CHANGES);
  const rest = changes.slice(VISIBLE_CHANGES);

  return (
    <Tr>
      <Td className="whitespace-nowrap text-text-2">
        {formatDateTime(entry.createdAt)}
      </Td>
      <Td>
        {entry.actor ? (
          <>
            <span className="font-medium">{entry.actor.name}</span>
            <span className="mt-0.5 block text-[12px] text-text-2">
              {entry.actor.email}
            </span>
          </>
        ) : (
          <span className="text-text-2">
            система или удалённый администратор
          </span>
        )}
      </Td>
      <Td>
        <span className={cn(isDestructive(entry.action) && "text-red-700")}>
          {actionLabel(entry.action)}
        </span>
        {title ? (
          <span className="mt-0.5 block">
            {href ? (
              <Link
                href={href}
                prefetch={false}
                className="font-medium hover:text-accent"
              >
                {title}
              </Link>
            ) : (
              <span className="font-medium">{title}</span>
            )}
          </span>
        ) : null}
        {entry.entityId ? (
          <Link
            href={`/admin/audit?entity=${entry.entity}&entityId=${encodeURIComponent(entry.entityId)}`}
            prefetch={false}
            className="mt-1 inline-block text-[11.5px] text-text-2 hover:text-accent"
          >
            история записи
          </Link>
        ) : null}
      </Td>
      <Td className="max-w-[420px] text-[12.5px]">
        {changes.length === 0 ? (
          <span className="text-text-2">—</span>
        ) : (
          <>
            <ChangeList changes={shown} />
            {rest.length > 0 ? (
              <details className="mt-1">
                <summary className="cursor-pointer text-text-2 hover:text-accent">
                  ещё {rest.length}
                </summary>
                <ChangeList changes={rest} />
              </details>
            ) : null}
          </>
        )}
      </Td>
    </Tr>
  );
}

function ChangeList({ changes }: { changes: ReturnType<typeof auditChanges> }) {
  return (
    <ul className="space-y-0.5">
      {changes.map((change) => (
        <li key={change.field} className="break-words">
          <span className="text-text-2">{change.field}: </span>
          {change.before !== undefined && change.after !== undefined ? (
            <>
              <span className="text-text-2 line-through">{change.before}</span>{" "}
              → {change.after}
            </>
          ) : (
            (change.after ?? change.before)
          )}
        </li>
      ))}
    </ul>
  );
}
