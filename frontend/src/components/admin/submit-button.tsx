"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * Кнопка отправки, которая сама знает про состояние формы.
 * useFormStatus читает ближайшую <form>, поэтому её не нужно прокидывать
 * из useActionState — и кнопка работает одинаково в любой форме.
 */
type Variant = "primary" | "dark" | "outline";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-strong",
  dark: "bg-ink text-white hover:bg-ink-soft",
  outline: "border border-line bg-white text-ink hover:border-ink hover:bg-muted",
};

export function SubmitButton({
  children,
  pendingLabel = "Сохраняем…",
  variant = "primary",
  className,
  ref,
  ...rest
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "type"> & {
  pendingLabel?: string;
  variant?: Variant;
  className?: string;
  ref?: React.Ref<HTMLButtonElement>;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      {...rest}
      ref={ref}
      type="submit"
      // disabled после ...rest: иначе переданный disable={false} затирал бы
      // pending и форму можно было отправить дважды.
      disabled={pending || rest.disabled}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-card px-5 text-[13px] font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
