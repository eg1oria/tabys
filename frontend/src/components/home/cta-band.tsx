import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ImageSlot } from "@/components/ui/image-slot";
import { WhatsApp } from "@/components/ui/icons";
import { company } from "@/lib/content/company";
import heroDarkPhoto from "@/assets/images/hero-dark.jpg";

export function CtaBand() {
  return (
    <section className="relative isolate overflow-hidden bg-ink text-white">
      <ImageSlot
        src={heroDarkPhoto}
        alt=""
        className="absolute inset-0 -z-10"
        imageClassName="opacity-40"
        sizes="100vw"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/85 to-ink/40"
      />

      <Container className="relative py-16 lg:py-20">
        <div className="lg:flex lg:items-end lg:justify-between lg:gap-12">
          <div className="max-w-xl">
            <h2 className="display-title text-[clamp(1.5rem,4.5vw,2.75rem)] leading-[1.08]">
              Есть задача
              <br />
              для производства?
            </h2>
            <p className="mt-6 text-[14px] leading-relaxed text-white/70">
              Отправьте нам ТЗ или опишите, какое оборудование вам необходимо.
              Мы свяжемся с вами и предложим решение.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 lg:mt-0">
            <Button href="/kontakty" size="lg" arrow>
              Отправить ТЗ
            </Button>
            <a
              href={company.whatsapp}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex h-[52px] items-center gap-2.5 rounded-card border border-white/25 px-7 text-sm font-medium text-white transition-colors hover:border-white/60 hover:bg-white/10"
            >
              Связаться в WhatsApp
              <WhatsApp className="size-[18px]" />
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
