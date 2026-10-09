"use client";

import { ChevronDown, Globe } from "lucide-react";
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
  /** Botón secundario para volver a la vista completa. */
  back?: { label: string; onClick: () => void };
};

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
}: IntroCardProps) => {
  const style = TYPE_STYLES[type];

  return (
    <article className="pointer-events-auto w-full max-h-full overflow-y-auto overscroll-contain rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl md:max-h-none md:overflow-visible md:p-8">
      <p className={`text-xs font-semibold uppercase tracking-wider ${style.text}`}>
        {eyebrow}
      </p>
      <h1 className="mt-2 text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-[15px]">
        {text}
      </p>

      <ol className="mt-5 divide-y divide-slate-100 border-y border-slate-100">
        {items.map((item) => (
          <li key={item.key}>
            <button
              type="button"
              onClick={item.onSelect}
              className="group flex w-full items-center gap-3 py-2.5 text-left"
            >
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-slate-800 transition group-hover:text-orange-700">
                  {item.title}
                </span>
                {item.subtitle && (
                  <span className="block truncate text-xs text-slate-500">
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
          <button
            type="button"
            onClick={onStart}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${style.button}`}
          >
            Comenzar recorrido
            <ChevronDown className="h-4 w-4 md:animate-bounce" />
          </button>
        )}
        {back && (
          <button
            type="button"
            onClick={back.onClick}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
          >
            <Globe className="h-4 w-4" />
            {back.label}
          </button>
        )}
      </div>
    </article>
  );
};
