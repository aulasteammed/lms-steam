"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import type { ProjectImage } from "@/lib/projects";

const roundButton =
  "flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

/**
 * Fotos del proyecto: juntas y pequeñas. Al tocar una se abre completa sobre
 * la misma página, con el resto oscurecido; se cierra con la X, con Escape o
 * tocando fuera de la foto.
 */
export const PhotoGallery = ({ images }: { images: ProjectImage[] }) => {
  /** Posición de la foto abierta; `null` = ninguna. */
  const [open, setOpen] = useState<number | null>(null);
  const current = open === null ? null : images[open];
  const step = (delta: number) =>
    setOpen((index) => (index === null ? null : (index + delta + images.length) % images.length));

  return (
    <section aria-label="Fotos del proyecto">
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {images.map((image, index) => (
          <figure key={image.src} className="min-w-0">
            <button
              type="button"
              onClick={() => setOpen(index)}
              aria-label={`Ampliar foto: ${image.alt}`}
              className="block w-full cursor-zoom-in overflow-hidden rounded-xl border border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
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
            <figcaption className="mt-1.5 text-xs leading-snug text-slate-600">
              {image.alt}
              {image.credit && <span className="text-slate-400"> · {image.credit}</span>}
            </figcaption>
          </figure>
        ))}
      </div>

      <Dialog.Root open={current !== null} onOpenChange={(isOpen) => !isOpen && setOpen(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/85 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content
            aria-describedby={undefined}
            onKeyDown={(event) => {
              if (images.length < 2) return;
              if (event.key === "ArrowRight") step(1);
              if (event.key === "ArrowLeft") step(-1);
            }}
            // Tocar el fondo oscuro (fuera de la foto) también cierra.
            onClick={(event) => event.target === event.currentTarget && setOpen(null)}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 p-4 focus:outline-none md:p-10"
          >
            <Dialog.Title className="sr-only">{current?.alt ?? "Foto del proyecto"}</Dialog.Title>
            <Dialog.Close aria-label="Cerrar" className={`absolute right-4 top-4 ${roundButton}`}>
              <X className="h-5 w-5" />
            </Dialog.Close>

            {current && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={current.src}
                  alt={current.alt}
                  className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-2xl"
                />
                <p className="max-w-2xl text-center text-sm text-white/85">
                  {current.alt}
                  {current.credit && <span className="text-white/60"> · {current.credit}</span>}
                </p>
              </>
            )}

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Foto anterior"
                  onClick={() => step(-1)}
                  className={`absolute left-3 top-1/2 -translate-y-1/2 md:left-6 ${roundButton}`}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Foto siguiente"
                  onClick={() => step(1)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 md:right-6 ${roundButton}`}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
};
