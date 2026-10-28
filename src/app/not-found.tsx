import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="bg-white py-24 lg:py-32">
      <Container>
        <div className="mx-auto max-w-lg text-center">
          <p className="display-title text-[4rem] text-accent">404</p>
          <h1 className="display-title mt-4 text-[1.75rem] leading-tight sm:text-[2.25rem]">
            Страница не найдена
          </h1>
          <p className="mt-5 text-[14px] leading-relaxed text-text-2">
            Возможно, страница была перемещена или адрес введён с ошибкой.
            Посмотрите каталог оборудования или свяжитесь с нами.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href="/oborudovanie" arrow>
              В каталог
            </Button>
            <Button href="/" variant="outline">
              На главную
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
