import { Dots } from "@/components/ui/icons";

/**
 * Меню строки таблицы на <details>: раскрытие умеет браузер, состояние
 * не нужно. Внутри — обычные формы действий, поэтому строка остаётся
 * узкой, а не растягивается кнопками на половину таблицы.
 */
export function RowMenu({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="relative">
      <summary
        aria-label={label}
        title={label}
        className="grid size-8 cursor-pointer list-none place-items-center rounded-card border border-line text-text-2 transition-colors hover:border-ink hover:text-ink"
      >
        <Dots className="size-4" />
      </summary>
      <div className="absolute right-0 z-10 mt-1.5 flex w-52 flex-col items-stretch gap-1 rounded-card border border-line bg-white p-1.5 text-left shadow-lg">
        {children}
      </div>
    </details>
  );
}
