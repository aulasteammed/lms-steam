import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

import { coverUrl, readerHref } from "@/lib/projects";
import { getAllDocuments, type ShelfItem } from "@/lib/timeline-data";
import { PageBar } from "../_components/back-link";

export const metadata: Metadata = {
  title: "Publicaciones",
  description:
    "Periódicos, revistas, cartillas e informes de los proyectos del Aula STEAM Sonny Jiménez, para leer y descargar.",
};

const label = "text-[11px] font-semibold uppercase tracking-[0.14em] text-editorial-soft";

const Shelf = ({ items }: { items: ShelfItem[] }) => (
  <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {items.map(({ project, document }) => {
      const href = readerHref(project, document, "publicaciones");
      return (
        // Panel y texto en un mismo contenedor, con el borde del blog, para que
        // se lea como un solo objeto.
        <li
          key={`${project.id}-${document.id}`}
          className="group flex flex-col overflow-hidden rounded-2xl border border-editorial-line bg-white"
        >
          {/* El documento completo sobre un panel neutro, como en una galería.
              Todas las portadas miden lo mismo de alto (el ancho sale de la
              proporción de cada una), así se pueden centrar sin que un periódico
              quede más arriba que un informe. El relleno de abajo es mayor que
              el de arriba: queda en el centro óptico, un poco sobre el real. */}
          <Link
            href={href}
            tabIndex={-1}
            aria-hidden
            className="flex h-72 items-center justify-center bg-editorial-chip px-6 pb-9 pt-5 transition-colors duration-300 group-hover:bg-[#ebe6e0]"
          >
            <span className="relative block h-full max-w-full overflow-hidden rounded-r-[3px] rounded-l-[1px] ring-1 ring-editorial-ink/10 shadow-[0_1px_1px_rgba(18,17,15,0.12),0_3px_6px_rgba(18,17,15,0.12),0_14px_24px_-10px_rgba(18,17,15,0.35)] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_1px_1px_rgba(18,17,15,0.12),0_6px_10px_rgba(18,17,15,0.14),0_22px_32px_-12px_rgba(18,17,15,0.42)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverUrl(document)}
                alt=""
                loading="lazy"
                // Si un documento apaisado no cabe a lo ancho, se achica sin deformarse.
                className="block h-full w-auto max-w-full bg-white object-contain"
              />
              {/* Lomo */}
              <span className="pointer-events-none absolute inset-y-0 left-0 w-[7%] bg-gradient-to-r from-black/20 via-black/5 to-transparent" />
            </span>
          </Link>

          <div className="flex flex-1 flex-col p-5">
            <p className={label}>
              {document.kind} · {document.pageCount} páginas
            </p>
            <h3 className="mt-1.5 text-lg font-semibold leading-snug text-editorial-ink">
              {document.title}
            </h3>
            {/* Sin los lugares: un proyecto puede tener varios y alargan la card.
                Están en la página del proyecto. */}
            <p className="mt-1 text-sm text-editorial-soft">
              {project.title} · {project.year}
            </p>

            {/* Una sola acción fuerte, abajo en todas las cards de la fila. La
                descarga está dentro del lector. */}
            <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-5">
              <Link
                href={href}
                aria-label={`Leer: ${document.title}`}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-editorial-cta px-4 text-sm font-medium text-white transition hover:bg-editorial-cta-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-editorial-accent focus-visible:ring-offset-2"
              >
                <BookOpen className="h-4 w-4" />
                Leer
              </Link>
              <Link
                href={project.href}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-editorial-soft transition hover:text-editorial-cta"
              >
                Ver el proyecto
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </li>
      );
    })}
  </ul>
);

/**
 * Estantería con todos los documentos de los proyectos, para encontrarlos
 * sin tener que saber qué proyecto tiene cada uno.
 */
export default async function PublicationsPage() {
  const documents = await getAllDocuments();
  const publications = documents.filter(({ document }) => !document.isReport);
  const reports = documents.filter(({ document }) => document.isReport);
  const total = documents.length;

  return (
    <div className="pb-16">
      <PageBar backHref="/trayectoria" backLabel="Volver al mapa" />

      <div className="mx-auto max-w-5xl px-4 pt-10 md:px-8 md:pt-14">
        <header className="max-w-2xl">
          <p className={label}>
            {total} {total === 1 ? "documento" : "documentos"}
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-[1.05] tracking-tight text-editorial-ink md:text-5xl">
            Publicaciones
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-editorial-soft">
            Entregables de los proyectos. Te invitamos a leerlos y conocer lo que hace el aula STEAM Sonny Jiménez
          </p>
        </header>

        {total === 0 && <p className="mt-10 text-editorial-soft">Aún no hay publicaciones.</p>}

        {publications.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-6 border-b border-editorial-line pb-3 text-xl font-bold tracking-tight text-editorial-ink">
              Publicaciones y entregables
            </h2>
            <Shelf items={publications} />
          </section>
        )}

        {reports.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-6 border-b border-editorial-line pb-3 text-xl font-bold tracking-tight text-editorial-ink">
              Informes
            </h2>
            <Shelf items={reports} />
          </section>
        )}
      </div>
    </div>
  );
}
