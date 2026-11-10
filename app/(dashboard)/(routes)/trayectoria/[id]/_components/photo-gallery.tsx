"use client";

import { useState } from "react";

import type { ProjectImage } from "@/lib/projects";
import { PhotoViewer } from "../../_components/photo-viewer";

/** Sin mayúsculas, tildes ni signos: para comparar dos textos por lo que dicen. */
const plain = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();

/**
 * Fotos del proyecto: juntas y pequeñas. Al tocar una se abre completa sobre
 * la misma página (`PhotoViewer`). El pie de foto no se muestra cuando solo
 * repite el nombre del proyecto (`title`), que ya está en el titular.
 */
export const PhotoGallery = ({ images, title }: { images: ProjectImage[]; title: string }) => {
  /** Posición de la foto abierta; `null` = ninguna. */
  const [open, setOpen] = useState<number | null>(null);
  const repeatsTitle = (alt: string) => plain(alt) === plain(title);

  return (
    <section aria-labelledby="fotos-del-proyecto">
      {/* Título solo para el lector de pantalla: a la vista, las fotos se explican solas. */}
      <h2 id="fotos-del-proyecto" className="sr-only">
        Fotos del proyecto
      </h2>
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {images.map((image, index) => {
          const caption = image.alt && !repeatsTitle(image.alt) ? image.alt : "";
          return (
          <figure key={image.src} className="min-w-0">
            <button
              type="button"
              onClick={() => setOpen(index)}
              aria-label={caption ? `Ampliar foto: ${caption}` : "Ampliar foto"}
              className="block w-full cursor-zoom-in overflow-hidden rounded-xl border border-editorial-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-editorial-accent focus-visible:ring-offset-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.src}
                // La descripción ya va escrita debajo: no se repite para el lector de pantalla.
                alt=""
                loading="lazy"
                className="h-40 w-full object-cover transition duration-300 md:h-52 hover:scale-[1.03]"
              />
            </button>
            {(caption || image.credit) && (
              <figcaption className="mt-1.5 text-xs leading-snug text-editorial-soft">
                {caption}
                {caption && image.credit && " · "}
                {image.credit}
              </figcaption>
            )}
          </figure>
          );
        })}
      </div>

      <PhotoViewer images={images} index={open} onIndexChange={setOpen} title="Foto del proyecto" />
    </section>
  );
};
