import { Search } from "@/components/ui/icons";
import { fieldBase, fieldBorder } from "@/components/ui/field";
import { cn } from "@/lib/utils";

/**
 * Фильтры списков — нативная GET-форма. Отправка меняет адрес, страница
 * перечитывается на сервере: ни клиентского состояния, ни useSearchParams,
 * ни <Suspense> вокруг списка.
 */
export function ListFilters({
  action,
  searchName = "q",
  searchValue,
  searchPlaceholder = "Поиск",
  hidden,
  children,
}: {
  action: string;
  searchName?: string;
  searchValue?: string;
  searchPlaceholder?: string;
  /** Параметры, которые форма обязана сохранить (вид, сортировка, категория). */
  hidden?: Record<string, string | undefined>;
  children?: React.ReactNode;
}) {
  return (
    <form
      action={action}
      method="get"
      className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3"
    >
      {Object.entries(hidden ?? {}).map(([name, value]) =>
        value ? <input key={name} type="hidden" name={name} value={value} /> : null,
      )}
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-2" />
        <input
          type="search"
          name={searchName}
          defaultValue={searchValue ?? ""}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          maxLength={100}
          className={cn(fieldBase, "h-9 pl-9", fieldBorder(false))}
        />
      </div>

      {children}

      <button
        type="submit"
        className="inline-flex h-9 items-center rounded-card border border-line bg-white px-4 text-[12.5px] font-medium transition-colors hover:border-ink hover:bg-muted"
      >
        Применить
      </button>
    </form>
  );
}
