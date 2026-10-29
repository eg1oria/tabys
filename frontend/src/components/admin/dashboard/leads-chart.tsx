import { dayLabel, plural } from "./chart-utils";

type Point = { date: string; count: number };

const W = 760;
const H = 230;
const PAD = { top: 16, right: 16, bottom: 26, left: 34 };

/**
 * График заявок по дням — рукописный SVG.
 *
 * Библиотеку не берём осознанно: все они клиентские, а это добавило бы
 * четвёртую зависимость рантайма и выключило серверный рендер целого
 * экрана ради сорока строк разметки. Подсказка при наведении — на CSS,
 * без состояния.
 */
export function LeadsChart({ series }: { series: Point[] }) {
  if (series.length === 0) {
    return <p className="px-5 py-14 text-center text-[13px] text-text-2">Нет данных за период</p>;
  }

  const max = Math.max(1, ...series.map((point) => point.count));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const stepX = series.length > 1 ? innerW / (series.length - 1) : 0;

  const x = (i: number) => PAD.left + (series.length > 1 ? i * stepX : innerW / 2);
  const y = (value: number) => PAD.top + innerH - (value / max) * innerH;

  const line = series.map((point, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(point.count)}`).join(" ");
  const area = `${line} L${x(series.length - 1)},${PAD.top + innerH} L${x(0)},${PAD.top + innerH} Z`;

  // Подписи оси X: показываем примерно шесть, иначе они сливаются.
  const labelEvery = Math.max(1, Math.ceil(series.length / 6));
  const ticks = [0, Math.round(max / 2), max].filter((value, i, all) => all.indexOf(value) === i);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Заявки по дням: всего ${series.reduce((sum, p) => sum + p.count, 0)}`}
    >
      <defs>
        <linearGradient id="leads-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {ticks.map((value) => (
        <g key={value}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(value)}
            y2={y(value)}
            stroke="var(--color-line)"
            strokeDasharray={value === 0 ? undefined : "3 4"}
          />
          <text
            x={PAD.left - 8}
            y={y(value) + 4}
            textAnchor="end"
            className="fill-[var(--color-text-2)] text-[10px]"
          >
            {value}
          </text>
        </g>
      ))}

      <path d={area} fill="url(#leads-area)" />
      <path
        d={line}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {series.map((point, i) => (
        <g key={point.date} className="group">
          {/* Широкая прозрачная зона — чтобы попадать мышью и табом. */}
          <rect
            x={x(i) - Math.max(6, stepX / 2)}
            y={PAD.top}
            width={Math.max(12, stepX)}
            height={innerH}
            fill="transparent"
            tabIndex={0}
            role="presentation"
          >
            <title>{`${dayLabel(point.date)}: ${point.count} ${plural(point.count, ["заявка", "заявки", "заявок"])}`}</title>
          </rect>
          <circle
            cx={x(i)}
            cy={y(point.count)}
            r="3.5"
            fill="var(--color-surface)"
            stroke="var(--color-accent)"
            strokeWidth="2"
            className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
          />
          <g className="pointer-events-none opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <rect
              x={Math.min(Math.max(x(i) - 54, 0), W - 108)}
              y={Math.max(y(point.count) - 46, 0)}
              width="108"
              height="36"
              rx="4"
              fill="var(--color-ink)"
            />
            <text
              x={Math.min(Math.max(x(i), 54), W - 54)}
              y={Math.max(y(point.count) - 46, 0) + 15}
              textAnchor="middle"
              className="fill-white text-[10px]"
            >
              {dayLabel(point.date)}
            </text>
            <text
              x={Math.min(Math.max(x(i), 54), W - 54)}
              y={Math.max(y(point.count) - 46, 0) + 29}
              textAnchor="middle"
              className="fill-white text-[11px] font-semibold"
            >
              {point.count} {plural(point.count, ["заявка", "заявки", "заявок"])}
            </text>
          </g>
        </g>
      ))}

      {series.map((point, i) =>
        i % labelEvery === 0 || i === series.length - 1 ? (
          <text
            key={`label-${point.date}`}
            x={x(i)}
            y={H - 8}
            textAnchor={i === 0 ? "start" : i === series.length - 1 ? "end" : "middle"}
            className="fill-[var(--color-text-2)] text-[10px]"
          >
            {dayLabel(point.date)}
          </text>
        ) : null,
      )}
    </svg>
  );
}
