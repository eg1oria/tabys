"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { Field, FormError, TextInput } from "@/components/ui/field";
import { ExternalLink, Trash } from "@/components/ui/icons";
import { IconButton } from "@/components/ui/icon-button";
import { SubmitButton } from "./submit-button";
import {
  checkTelegramLink,
  createTelegramLink,
  removeTelegramBot,
  removeTelegramChat,
  sendTelegramTest,
  setTelegramToken,
} from "@/lib/admin/notification-actions";
import { FORM_ERROR, initialFormState, str } from "@/lib/admin/form-state";
import type { TelegramLink } from "@/lib/api/types";

const POLL_MS = 3000;

export function BotTokenForm({ replacing = false }: { replacing?: boolean }) {
  const [state, formAction] = useActionState(setTelegramToken, initialFormState);

  return (
    <form key={state.submissionId} action={formAction} noValidate className="space-y-3">
      <Field
        label={replacing ? "Новый токен бота" : "Токен бота"}
        htmlFor="token"
        error={state.errors.token}
        hint={
          replacing
            ? "Если это другой бот, подключённые чаты отключатся: менеджерам придётся подключиться заново."
            : "Выглядит как 123456789:AAH… — его выдаёт @BotFather."
        }
      >
        <TextInput
          id="token"
          name="token"
          defaultValue={str(state.values, "token")}
          autoComplete="off"
          spellCheck={false}
          error={state.errors.token}
        />
      </Field>
      <SubmitButton pendingLabel="Проверяем…">
        {replacing ? "Заменить токен" : "Подключить бота"}
      </SubmitButton>
    </form>
  );
}

export function RemoveBotButton() {
  const [state, formAction] = useActionState(removeTelegramBot, initialFormState);
  const [confirming, setConfirming] = useState(false);

  return (
    <form action={formAction} className="space-y-2">
      <FormError message={state.errors[FORM_ERROR]} />
      {confirming ? (
        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton variant="outline" pendingLabel="Отключаем…">
            Отключить бота и все чаты
          </SubmitButton>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-[12.5px] text-text-2 hover:text-ink"
          >
            Отмена
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="text-[12.5px] text-red-600 hover:text-red-700"
        >
          Отключить бота
        </button>
      )}
    </form>
  );
}

/**
 * Подключение своего чата: ссылка с одноразовым кодом и опрос, пока
 * человек не нажмёт в Telegram «Start». Ссылку показываем, а не открываем
 * сами: window.open после await браузеры блокируют как всплывающее окно.
 */
export function ConnectChat() {
  const router = useRouter();
  const [link, setLink] = useState<TelegramLink | null>(null);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function start() {
    setPending(true);
    setError(undefined);
    setDone(false);
    const result = await createTelegramLink();
    setPending(false);
    if ("error" in result) setError(result.error);
    else setLink(result);
  }

  useEffect(() => {
    if (!link) return;
    let stopped = false;

    const timer = setInterval(async () => {
      if (Date.now() > new Date(link.expiresAt).getTime()) {
        clearInterval(timer);
        setLink(null);
        setError("Ссылка устарела — получите новую.");
        return;
      }
      const result = await checkTelegramLink(link.code);
      if (stopped) return;
      if ("error" in result) {
        setError(result.error);
        return;
      }
      if (result.connected || result.expired) {
        clearInterval(timer);
        setLink(null);
        setDone(result.connected);
        // Код мог погасить параллельный опрос — список чатов всё равно
        // перечитываем: он покажет, что подключилось.
        router.refresh();
      }
    }, POLL_MS);

    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [link, router]);

  return (
    <div className="space-y-3">
      <FormError message={error} />
      {done ? (
        <p
          role="status"
          className="rounded-card border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-[12.5px] text-emerald-700"
        >
          Чат подключён — в него пришло подтверждение от бота.
        </p>
      ) : null}

      {link ? (
        <div className="space-y-3 rounded-card border border-line bg-muted px-4 py-3.5">
          <p className="text-[12.5px] leading-relaxed">
            Откройте бота и нажмите <b>«Start»</b> («Запустить»). Страница сама увидит,
            что чат подключён.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-card bg-accent px-5 text-[13px] font-medium text-white hover:bg-accent-strong"
            >
              Открыть Telegram
              <ExternalLink className="size-4" />
            </a>
            <a
              href={link.groupUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[12.5px] text-text-2 underline-offset-2 hover:text-ink hover:underline"
            >
              или добавить бота в группу
            </a>
          </div>
          <p className="text-[12px] text-text-2" aria-live="polite">
            Ждём нажатия «Start»… Ссылка действует 10 минут.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={start}
          disabled={pending}
          className="inline-flex h-10 items-center justify-center rounded-card border border-line bg-white px-5 text-[13px] font-medium text-ink transition-colors hover:border-ink hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Готовим ссылку…" : "Подключить мой Telegram"}
        </button>
      )}
    </div>
  );
}

export function RemoveChatButton({ id, title }: { id: string; title: string }) {
  const [state, formAction] = useActionState(removeTelegramChat, initialFormState);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      {state.errors[FORM_ERROR] ? (
        <span className="text-[12px] text-red-600">{state.errors[FORM_ERROR]}</span>
      ) : null}
      <IconButton label={`Отключить ${title}`} tone="danger" type="submit">
        <Trash className="size-4" />
      </IconButton>
    </form>
  );
}

export function TestMessageButton() {
  const [state, formAction] = useActionState(sendTelegramTest, initialFormState);

  return (
    <form action={formAction} className="space-y-2">
      <FormError message={state.errors[FORM_ERROR]} />
      <div className="flex items-center gap-3">
        <SubmitButton variant="outline" pendingLabel="Отправляем…">
          Отправить проверочное сообщение
        </SubmitButton>
        {state.status === "success" ? (
          <span className="text-[12px] text-emerald-600">Отправлено</span>
        ) : null}
      </div>
    </form>
  );
}
