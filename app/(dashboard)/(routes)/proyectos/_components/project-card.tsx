"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Project } from "@/lib/projects";

type ProjectCardProps = {
  project: Project;
  number: number;
  active: boolean;
  onClose: () => void;
};

/**
 * Card de un proyecto dentro del recorrido: carrusel de fotos, lugar y año,
 * título, descripción corta y botón "Ver más".
 */
export const ProjectCard = ({
  project,
  number,
  active,
  onClose,
}: ProjectCardProps) => {
  const [slide, setSlide] = useState(0);
  const images = project.images;
  const hasManyImages = images.length > 1;

  const prevSlide = () =>
    setSlide((s) => (s - 1 + images.length) % images.length);
  const nextSlide = () => setSlide((s) => (s + 1) % images.length);

  return (
    <article
      className={`story-card pointer-events-auto w-full max-h-full overflow-y-auto overscroll-contain md:max-h-none md:overflow-visible rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xl transition-all duration-500 ${
        active ? "opacity-100" : "md:opacity-50 md:scale-[0.97]"
      }`}
      aria-label={project.title}
      aria-current={active ? "true" : undefined}
    >
      {/* Carrusel */}
      <div className="relative h-36 md:h-[min(15rem,32vh)] shrink-0 overflow-hidden rounded-xl bg-stone-100">
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

        <button
          type="button"
          onClick={onClose}
          className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-white/90 text-slate-700 shadow-sm flex items-center justify-center hover:bg-white transition"
          aria-label="Ocultar tarjetas"
        >
          <X className="h-4 w-4" />
        </button>

        {hasManyImages && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 text-slate-700 shadow-sm flex items-center justify-center hover:bg-white transition"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-white/90 text-slate-700 shadow-sm flex items-center justify-center hover:bg-white transition"
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

      {/* Contenido */}
      <div className="flex flex-col gap-2.5 px-2 pt-4 pb-2 md:px-3">
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-600 text-xs font-semibold text-white">
            {number}
          </span>
          {project.place} · {project.year}
        </p>
        <h2 className="text-xl md:text-2xl font-semibold leading-snug text-slate-900">
          {project.title}
        </h2>
        <p className="text-sm md:text-[15px] leading-relaxed text-slate-600">
          {project.description}
        </p>

        <Link
          href={project.href}
          className="mt-1 inline-flex w-fit items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
        >
          {project.publication ? (
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
      </div>
    </article>
  );
};
