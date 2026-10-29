import { cn } from "@/lib/utils";
import { AlertCircle } from "./icons";

/**
 * Поля форм админки. Оформление и поведение те же, что в форме заявки
 * (src/components/forms/request-form.tsx): aria-invalid, красная рамка,
 * сообщение под полем.
 */

export const fieldBase =
  "w-full rounded-card border bg-white px-3.5 text-[13.5px] transition-colors placeholder:text-text-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-muted";

export function fieldBorder(hasError?: boolean) {
  return hasError ? "border-red-400" : "border-line focus:border-accent";
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-[12px] text-red-600">{message}</p>;
}

/**
 * Ошибка уровня формы. Нужна всегда: валидация бэкенда возвращает плоский
 * список сообщений без привязки к полям, и без этого блока 400 остался бы
 * невидимым — форма молча «не сохранялась бы».
 */
export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-card border border-red-200 bg-red-50 px-3.5 py-3 text-[12.5px] leading-relaxed text-red-700"
    >
      <AlertCircle className="mt-px size-4 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[12.5px] font-medium">
        {label}
        {required ? <span className="ml-1 text-accent">*</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="mt-1.5 text-[12px] text-text-2">{hint}</p> : null}
      <FieldError message={error} />
    </div>
  );
}

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> & {
  error?: string;
  className?: string;
};

export function TextInput({ error, className, ...rest }: InputProps) {
  return (
    <input
      aria-invalid={Boolean(error)}
      className={cn(fieldBase, "h-10", fieldBorder(Boolean(error)), className)}
      {...rest}
    />
  );
}

type TextareaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> & {
  error?: string;
  className?: string;
};

export function TextArea({ error, className, rows = 4, ...rest }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      aria-invalid={Boolean(error)}
      className={cn(
        fieldBase,
        "resize-y py-2.5 leading-relaxed",
        fieldBorder(Boolean(error)),
        className,
      )}
      {...rest}
    />
  );
}

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "className"> & {
  error?: string;
  className?: string;
};

export function Select({ error, className, children, ...rest }: SelectProps) {
  return (
    <select
      aria-invalid={Boolean(error)}
      className={cn(fieldBase, "h-10 cursor-pointer pr-8", fieldBorder(Boolean(error)), className)}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Checkbox({
  label,
  className,
  ...rest
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "className" | "type"> & {
  label: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-2.5 text-[13px] leading-snug",
        className,
      )}
    >
      <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-accent" {...rest} />
      <span>{label}</span>
    </label>
  );
}
