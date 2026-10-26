"use client";

import { memo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  MapPinOff,
} from "lucide-react";
import {
  MODALITY_LABELS,
  formatDate,
  periodLabel,
  type MapEntry,
} from "@/lib/timeline";
import { TYPE_STYLES } from "./entry-type";
import { PhotoViewer } from "./photo-viewer";

type EntryCardProps = {
  entry: MapEntry;
  active: boolean;
};

const label = "text-[11px] font-semibold uppercase tracking-[0.14em] text-editorial-soft";

/**
 * Card de un registro dentro del recorrido. La parte de arriba es igual para
 * los tres tipos (fotos, lugar, título y descripción); no lleva etiqueta de
 * tipo porque el selector del mapa ya dice cuál se está viendo. Debajo:
 * - Proyecto: botón "Ver más" hacia su página.
 * - Participación: fecha, modalidad, por qué se participó y ponente.
 * - Alianza: periodo y lo que se hizo en conjunto.
 * Las participaciones y las alianzas no tienen página propia, así que la card
 * muestra todo lo que hay de ellas.
 *
 * Va con `memo`: al recorrer la columna solo cambia `active` en dos cards
 * (la que sale y la que entra); las demás no se vuelven a dibujar.
 */
export const EntryCard = memo(function EntryCard({ entry, active }: EntryCardProps) {
  const [slide, setSlide] = useState(0);
  /** Foto abierta en grande; `null` = ninguna. */
  const [viewing, setViewing] = useState<number | null>(null);
  const images = entry.images;
  const hasManyImages = images.length > 1;
  const style = TYPE_STYLES[entry.type];

  const prevSlide = () =>
    setSlide((s) => (s - 1 + images.length) % images.length);
  const nextSlide = () => setSlide((s) => (s + 1) % images.length);

  const when =
    entry.type === "participation" && entry.date
      ? formatDate(entry.date)
      : periodLabel(entry);

  return (
    <article
      className={`story-card pointer-events-auto w-full max-h-full overflow-y-auto overscroll-contain md:max-h-none md:overflow-visible rounded-2xl border border-editorial-line bg-white p-3 shadow-xl transition-all duration-500 ${
        active ? "opacity-100" : "md:opacity-50 md:scale-[0.97]"
      }`}
      aria-label={entry.title}
      aria-current={active ? "true" : undefined}
    >
      {/* Carrusel */}
      <div
        className={`relative shrink-0 overflow-hidden rounded-xl bg-editorial-chip ${
          entry.type === "project" ? "h-36 md:h-[min(15rem,32vh)]" : "h-28 md:h-[min(11rem,24vh)]"
        }`}
      >
        {images.map((img, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={img.src + i}
            src={img.src}
            alt={img.alt}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              i === slide ? "opacity-100" : "opacity-0"
            }`}
            loading={i === 0 ? "eager" : "lazy"}
          />
        ))}

        {/* En la card la foto va recortada: tocarla la abre completa. Los demás
            botones de la foto quedan por encima de este. */}
        {images.length > 0 && (
          <button
            type="button"
            onClick={() => setViewing(slide)}
            aria-label="Ver la foto en grande"
            className="absolute inset-0 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-editorial-accent"
          />
        )}

        {entry.publication && (
          <span className="absolute left-2.5 top-2.5 z-10 inline-flex items-center gap-1.5 rounded-full bg-editorial-identity px-2.5 py-1 text-xs font-medium text-white shadow-sm">
            <BookOpen className="h-3.5 w-3.5" />
            Con {entry.publication.kind.toLowerCase()}
          </span>
        )}

        {hasManyImages && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 text-editorial-body shadow-sm flex items-center justify-center hover:bg-white transition"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 text-editorial-body shadow-sm flex items-center justify-center hover:bg-white transition"
              aria-label="Foto siguiente"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 rounded-full bg-black/30 px-2.5 py-1.5 backdrop-blur-sm">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSlide(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === slide ? "w-4 bg-white" : "w-1.5 bg-white/60"
                  }`}
                  aria-label={`Ver foto ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <PhotoViewer
        images={images}
        index={viewing}
        onIndexChange={(index) => {
          setViewing(index);
          // Al cerrar, la card queda en la última foto que se vio en grande.
          if (index !== null) setSlide(index);
        }}
        title={entry.title}
      />

      {/* Contenido */}
      <div className="flex flex-col gap-2.5 px-2 pt-4 pb-2 md:px-3">
        <p className="flex items-center gap-2 text-sm text-editorial-soft">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} />
          <span>
            {entry.place} · {when}
            {entry.modality && ` · ${MODALITY_LABELS[entry.modality]}`}
          </span>
        </p>
        <h2 className="text-xl md:text-2xl font-semibold leading-snug text-editorial-ink">
          {entry.title}
        </h2>
        <p className="text-sm md:text-[15px] leading-relaxed text-editorial-soft">
          {entry.description}
        </p>

        {entry.places.length === 0 && (
          <p className="flex items-center gap-1.5 text-xs text-editorial-soft">
            <MapPinOff className="h-3.5 w-3.5" />
            Sin punto en el mapa
          </p>
        )}

        {(entry.reason || entry.speaker || entry.organizer || entry.partners) && (
          <dl className="mt-1 space-y-3 border-t border-editorial-line pt-3">
            {entry.organizer && (
              <div>
                <dt className={label}>Organiza</dt>
                <dd className="mt-1 text-sm text-editorial-body">{entry.organizer}</dd>
              </div>
            )}
            {entry.partners && (
              <div>
                <dt className={label}>Fuimos con</dt>
                <dd className="mt-1 text-sm text-editorial-body">
                  <ul className="space-y-1">
                    {entry.partners.map((partner) => (
                      <li key={partner}>{partner}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
            {entry.reason && (
              <div>
                <dt className={label}>Por qué participamos</dt>
                <dd className="mt-1 text-sm leading-relaxed text-editorial-body">{entry.reason}</dd>
              </div>
            )}
            {entry.speaker && (
              <div>
                <dt className={label}>Ponente</dt>
                <dd className="mt-1 text-sm text-editorial-body">
                  {entry.speaker.name}
                  {entry.speaker.role && (
                    <span className="text-editorial-soft"> · {entry.speaker.role}</span>
                  )}
                </dd>
              </div>
            )}
          </dl>
        )}

        {entry.related.length > 0 && (
          <div className="mt-1 border-t border-editorial-line pt-3">
            <p className={label}>
              {entry.type === "alliance" ? "En conjunto" : "Se presentó"}
            </p>
            <ul className="mt-1.5 space-y-1">
              {entry.related.map((item) => (
                <li key={item.title} className="text-sm">
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-1.5 font-medium text-editorial-ink underline decoration-editorial-rule underline-offset-4 transition hover:text-editorial-cta hover:decoration-editorial-accent"
                    >
                      {item.title}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <span className="text-editorial-body">{item.title}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {entry.href && (
          <Link
            href={entry.href}
            className="mt-1 inline-flex w-fit items-center gap-2 rounded-lg bg-editorial-cta px-4 py-2 text-sm font-medium text-white transition hover:bg-editorial-cta-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-editorial-accent focus-visible:ring-offset-2"
          >
            {entry.publication ? (
              <>
                <BookOpen className="h-4 w-4" />
                Ver más
              </>
            ) : (
              <>
                Ver más
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Link>
        )}
      </div>
    </article>
  );
});
