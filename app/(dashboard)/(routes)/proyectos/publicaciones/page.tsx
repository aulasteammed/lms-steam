import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Download } from "lucide-react";

import { ALL_DOCUMENTS, readLabel, readerHref } from "@/lib/projects";
import { PageBar } from "../_components/back-link";
import { PublicationCover } from "../_components/publication-cover";

export const metadata: Metadata = {
  title: "Publicaciones",
  description:
    "Periódicos, revistas, cartillas e informes de los proyectos del Aula STEAM Sonny Jiménez, para leer y descargar.",
};

const label = "text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500";

type ShelfItem = (typeof ALL_DOCUMENTS)[number];

const Shelf = ({ items }: { items: ShelfItem[] }) => (
  <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
    {items.map(({ project, document }) => {
      const href = readerHref(project, document, "publicaciones");
      return (
        <li key={`${project.id}-${document.id}`} className="flex flex-col">
          {/* Repisa: alto fijo para que todas las de una fila queden a la misma altura */}
          <div className="flex h-80 items-end justify-center rounded-t-2xl border-b-[6px] border-stone-300 bg-stone-100 px-8 pt-8">
            <PublicationCover
              publication={document}
              href={href}
              className="w-full max-w-[180px] rounded-b-none"
            />
          </div>

          <div className="pt-4">
            <p className={label}>
              {document.kind} · {document.pageCount} páginas
            </p>
            <h3 className="mt-1.5 text-lg font-semibold leading-snug text-slate-900">
              {document.title}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {project.title} · {project.place} · {project.year}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link
                href={href}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700"
              >
                <BookOpen className="h-4 w-4" />
                {readLabel(document)}
              </Link>
              <a
                href={document.pdf}
                download
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Descargar
              </a>
            </div>
            <Link
              href={project.href}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-orange-700"
            >
              Ver el proyecto
              <ArrowRight className="h-4 w-4" />
            </Link>
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
export default function PublicationsPage() {
  const publications = ALL_DOCUMENTS.filter(({ document }) => !document.isReport);
  const reports = ALL_DOCUMENTS.filter(({ document }) => document.isReport);
  const total = ALL_DOCUMENTS.length;

  return (
    <div className="pb-16">
      <PageBar backHref="/proyectos" backLabel="Volver al mapa" />

      <div className="mx-auto max-w-5xl px-4 pt-10 md:px-8 md:pt-14">
        <header className="max-w-2xl">
          <p className={label}>
            {total} {total === 1 ? "documento" : "documentos"}
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-[1.05] tracking-tight text-slate-900 md:text-5xl">
            Publicaciones
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Periódicos, revistas e informes de los proyectos. Se pueden leer completos
            aquí mismo o descargar en PDF.
          </p>
        </header>

        {total === 0 && <p className="mt-10 text-slate-500">Aún no hay publicaciones.</p>}

        {publications.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-6 border-b border-slate-200 pb-3 text-xl font-bold tracking-tight text-slate-900">
              Periódicos y revistas
            </h2>
            <Shelf items={publications} />
          </section>
        )}

        {reports.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-6 border-b border-slate-200 pb-3 text-xl font-bold tracking-tight text-slate-900">
              Informes y entregables
            </h2>
            <Shelf items={reports} />
          </section>
        )}
      </div>
    </div>
  );
}
