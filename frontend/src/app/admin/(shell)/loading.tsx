/**
 * Экраны админки блокируются на сервере (instant = false), поэтому между
 * кликом и ответом видна эта заглушка, а не пустая страница.
 */
export default function AdminLoading() {
  return (
    <div className="p-5 lg:p-8">
      <div className="h-6 w-40 rounded bg-line/60" />
      <div className="mt-6 space-y-3 rounded-card border border-line bg-white p-5">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="h-9 rounded bg-muted" />
        ))}
      </div>
      <span className="sr-only">Загружаем данные</span>
    </div>
  );
}
