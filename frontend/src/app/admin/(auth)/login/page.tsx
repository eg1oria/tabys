import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { safeNext } from "@/lib/admin/form-state";

/**
 * Страница читает данные под авторизацией на каждый запрос: кешировать
 * их нечем, мгновенной навигация быть не может. Проверка instant
 * выключена осознанно (см. комментарий в src/app/admin/layout.tsx).
 */
export const instant = false;

export const metadata: Metadata = { title: "Вход" };

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const params = await searchParams;
  const next = safeNext(params.next, "/admin");
  const expired = params.expired === "1";

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-[380px]">
        <div className="text-center">
          <span className="block font-display text-[22px] font-extrabold tracking-[0.02em] text-ink">
            TABYS
          </span>
          <span className="mt-1 block font-display text-[10px] font-semibold tracking-[0.42em] text-text-2">
            CONSULTING
          </span>
        </div>

        <div className="mt-8 rounded-card border border-line bg-white p-7">
          <h1 className="display-title text-[1.05rem]">Вход в админку</h1>
          <p className="mt-2 text-[12.5px] leading-relaxed text-text-2">
            Управление каталогом и заявками с сайта.
          </p>

          <LoginForm next={next} expired={expired} />
        </div>
      </div>
    </div>
  );
}
