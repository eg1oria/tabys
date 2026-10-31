"use client";

import { useState } from "react";
import { ImageSlot } from "@/components/ui/image-slot";
import type { PublicImage } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/** Главное фото и превью под ним. Без фото — та же заглушка, что в сетке. */
export function ProductGallery({ images, title }: { images: PublicImage[]; title: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index];

  return (
    <div>
      <ImageSlot
        src={current?.url}
        alt={current?.alt || title}
        label={title}
        blurDataUrl={current?.blurDataUrl}
        className="aspect-[4/3] w-full rounded-card"
        sizes="(max-width: 1024px) 100vw, 50vw"
        priority
      />

      {images.length > 1 ? (
        <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {images.map((image, i) => (
            <li key={image.url}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Фото ${i + 1} из ${images.length}`}
                aria-current={i === index ? "true" : undefined}
                className={cn(
                  "block w-full overflow-hidden rounded-card border-2 transition-colors",
                  i === index ? "border-accent" : "border-transparent hover:border-line",
                )}
              >
                <ImageSlot
                  src={image.url}
                  alt=""
                  blurDataUrl={image.blurDataUrl}
                  className="aspect-square w-full"
                  sizes="120px"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
