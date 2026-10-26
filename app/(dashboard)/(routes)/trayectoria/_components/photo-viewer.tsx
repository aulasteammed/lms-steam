"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import type { ProjectImage } from "@/lib/projects";

const roundButton =
  "flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

type PhotoViewerProps = {
  images: ProjectImage[];
  /** Posición de la foto abierta; `null` = cerrado. */
  index: number | null;
  onIndexChange: (index: number | null) => void;
  /** Nombre para el lector de pantalla cuando la foto no tiene descripción. */
  title: string;
};

/**
 * Foto completa sobre la página, con el resto oscurecido. Se cierra con la X,
 * con Escape o tocando fuera de la foto; con varias fotos, las flechas pasan
 * de una a otra. Lo usan la galería del proyecto y las cards del mapa.
 */
export const PhotoViewer = ({ images, index, onIndexChange, title }: PhotoViewerProps) => {
  const current = index === null ? null : images[index];
  const step = (delta: number) =>
    index !== null && onIndexChange((index + delta + images.length) % images.length);

  return (
    <Dialog.Root open={current !== null} onOpenChange={(isOpen) => !isOpen && onIndexChange(null)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/85 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          aria-describedby={undefined}
          onKeyDown={(event) => {
            // El mapa también escucha Escape (oculta las cards): cerrar la foto
            // no debe cerrar nada más.
            event.stopPropagation();
            if (images.length < 2) return;
            if (event.key === "ArrowRight") step(1);
            if (event.key === "ArrowLeft") step(-1);
          }}
          // Tocar el fondo oscuro (fuera de la foto) también cierra.
          onClick={(event) => event.target === event.currentTarget && onIndexChange(null)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 p-4 focus:outline-none md:p-10"
        >
          <Dialog.Title className="sr-only">{current?.alt || title}</Dialog.Title>
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
              {(current.alt || current.credit) && (
                <p className="max-w-2xl text-center text-sm text-white/85">
                  {current.alt}
                  {current.credit && (
                    <span className="text-white/60">
                      {current.alt && " · "}
                      {current.credit}
                    </span>
                  )}
                </p>
              )}
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
  );
};
