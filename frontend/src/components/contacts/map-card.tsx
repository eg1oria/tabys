import { company } from "@/lib/content/company";
import { ExternalLink, Pin, Route } from "@/components/ui/icons";

const googleMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  company.address,
)}`;

export function MapCard() {
  return (
    <div className="relative isolate flex min-h-[320px] flex-col justify-between overflow-hidden rounded-card border border-line bg-muted p-6 lg:min-h-[420px] lg:p-8">
      {/* Схематичная «карта»: сетка кварталов вместо случайных координат */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(11,13,15,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(11,13,15,.07) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div
        aria-hidden
        className="absolute -right-24 -top-24 -z-10 size-72 rounded-full bg-accent/10 blur-3xl"
      />

      <div className="inline-flex items-start gap-3 self-start rounded-card bg-white p-4 shadow-sm">
        <Pin className="mt-0.5 size-5 shrink-0 text-accent" />
        <div>
          <p className="font-display text-[13px] font-bold uppercase tracking-[0.04em]">
            Tabys Consulting
          </p>
          <p className="mt-1 text-[13px] text-text-2">{company.addressShort}</p>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <a
          href={company.mapUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex h-11 items-center gap-2.5 rounded-card bg-white px-5 text-[13px] font-medium shadow-sm transition-colors hover:bg-ink hover:text-white"
        >
          <Route className="size-4 text-accent" />
          Построить маршрут
        </a>
        <a
          href={googleMaps}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex h-11 items-center gap-2.5 rounded-card border border-line px-5 text-[13px] font-medium transition-colors hover:border-ink"
        >
          Google Maps
          <ExternalLink className="size-4" />
        </a>
      </div>
    </div>
  );
}
