import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="max-w-md text-center">
        <p className="display-title text-[2.5rem] text-accent">404</p>
        <h1 className="display-title mt-3 text-[1.1rem]">Запись не найдена</h1>
        <p className="mt-3 text-[13px] leading-relaxed text-text-2">
          Возможно, её удалили, или ссылка устарела.
        </p>
        <Link
          href="/admin/leads"
          prefetch={false}
          className="mt-6 inline-flex h-10 items-center rounded-card bg-accent px-5 text-[13px] font-medium text-white transition-colors hover:bg-accent-strong"
        >
          К заявкам
        </Link>
      </div>
    </div>
  );
}
