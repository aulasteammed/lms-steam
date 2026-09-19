import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, ExternalLink } from "lucide-react";

import { PROJECTS, getProject } from "@/lib/projects";
import { FlipBook } from "./_components/flip-book";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = getProject(id);
  if (!project) return {};
  return { title: project.title, description: project.description };
}

/**
 * Página de detalle de un proyecto: información, fotos y, si tiene,
 * la publicación en formato libro.
 */
export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) return notFound();

  const number = PROJECTS.indexOf(project) + 1;
  const [cover, ...photos] = project.images;
  const pub = project.publication;

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-6 md:px-8 md:py-10">
      <Link
        href="/proyectos"
        className="inline-flex items-center gap-2 rounded-lg text-sm font-medium text-slate-500 transition hover:text-orange-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al mapa
      </Link>

      <header className="grid items-start gap-8 md:grid-cols-[1.1fr_1fr]">
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-600 text-xs font-semibold text-white">
              {number}
            </span>
            {project.place} · {project.year}
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
            {project.title}
          </h1>
          <p className="text-base leading-relaxed text-slate-600 md:text-lg">
            {project.description}
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            {pub && (
              <a
                href="#publicacion"
                className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700"
              >
                <BookOpen className="h-4 w-4" />
                Leer la publicación
              </a>
            )}
            {project.externalLink && (
              <a
                href={project.externalLink.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                {project.externalLink.label}
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover.src}
              alt={cover.alt}
              className="aspect-[4/3] w-full rounded-2xl border border-slate-200 object-cover"
            />
          )}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={photo.src}
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  className="aspect-square w-full rounded-xl border border-slate-200 object-cover"
                />
              ))}
            </div>
          )}
        </div>
      </header>

      {pub && (
        <section id="publicacion" className="scroll-mt-24 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">{pub.title}</h2>
              <p className="text-sm text-slate-500">
                {pub.pageCount} páginas · Arrastra la esquina de una página para
                pasarla o usa las flechas del teclado
              </p>
            </div>
          </div>
          <FlipBook publication={pub} />
        </section>
      )}
    </div>
  );
}
