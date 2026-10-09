"use client";

import { useEffect, useRef } from "react";
import { ENTRY_TYPES, TYPE_LABELS, type EntryType } from "@/lib/timeline";
import { TYPE_STYLES } from "./entry-type";

type TypeSelectorProps = {
  selected: EntryType;
  counts: Record<EntryType, number>;
  onSelect: (type: EntryType) => void;
};

/** Selector de tipo: el mapa muestra un solo tipo de registro a la vez. */
export const TypeSelector = ({ selected, counts, onSelect }: TypeSelectorProps) => (
  <div
    role="group"
    aria-label="Tipo de registro"
    className="flex max-w-full gap-1 rounded-full border border-slate-200 bg-white/95 p-1 shadow-md backdrop-blur"
  >
    {ENTRY_TYPES.map((type) => {
      const style = TYPE_STYLES[type];
      const Icon = style.icon;
      const isSelected = type === selected;
      return (
        <button
          key={type}
          type="button"
          aria-pressed={isSelected}
          onClick={() => onSelect(type)}
          className={`flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 sm:text-sm ${
            isSelected ? style.soft : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Icon className="hidden h-4 w-4 sm:block" />
          {TYPE_LABELS[type].plural}
          <span className={`tabular-nums ${isSelected ? "opacity-70" : "text-slate-400"}`}>
            {counts[type]}
          </span>
        </button>
      );
    })}
  </div>
);

type TimelineBarProps = {
  /** Todos los años de la línea de tiempo, de menor a mayor. */
  years: number[];
  /** Cuántos registros del tipo seleccionado hay en cada año. */
  counts: Record<number, number>;
  /** `null` = ningún año elegido (vista completa). */
  selected: number | null;
  /** Elegir el año que ya estaba elegido lo suelta y vuelve a la vista completa. */
  onSelect: (year: number) => void;
  /** Clases de la franja (para centrar los años en el espacio libre junto a las cards). */
  className?: string;
};

/**
 * Línea de tiempo por años. No tiene caja ni borde: son solo los años sobre
 * una franja en la que el mapa se desvanece hacia blanco, para que se lean sin
 * tapar el mapa. Los años sin registros del tipo seleccionado se ven apagados
 * y no se pueden elegir, así la línea no cambia de largo al cambiar de tipo.
 */
export const TimelineBar = ({
  years,
  counts,
  selected,
  onSelect,
  className = "",
}: TimelineBarProps) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Cuando los años no caben (celular), el elegido queda centrado. Sin año
  // elegido, la fila muestra el final: los más recientes.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const button = selectedRef.current;
    scroller.scrollTo({
      left: button
        ? button.offsetLeft - (scroller.clientWidth - button.clientWidth) / 2
        : scroller.scrollWidth,
      behavior: "smooth",
    });
  }, [selected]);

  return (
    <nav
      aria-label="Línea de tiempo"
      className={`pointer-events-none bg-gradient-to-b from-transparent via-white/75 to-transparent py-2 md:bg-gradient-to-t md:from-white/95 md:via-white/60 md:to-transparent md:pb-3 md:pt-10 ${className}`}
    >
      <div
        ref={scrollerRef}
        className="story-scroller pointer-events-auto mx-auto flex w-fit max-w-full items-start gap-1 overflow-x-auto px-3"
      >
        {years.map((year) => {
          const isSelected = year === selected;
          return (
            <button
              key={year}
              ref={isSelected ? selectedRef : undefined}
              type="button"
              aria-pressed={isSelected}
              disabled={!counts[year]}
              onClick={() => onSelect(year)}
              className={`group flex shrink-0 flex-col items-center gap-1 rounded-lg px-3 py-1 text-sm tabular-nums transition [text-shadow:0_0_6px_rgb(255_255_255)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:text-slate-400 ${
                isSelected
                  ? "font-bold text-slate-900"
                  : "font-medium text-slate-600 enabled:hover:text-slate-900"
              }`}
            >
              {year}
              <span
                aria-hidden
                className={`h-1 rounded-full transition-all ${
                  isSelected
                    ? "w-5 bg-slate-900"
                    : "w-1 bg-transparent group-enabled:group-hover:bg-slate-400"
                }`}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
};
