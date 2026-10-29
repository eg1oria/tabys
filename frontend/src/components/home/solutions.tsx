"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { ImageSlot } from "@/components/ui/image-slot";
import { ArrowLeft, ArrowRight } from "@/components/ui/icons";
import { solutions } from "@/lib/content/solutions";
import { cn } from "@/lib/utils";

export function Solutions() {
  const track = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  // Стрелки гаснут на краях и целиком, когда все карточки влезли в ряд.
  const sync = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft >= max - 1);
  }, []);

  useEffect(() => {
    sync();
    const el = track.current;
    if (!el) return;
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, [sync]);

  const scrollByCard = (direction: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 16 : el.clientWidth;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  return (
    <section className="bg-muted py-16 lg:py-24">
      <Container>
        <div className="mb-10 lg:mb-12">
          <p className="section-label">03 / Решения для отрасли</p>
          <div className="mt-5 gap-10 lg:flex lg:items-end lg:justify-between">
            <h2 className="display-title max-w-2xl text-[clamp(1.5rem,4vw,2.5rem)] leading-[1.08]">
              Решения для
              <br />
              <span className="text-accent">пищевых производств</span>
            </h2>
            <div className="mt-5 flex shrink-0 flex-col gap-4 lg:mt-0 lg:flex-row lg:items-end lg:gap-8">
              <p className="max-w-sm text-[14px] leading-relaxed text-text-2">
                Подбираем и комплектуем оборудование под конкретные технологические
                процессы. Помогаем запустить и масштабировать производство.
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href="/proizvodstvennye-linii"
                  className="group inline-flex items-center gap-2 whitespace-nowrap text-[13px] font-medium text-accent"
                >
                  Все решения
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <div className="flex gap-2">
                  <NavButton
                    label="Предыдущие решения"
                    disabled={atStart}
                    onClick={() => scrollByCard(-1)}
                  >
                    <ArrowLeft className="size-4" />
                  </NavButton>
                  <NavButton
                    label="Следующие решения"
                    accent
                    disabled={atEnd}
                    onClick={() => scrollByCard(1)}
                  >
                    <ArrowRight className="size-4" />
                  </NavButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ul
          ref={track}
          onScroll={sync}
          className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {solutions.map((solution, i) => (
            <li
              key={solution.slug}
              className="w-[72%] shrink-0 snap-start sm:w-[46%] lg:w-[31%] xl:w-[calc((100%-5rem)/6)]"
            >
              <Link
                href="/proizvodstvennye-linii"
                className="group relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-card p-5"
              >
                <ImageSlot
                  src={solution.image}
                  alt={solution.title}
                  label={solution.title}
                  className="absolute inset-0"
                  imageClassName="transition-transform duration-500 group-hover:scale-[1.05]"
                  sizes="(max-width: 640px) 72vw, (max-width: 1280px) 33vw, 17vw"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-b from-ink/75 via-ink/25 to-ink/10"
                />
                <div className="relative">
                  <span className="text-[11px] font-semibold tracking-[0.14em] text-white/70">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 font-display text-[14px] font-bold uppercase leading-[1.3] tracking-[0.01em] text-white">
                    {solution.title}
                  </h3>
                </div>
                <span className="relative grid size-9 place-items-center rounded-full border border-white/70 text-white transition-colors group-hover:border-white group-hover:bg-white group-hover:text-ink">
                  <ArrowRight className="size-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function NavButton({
  label,
  accent,
  disabled,
  onClick,
  children,
}: {
  label: string;
  accent?: boolean;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-grid size-10 place-items-center rounded-full border transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:cursor-not-allowed disabled:opacity-35",
        accent
          ? "border-accent text-accent enabled:hover:bg-accent enabled:hover:text-white"
          : "border-line text-text-2 enabled:hover:border-ink enabled:hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
