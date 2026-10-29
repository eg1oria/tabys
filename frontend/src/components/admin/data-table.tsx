import { cn } from "@/lib/utils";

/**
 * Только оформление таблицы: разметку строк пишет каждый список сам.
 * Универсальная таблица с конфигом колонок здесь обошлась бы дороже,
 * чем шесть разных <tbody>.
 */
export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left">{children}</table>
    </div>
  );
}

export function Th({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "section-label border-b border-line px-4 py-2.5 font-semibold whitespace-nowrap",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  className,
  children,
  colSpan,
}: {
  className?: string;
  children?: React.ReactNode;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn("border-b border-line px-4 py-3 align-top text-[13px]", className)}
    >
      {children}
    </td>
  );
}

export function Tr({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <tr className={cn("transition-colors hover:bg-muted/60", className)}>{children}</tr>;
}
