import Link from "next/link";
import { ArrowRight, BookOpen, Route } from "lucide-react";

import { coverUrl } from "@/lib/projects";
import { periodLabel, timelineYear, type MapEntry } from "@/lib/timeline";

/** Cuántos proyectos se sugieren al final de la página. */
const SUGGESTIONS = 3;

/**
 * Proyectos para seguir leyendo: los más cercanos en el tiempo al actual
 * (mismo año primero) y, entre los que están igual de cerca, los más recientes.
 */
export const pickOtherProjects = (entries: MapEntry[], current: MapEntry | undefined, now: number) => {
  const year = current ? timelineYear(current, now) : now;
  return entries
    .filter((entry) => entry.type === "project" && entry.href && entry.id !== current?.id)
    .sort(
      (a, b) =>
        Math.abs(timelineYear(a, now) - year) - Math.abs(timelineYear(b, now) - year) ||
        timelineYear(b, now) - timelineYear(a, now)
    )
    .slice(0, SUGGESTIONS);
};

/** Botón redondeado con el borde de los demás botones; al pasar el cursor, naranja. */
const pillClass =
  "inline-flex min-h-11 items-center gap-2 rounded-full border border-editorial-line bg-white px-5 text-sm font-medium text-editorial-body transition hover:border-editorial-accent hover:bg-editorial-accent-soft hover:text-editorial-cta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-editorial-accent focus-visible:ring-offset-2";

/** Miniatura de un proyecto: su primera foto o, sin fotos, la portada de su publicación. */
const thumbnail = (entry: MapEntry) =>
  entry.images[0]?.src ?? (entry.publication ? coverUrl(entry.publication) : undefined);

/**
 * Cierre de la página de un proyecto: en vez de terminar de golpe, lleva al
 * recorrido del año en el mapa, a la estantería de publicaciones y a otros
 * proyectos. Lista con filetes, no tarjetas, como el final de un reportaje.
 */
export const KeepExploring = ({
  mapYear,
  others,
}: {
  /** Año en que el proyecto aparece en el mapa; sin él, el enlace abre el mapa completo. */
  mapYear?: number;
  others: MapEntry[];
}) => (
  <section
    aria-labelledby="sigue-explorando"
    className="border-t border-editorial-line pt-10 text-center"
  >
    <h2
      id="sigue-explorando"
      className="font-editorial text-2xl font-bold text-editorial-ink md:text-3xl"
    >
      Sigue explorando
    </h2>

    <ul className="mt-6 flex flex-wrap justify-center gap-3">
      <li>
        <Link href={mapYear ? `/trayectoria?anio=${mapYear}` : "/trayectoria"} className={pillClass}>
          <Route className="h-4 w-4 shrink-0 text-editorial-cta" aria-hidden />
          {mapYear ? `Volver al recorrido de ${mapYear}` : "Volver al recorrido"}
        </Link>
      </li>
      <li>
        <Link href="/trayectoria/publicaciones" className={pillClass}>
          <BookOpen className="h-4 w-4 shrink-0 text-editorial-cta" aria-hidden />
          Todas las publicaciones
        </Link>
      </li>
    </ul>

    {others.length > 0 && (
        <div className="mx-auto mt-10 max-w-2xl text-left">
          <h3 className="text-center text-sm font-medium text-editorial-soft">Otros proyectos</h3>
          <ul className="mt-2 divide-y divide-editorial-line border-y border-editorial-line">
            {others.map((entry) => {
              const image = thumbnail(entry);
              return (
                <li key={entry.id}>
                  <Link
                    href={entry.href!}
                    className="group flex items-center gap-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-editorial-accent focus-visible:ring-offset-2"
                  >
                    {image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image}
                        alt=""
                        loading="lazy"
                        className="h-16 w-20 shrink-0 rounded-lg bg-editorial-chip object-cover sm:h-20 sm:w-28"
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block font-editorial text-lg font-bold leading-snug text-editorial-ink text-balance transition group-hover:text-editorial-cta md:text-xl">
                        {entry.title}
                      </span>
                      <span className="mt-0.5 block text-sm text-editorial-soft">
                        {entry.place} · {periodLabel(entry)}
                      </span>
                    </span>
                    <ArrowRight
                      className="h-4 w-4 shrink-0 text-editorial-soft transition group-hover:translate-x-0.5 group-hover:text-editorial-cta"
                      aria-hidden
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
  </section>
);
