"use client";

import { useState } from "react";

import type { ProjectImage } from "@/lib/projects";
import { PhotoViewer } from "../../_components/photo-viewer";

/**
 * Fotos del proyecto: juntas y pequeñas. Al tocar una se abre completa sobre
 * la misma página (`PhotoViewer`).
 */
export const PhotoGallery = ({ images }: { images: ProjectImage[] }) => {
  /** Posición de la foto abierta; `null` = ninguna. */
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section aria-label="Fotos del proyecto">
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {images.map((image, index) => (
          <figure key={image.src} className="min-w-0">
            <button
              type="button"
              onClick={() => setOpen(index)}
              aria-label={image.alt ? `Ampliar foto: ${image.alt}` : "Ampliar foto"}
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
            <figcaption className="mt-1.5 text-xs leading-snug text-editorial-soft">
              {image.alt}
              {image.credit && <span className="text-editorial-muted"> · {image.credit}</span>}
            </figcaption>
          </figure>
        ))}
      </div>

      <PhotoViewer images={images} index={open} onIndexChange={setOpen} title="Foto del proyecto" />
    </section>
  );
};
