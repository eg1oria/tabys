"use client";

import { useActionState, useState } from "react";
import { Field, FieldError, FormError, TextInput } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { ChevronDown, ChevronUp, Plus, Trash } from "@/components/ui/icons";
import { Panel } from "./page-header";
import { SubmitButton } from "./submit-button";
import { saveContacts } from "@/lib/admin/contacts-actions";
import {
  FORM_ERROR,
  initialFormState,
  list,
  str,
  type FormState,
} from "@/lib/admin/form-state";
import type { Contacts } from "@/lib/api/types";

type PhoneRow = { id: number; label: string; phone: string };

let nextRowId = 0;

function row(label = "", phone = ""): PhoneRow {
  return { id: nextRowId++, label, phone };
}

/**
 * Телефоны по порядку: первый — главный, он в шапке и на страницах товаров.
 * После неудачного сохранения форма перемонтируется и передаёт сюда
 * отправленные строки — как редактор характеристик товара.
 */
function PhonesEditor({ initial, error }: { initial: PhoneRow[]; error?: string }) {
  const [rows, setRows] = useState<PhoneRow[]>(() => (initial.length > 0 ? initial : [row()]));

  function update(id: number, patch: Partial<PhoneRow>) {
    setRows((cur) => cur.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function move(index: number, delta: -1 | 1) {
    setRows((cur) => {
      const target = index + delta;
      if (target < 0 || target >= cur.length) return cur;
      const next = [...cur];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <div className="space-y-2">
      {rows.map((item, index) => (
        <div key={item.id} className="flex items-start gap-2">
          <span className="min-w-0 flex-[2]">
            <TextInput
              name="phoneNumber"
              value={item.phone}
              onChange={(e) => update(item.id, { phone: e.target.value })}
              placeholder="+7 (700) 000-00-00"
              inputMode="tel"
              maxLength={50}
              aria-label={`Телефон ${index + 1}: номер`}
              error={error}
            />
          </span>
          <span className="min-w-0 flex-[1.5]">
            <TextInput
              name="phoneLabel"
              value={item.label}
              onChange={(e) => update(item.id, { label: e.target.value })}
              placeholder="Дмитрий"
              maxLength={60}
              aria-label={`Телефон ${index + 1}: подпись`}
              error={error}
            />
          </span>
          <IconButton
            label={`Поднять телефон ${index + 1}`}
            className="mt-1"
            disabled={index === 0}
            onClick={() => move(index, -1)}
          >
            <ChevronUp className="size-4" />
          </IconButton>
          <IconButton
            label={`Опустить телефон ${index + 1}`}
            className="mt-1"
            disabled={index === rows.length - 1}
            onClick={() => move(index, 1)}
          >
            <ChevronDown className="size-4" />
          </IconButton>
          <IconButton
            label={`Удалить телефон ${index + 1}`}
            tone="danger"
            className="mt-1"
            disabled={rows.length === 1}
            onClick={() => setRows((cur) => cur.filter((other) => other.id !== item.id))}
          >
            <Trash className="size-4" />
          </IconButton>
        </div>
      ))}
      <FieldError message={error} />
      {rows.length < 6 ? (
        <button
          type="button"
          onClick={() => setRows((cur) => [...cur, row()])}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-accent hover:underline"
        >
          <Plus className="size-4" />
          Добавить телефон
        </button>
      ) : null}
    </div>
  );
}

type Values = FormState["values"];

/** Повторяющееся поле: одно значение приходит строкой, несколько — массивом. */
function all(values: Values, name: string): string[] | undefined {
  const one = str(values, name);
  return list(values, name) ?? (one === undefined ? undefined : [one]);
}

/** Отправленные строки телефонов — чтобы ошибка не стирала ввод. */
function submittedPhones(values: Values): PhoneRow[] | undefined {
  const numbers = all(values, "phoneNumber");
  if (numbers === undefined) return undefined;
  const labels = all(values, "phoneLabel") ?? [];
  return numbers.map((phone, index) => row(labels[index] ?? "", phone));
}

export function ContactsForm({ contacts }: { contacts: Contacts }) {
  const [state, formAction] = useActionState(saveContacts, initialFormState);
  const errors = state.errors;
  const value = (name: keyof Contacts) =>
    str(state.values, name) ?? (contacts[name] as string | null) ?? "";

  const phones =
    submittedPhones(state.values) ??
    contacts.phones.map((phone) => row(phone.label, phone.display));

  return (
    <form key={state.submissionId ?? 0} action={formAction} noValidate className="space-y-5">
      <FormError message={errors[FORM_ERROR]} />

      <Panel title="Адрес">
        <div className="space-y-4 px-5 py-4">
          <Field
            label="Полный адрес"
            htmlFor="address"
            error={errors.address}
            hint="В подвале сайта, на странице «Контакты» и в политике конфиденциальности."
            required
          >
            <TextInput
              id="address"
              name="address"
              defaultValue={value("address")}
              error={errors.address}
              maxLength={300}
            />
          </Field>
          <Field
            label="Короткий адрес"
            htmlFor="addressShort"
            error={errors.addressShort}
            hint="На карточке карты и в подсказке, как добраться."
            required
          >
            <TextInput
              id="addressShort"
              name="addressShort"
              defaultValue={value("addressShort")}
              error={errors.addressShort}
              maxLength={150}
            />
          </Field>
          <Field
            label="Ссылка «Построить маршрут»"
            htmlFor="mapUrl"
            error={errors.mapUrl}
            hint="Откройте адрес в 2ГИС или Яндекс Картах и скопируйте ссылку из адресной строки."
            required
          >
            <TextInput
              id="mapUrl"
              name="mapUrl"
              type="url"
              defaultValue={value("mapUrl")}
              error={errors.mapUrl}
              maxLength={1000}
            />
          </Field>
        </div>
      </Panel>

      <Panel title="Телефоны и почта">
        <div className="space-y-4 px-5 py-4">
          <div>
            <p className="mb-1.5 text-[12.5px] font-medium">
              Телефоны<span className="ml-1 text-accent">*</span>
            </p>
            <p className="mb-3 text-[12px] text-text-2">
              Первый — главный: он в шапке, в подвале и на страницах товаров. Остальные — на
              странице «Контакты» и в мобильном меню.
            </p>
            <PhonesEditor initial={phones} error={errors.phones} />
          </div>
          <Field label="Email" htmlFor="email" error={errors.email} required>
            <TextInput
              id="email"
              name="email"
              type="email"
              defaultValue={value("email")}
              error={errors.email}
              maxLength={200}
            />
          </Field>
        </div>
      </Panel>

      <Panel title="Мессенджеры и соцсети">
        <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
          <p className="text-[12px] text-text-2 sm:col-span-2">
            Полные ссылки. Пустое поле — значок на сайте не показывается.
          </p>
          {(
            [
              ["whatsapp", "WhatsApp", "https://wa.me/77072671237"],
              ["telegram", "Telegram", "https://t.me/…"],
              ["instagram", "Instagram", "https://instagram.com/…"],
              ["youtube", "YouTube", "https://youtube.com/@…"],
            ] as const
          ).map(([name, label, placeholder]) => (
            <Field key={name} label={label} htmlFor={name} error={errors[name]}>
              <TextInput
                id={name}
                name={name}
                type="url"
                defaultValue={value(name)}
                error={errors[name]}
                placeholder={placeholder}
                maxLength={500}
              />
            </Field>
          ))}
        </div>
      </Panel>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton>Сохранить</SubmitButton>
        {state.status === "success" ? (
          <span className="text-[12.5px] text-emerald-700">
            Сохранено — на сайте уже новые контакты
          </span>
        ) : null}
        <a
          href="/kontakty"
          target="_blank"
          rel="noreferrer"
          className="text-[12.5px] text-text-2 hover:text-ink"
        >
          Открыть страницу «Контакты» ↗
        </a>
      </div>
    </form>
  );
}
