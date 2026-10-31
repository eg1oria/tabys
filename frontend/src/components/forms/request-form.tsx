"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Paperclip } from "@/components/ui/icons";
import { FormError } from "@/components/ui/field";
import { submitRequest } from "@/lib/actions/request";
import { initialRequestState } from "@/lib/actions/request-state";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-card border bg-white px-4 text-[14px] transition-colors placeholder:text-text-2 focus:outline-none";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-[12px] text-red-600">{message}</p>;
}

/**
 * defaultMessage — заготовка сообщения, например название товара со страницы
 * товара: заявка сразу приходит с контекстом, посетителю не нужно его писать.
 */
export function RequestForm({ defaultMessage }: { defaultMessage?: string } = {}) {
  const [state, formAction, isPending] = useActionState(submitRequest, initialRequestState);
  const [fileName, setFileName] = useState<string | null>(null);
  const values = state.values;

  // После ошибки форма перемонтируется, и выбранный файл из поля пропадает
  // (браузер не даёт вернуть его программно). Сбрасываем и подпись, иначе
  // она показывала бы файл, которого в форме уже нет. Сброс — при рендере,
  // как в шапке сайта, без лишнего прохода через эффект.
  const [seenSubmission, setSeenSubmission] = useState(state.submissionId);
  if (seenSubmission !== state.submissionId) {
    setSeenSubmission(state.submissionId);
    setFileName(null);
  }
  const formRef = useRef<HTMLFormElement>(null);
  const renderedAtRef = useRef<HTMLInputElement>(null);

  // Момент показа формы: отправка быстрее двух секунд — почти наверняка
  // скрипт. Ставим в эффекте, а не при рендере: Date.now() во время
  // рендера роняет сборку при cacheComponents. Значение пишем прямо в
  // поле, без состояния, чтобы не перерисовывать форму.
  useEffect(() => {
    if (renderedAtRef.current) renderedAtRef.current.value = String(Date.now());
  }, []);

  if (state.status === "success") {
    return (
      <div className="rounded-card border border-line bg-muted p-8 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-accent text-white">
          <Check className="size-6" />
        </span>
        <h3 className="display-title mt-5 text-[1.25rem]">Заявка отправлена</h3>
        <p className="mx-auto mt-3 max-w-sm text-[13.5px] leading-relaxed text-text-2">
          Спасибо! Мы получили вашу заявку и свяжемся с вами в рабочее время.
        </p>
        <button
          type="button"
          onClick={() => {
            formRef.current?.reset();
            setFileName(null);
            window.location.reload();
          }}
          className="mt-6 text-[13px] font-medium text-accent hover:underline"
        >
          Отправить ещё одну заявку
        </button>
      </div>
    );
  }

  const errors = state.errors;

  return (
    <form
      key={state.submissionId ?? 0}
      ref={formRef}
      action={formAction}
      noValidate
      className="space-y-4"
    >
      {/* Ловушка для ботов: людям поле не видно и в табуляцию не попадает.
          Заполненное — верный признак скрипта, бэкенд пометит заявку спамом. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="companyWebsite">Сайт компании</label>
        <input
          id="companyWebsite"
          name="companyWebsite"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <input
        ref={renderedAtRef}
        type="hidden"
        name="renderedAt"
        defaultValue={values?.renderedAt ?? ""}
      />

      <FormError message={errors._form} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="sr-only">
            Ваше имя
          </label>
          <input
            id="name"
            name="name"
            defaultValue={values?.name}
            autoComplete="name"
            placeholder="Ваше имя *"
            aria-invalid={Boolean(errors.name)}
            className={cn(fieldBase, "h-[52px]", errors.name ? "border-red-400" : "border-line focus:border-accent")}
          />
          <FieldError message={errors.name} />
        </div>

        <div>
          <label htmlFor="phone" className="sr-only">
            Номер телефона
          </label>
          <div
            className={cn(
              "flex h-[52px] items-center rounded-card border bg-white pl-4 transition-colors focus-within:border-accent",
              errors.phone ? "border-red-400" : "border-line",
            )}
          >
            <span className="shrink-0 text-[14px] text-text-2">+7</span>
            <input
              id="phone"
              name="phone"
              defaultValue={values?.phone}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(700) 000-00-00 *"
              aria-invalid={Boolean(errors.phone)}
              className="h-full w-full bg-transparent px-3 text-[14px] placeholder:text-text-2 focus:outline-none"
            />
          </div>
          <FieldError message={errors.phone} />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="sr-only">
          Email
        </label>
        <input
          id="email"
          name="email"
          defaultValue={values?.email}
          type="email"
          autoComplete="email"
          placeholder="Email"
          aria-invalid={Boolean(errors.email)}
          className={cn(fieldBase, "h-[52px]", errors.email ? "border-red-400" : "border-line focus:border-accent")}
        />
        <FieldError message={errors.email} />
      </div>

      <div>
        <label htmlFor="message" className="sr-only">
          Сообщение
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          defaultValue={values?.message ?? defaultMessage}
          placeholder="Сообщение&#10;(Опишите задачу, интересующее оборудование или прикрепите ТЗ)"
          aria-invalid={Boolean(errors.message)}
          className={cn(
            fieldBase,
            "resize-y py-3.5 leading-relaxed",
            errors.message ? "border-red-400" : "border-line focus:border-accent",
          )}
        />
        <FieldError message={errors.message} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="attachment"
            className={cn(
              "flex h-[52px] cursor-pointer items-center gap-3 rounded-card border border-dashed bg-white px-4 transition-colors hover:border-accent",
              errors.attachment ? "border-red-400" : "border-line",
            )}
          >
            <Paperclip className="size-4 shrink-0 text-text-2" />
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[13px]">
                {fileName ?? "Прикрепить файл"}
              </span>
              {fileName ? null : (
                <span className="block text-[11px] text-text-2">
                  PDF, DOC, DWG и др. (до 4 МБ)
                </span>
              )}
            </span>
          </label>
          <input
            id="attachment"
            name="attachment"
            type="file"
            className="sr-only"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
          <FieldError
            message={
              errors.attachment ??
              (values?.hadAttachment && !fileName
                ? "Прикрепите файл ещё раз — после ошибки браузер его сбрасывает"
                : undefined)
            }
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="group inline-flex h-[52px] items-center justify-center gap-2.5 whitespace-nowrap rounded-card bg-accent px-6 text-sm font-medium text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Отправляем…" : "Отправить заявку"}
          {isPending ? null : (
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          )}
        </button>
      </div>

      <div>
        <label className="flex cursor-pointer items-start gap-2.5 text-[12.5px] text-text-2">
          <input
            name="consent"
            type="checkbox"
            defaultChecked={values?.consent}
            className="mt-0.5 size-4 shrink-0 accent-accent"
            aria-invalid={Boolean(errors.consent)}
          />
          <span>
            Согласен с{" "}
            <Link href="/politika-konfidencialnosti" className="text-accent hover:underline">
              политикой конфиденциальности
            </Link>
          </span>
        </label>
        <FieldError message={errors.consent} />
      </div>
    </form>
  );
}
