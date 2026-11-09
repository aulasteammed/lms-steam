"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronRight, Globe, Library } from "lucide-react";
import type { EntryType } from "@/lib/timeline";
import { TYPE_STYLES } from "./entry-type";

export type IntroItem = {
  key: string;
  title: string;
  subtitle?: string;
  onSelect: () => void;
};

type IntroCardProps = {
  type: EntryType;
  /** Línea pequeña sobre el título: cuántos registros y de qué año. */
  eyebrow: string;
  title: string;
  text: string;
  /**
   * Índice de la card: los años (vista completa), los registros del año
   * elegido o los registros que comparten un punto del mapa.
   */
  items: IntroItem[];
  /** Botón principal "Comenzar recorrido". */
  onStart?: () => void;
  /**
   * Botón secundario: "Todos los años" vuelve a la vista completa (`all`);
   * "Volver" sale de un grupo de registros (`back`).
   */
  back?: { label: string; onClick: () => void; kind?: "all" | "back" };
  /**
   * Enlace a la estantería de publicaciones. Solo se ve en celular: en
   * escritorio está entre los botones flotantes del mapa.
   */
  publicationsHref?: string;
};

/** Botones de las cards del recorrido: 44 px de alto en celular para el dedo. */
const primaryButton =
  "inline-flex min-h-11 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 md:min-h-0";
const secondaryButton =
  "inline-flex min-h-11 items-center gap-2 rounded-lg border border-editorial-line bg-white px-4 py-2 text-sm font-medium text-editorial-body transition hover:bg-editorial-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-editorial-accent focus-visible:ring-offset-2 md:min-h-0";

/**
 * Card de portada del recorrido (primera de la columna): título, introducción
 * e índice. En la vista completa el índice son los años; con un año elegido,
 * sus registros. También lista los registros de un punto del mapa que agrupa
 * varios en el mismo lugar.
 */
export const IntroCard = ({
  type,
  eyebrow,
  title,
  text,
  items,
  onStart,
  back,
  publicationsHref,
}: IntroCardProps) => {
  const style = TYPE_STYLES[type];
  const BackIcon = back?.kind === "back" ? ArrowLeft : Globe;

  return (
    <article className="pointer-events-auto w-full max-h-full overflow-y-auto overscroll-contain rounded-2xl border border-editorial-line bg-white p-6 shadow-xl md:max-h-none md:overflow-visible lg:p-8">
      <p className={`text-xs font-semibold uppercase tracking-wider ${style.text}`}>
        {eyebrow}
      </p>
      {/* La columna es angosta en tabletas y celulares acostados: el título se parte con guiones. */}
      <h1 className="mt-2 hyphens-auto break-words text-3xl font-semibold leading-tight text-editorial-ink text-balance lg:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-editorial-soft md:text-[15px]">
        {text}
      </p>

      <ol className="mt-5 divide-y divide-editorial-line border-y border-editorial-line">
        {items.map((item) => (
          <li key={item.key}>
            <button
              type="button"
              onClick={item.onSelect}
              className="group flex min-h-11 w-full items-center gap-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-editorial-accent"
            >
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-editorial-ink transition group-hover:text-editorial-cta">
                  {item.title}
                </span>
                {item.subtitle && (
                  <span className="block truncate text-xs text-editorial-soft">
                    {item.subtitle}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {onStart && (
          <button type="button" onClick={onStart} className={`${primaryButton} ${style.button}`}>
            Comenzar recorrido
            {/* En celular las cards se deslizan de lado; en escritorio, hacia abajo. */}
            <ChevronRight className="h-4 w-4 md:hidden" aria-hidden />
            <ChevronDown className="hidden h-4 w-4 md:block md:motion-safe:animate-bounce" aria-hidden />
          </button>
        )}
        {back && (
          <button type="button" onClick={back.onClick} className={secondaryButton}>
            <BackIcon className="h-4 w-4" aria-hidden />
            {back.label}
          </button>
        )}
        {publicationsHref && (
          <Link href={publicationsHref} className={`${secondaryButton} md:hidden`}>
            <Library className="h-4 w-4" aria-hidden />
            Publicaciones
          </Link>
        )}
      </div>
    </article>
  );
};

type YearEndCardProps = {
  type: EntryType;
  year: number;
  /** "2 proyectos", "1 alianza"… */
  seen: string;
  /** Año anterior con registros del tipo y cuántos tiene; `null` si este es el más antiguo. */
  previous: { year: number; count: string } | null;
  onPrevious: () => void;
  onAll: () => void;
};

/**
 * Última card de un año: el recorrido no termina en seco, sigue con el año
 * anterior (la línea de tiempo va de lo más reciente a lo más antiguo).
 */
export const YearEndCard = ({ type, year, seen, previous, onPrevious, onAll }: YearEndCardProps) => {
  const style = TYPE_STYLES[type];

  return (
    <article className="pointer-events-auto w-full rounded-2xl border border-editorial-line bg-white p-6 shadow-xl lg:p-8">
      <h2 className="text-2xl font-semibold leading-tight text-editorial-ink">Fin de {year}</h2>
      <p className="mt-2 text-sm leading-relaxed text-editorial-soft md:text-[15px]">
        {previous
          ? `Ya viste ${seen} de ${year}. El recorrido sigue con ${previous.count} de ${previous.year}.`
          : `Ya viste ${seen} de ${year}. Es el año más antiguo en el mapa.`}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {previous && (
          <button type="button" onClick={onPrevious} className={`${primaryButton} ${style.button}`}>
            Ver año {previous.year}
          </button>
        )}
        <button type="button" onClick={onAll} className={secondaryButton}>
          <Globe className="h-4 w-4" aria-hidden />
          Todos los años
        </button>
      </div>
    </article>
  );
};
