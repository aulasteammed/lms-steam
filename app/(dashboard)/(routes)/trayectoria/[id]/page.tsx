import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { CalendarDays, ExternalLink, Handshake, Quote } from "lucide-react";

import { readerHref, type Project, type ProjectDocument } from "@/lib/projects";
import { getProject } from "@/lib/timeline-data";
import { PageBar } from "../_components/back-link";
import { DocumentActions } from "../_components/document-actions";
import { PublicationCover } from "../_components/publication-cover";
import { ShareButton } from "../_components/share-button";
import { MiniMap } from "./_components/mini-map";
import { PhotoGallery } from "./_components/photo-gallery";

type Props = { params: Promise<{ id: string }> };

/**
 * Ninguna página se arma al compilar: cada una se genera la primera vez que
 * alguien la visita y queda guardada hasta que el proyecto cambia en el panel.
 */
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const found = await getProject(id);
  if (!found || "redirectTo" in found) return {};
  return { title: found.project.title, description: found.project.description };
}

const label = "text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500";
const secondaryButton =
  "inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50";

const DocumentList = ({
  title,
  project,
  documents,
}: {
  title: string;
  project: Project;
  documents: ProjectDocument[];
}) => (
  <section>
    <h2 className={label}>{title}</h2>
    <ul className="mt-3 grid gap-4 md:grid-cols-2">
      {documents.map((doc) => (
        <li
          key={doc.id}
          className="flex gap-4 rounded-2xl border border-slate-200 bg-stone-50 p-4"
        >
          <PublicationCover
            publication={doc}
            href={readerHref(project, doc)}
            className="w-20 shrink-0 self-start"
          />
          <div className="min-w-0">
            <p className={label}>
              {doc.kind} · {doc.pageCount} páginas
            </p>
            <h3 className="mt-1 font-semibold leading-snug text-slate-900">{doc.title}</h3>
            {doc.description && (
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{doc.description}</p>
            )}
            <DocumentActions document={doc} readHref={readerHref(project, doc)} className="mt-3" />
          </div>
        </li>
      ))}
    </ul>
  </section>
);

const FACT_COLUMNS: Record<number, string> = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};

/**
 * Página de detalle de un proyecto. Una sola plantilla con bloques opcionales:
 * cada bloque aparece solo si el proyecto tiene ese dato, así que con lo mínimo
 * queda una ficha y con todo, un reportaje. La publicación (periódico, revista)
 * o entregable va en el encabezado porque es lo más valioso del proyecto; los
 * informes se listan aparte. Todos se leen en el visor y se descargan.
 */
export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  const found = await getProject(id);
  if (!found) return notFound();
  // Dirección anterior de un proyecto que se cerró y ganó el año.
  if ("redirectTo" in found) return permanentRedirect(found.redirectTo);
  const { project } = found;

  const pub = project.publication;
  // La destacada ya va en el encabezado: se compara por id, porque los datos
  // llegan de la caché como copias y el mismo documento no es el mismo objeto.
  const morePublications = project.documents.filter((d) => !d.isReport && d.id !== pub?.id);
  const reports = project.documents.filter((d) => d.isReport);
  const participations = project.related.filter((r) => r.type === "participacion");
  const alliances = project.related.filter((r) => r.type === "alianza");

  /** Cada dato lleva una lista de valores: van uno por renglón. */
  const facts: { term: string; values: string[] }[] = [
    // Con varios lugares va uno por renglón; con uno, el resumen.
    {
      term: project.placeNames.length > 1 ? "Ubicaciones" : "Ubicación",
      values: project.placeNames.length > 1 ? project.placeNames : [project.place],
    },
    { term: "Periodo", values: [project.year] },
    ...(project.institutions.length > 0
      ? [{ term: "En colaboración con", values: project.institutions }]
      : []),
  ];

  /** Las fotos van juntas en una sola sección, pequeñas; al tocarlas se abren sobre la página. */
  const photos = project.images.length > 0 && <PhotoGallery images={project.images} />;

  return (
    <article className="pb-16">
      <PageBar backHref="/proyectos" backLabel="Volver al mapa">
        <ShareButton title={project.title} />
      </PageBar>

      <div className="mx-auto max-w-5xl space-y-12 px-4 pt-10 md:px-8 md:pt-14">
        {/* Encabezado: con publicación, la portada es la protagonista */}
        <header
          className={
            pub ? "grid items-center gap-10 md:grid-cols-[1.35fr_1fr] md:gap-14" : "max-w-3xl"
          }
        >
          <div>
            <p className={label}>Proyecto · {project.year}</p>
            <h1 className="mt-3 text-4xl font-bold leading-[1.05] tracking-tight text-slate-900 md:text-5xl">
              {project.title}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              {project.description}
            </p>
          </div>

          {pub && (
            <div className="rounded-3xl bg-orange-50/70 px-8 py-8 md:px-10">
              <PublicationCover
                publication={pub}
                href={readerHref(project, pub)}
                priority
                className="mx-auto w-full max-w-[260px]"
              />
              <div className="mt-6 text-center">
                <p className={label}>
                  {pub.kind} · {pub.pageCount} páginas
                </p>
                <p className="mt-1.5 font-semibold text-slate-900">{pub.title}</p>
                {pub.description && (
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {pub.description}
                  </p>
                )}
                <DocumentActions
                  document={pub}
                  readHref={readerHref(project, pub)}
                  className="mt-5 justify-center"
                />
              </div>
            </div>
          )}
        </header>

        {/* Fila de datos */}
        <dl
          className={`grid grid-cols-2 gap-x-6 gap-y-5 border-y border-slate-200 py-6 ${FACT_COLUMNS[facts.length]}`}
        >
          {facts.map((fact) => (
            <div key={fact.term} className="min-w-0">
              <dt className={label}>{fact.term}</dt>
              <dd className="mt-1.5 text-sm leading-snug text-slate-900">
                {fact.values.length === 1 ? (
                  fact.values[0]
                ) : (
                  <ul className="space-y-1.5">
                    {fact.values.map((value) => (
                      <li key={value}>{value}</li>
                    ))}
                  </ul>
                )}
              </dd>
            </div>
          ))}
        </dl>

        {/* Relato con mapa pequeño; sin relato, las fotos ocupan su lugar */}
        <section>
          {/* El subtítulo va arriba, solo: el mapa arranca a la altura del primer párrafo */}
          {project.story && (
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-slate-900">
              {project.story.title}
            </h2>
          )}
          <div className="grid items-start gap-8 md:grid-cols-[1fr_300px] md:gap-12">
            {project.story ? (
              // El interlineado deja un aire sobre la primera línea; se compensa
              // para que el texto y el borde del mapa queden a la misma altura.
              <div className="space-y-4 text-base leading-relaxed text-slate-700 md:-mt-1.5">
                {project.story.paragraphs.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            ) : (
              photos
            )}
            <MiniMap points={project.points} place={project.place} />
          </div>
        </section>

        {project.story && photos}

        {/* Cita */}
        {project.quote && (
          <figure className="relative mx-auto max-w-3xl rounded-3xl bg-orange-50/70 px-8 pb-8 pt-12 md:px-12 md:pb-10 md:pt-14">
            <span
              aria-hidden
              className="absolute -top-5 left-8 flex h-11 w-11 items-center justify-center rounded-full bg-orange-600 text-white shadow-md md:left-12"
            >
              <Quote className="h-5 w-5 fill-current" />
            </span>
            <blockquote className="text-xl font-medium italic leading-relaxed text-slate-800 md:text-2xl">
              “{project.quote.text}”
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3 text-sm">
              <span aria-hidden className="h-px w-8 bg-orange-600" />
              <span>
                <span className="font-semibold text-slate-900">{project.quote.author}</span>
                {project.quote.role && (
                  <span className="text-slate-500"> · {project.quote.role}</span>
                )}
              </span>
            </figcaption>
          </figure>
        )}

        {/* Equipo: todas las personas del proyecto, con su rol */}
        {project.people.length > 0 && (
          <section>
            <h2 className={label}>Equipo</h2>
            <ul className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {project.people.map((person, i) => (
                <li key={i} className="border-t border-slate-200 pt-3">
                  <p className="text-sm font-medium text-slate-900">{person.name}</p>
                  <p className="text-sm text-slate-500">{person.role}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Las demás publicaciones y entregables, si hay más de una */}
        {morePublications.length > 0 && (
          <DocumentList
            title="Más publicaciones y entregables"
            project={project}
            documents={morePublications}
          />
        )}

        {/* Informes: se leen en el mismo visor y se descargan */}
        {reports.length > 0 && (
          <DocumentList title="Informes" project={project} documents={reports} />
        )}

        {project.externalLink && (
          <a
            href={project.externalLink.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${secondaryButton} w-fit`}
          >
            {project.externalLink.label}
            <ExternalLink className="h-4 w-4" />
          </a>
        )}

        {/* Participaciones y alianzas ligadas al proyecto */}
        {project.related.length > 0 && (
          <section className="grid gap-8 md:grid-cols-2">
            {participations.length > 0 && (
              <div>
                <h2 className={label}>Este proyecto se presentó en</h2>
                <ul className="mt-3 space-y-3">
                  {participations.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 rounded-xl border border-slate-200 p-4"
                    >
                      <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.title}</p>
                        {item.detail && (
                          <p className="text-sm text-slate-500">{item.detail}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {alliances.length > 0 && (
              <div>
                <h2 className={label}>En alianza con</h2>
                <ul className="mt-3 space-y-3">
                  {alliances.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 rounded-xl border border-slate-200 p-4"
                    >
                      <Handshake className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.title}</p>
                        {item.detail && (
                          <p className="text-sm text-slate-500">{item.detail}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {project.acknowledgements && (
          <section className="border-t border-slate-200 pt-6">
            <h2 className={label}>Agradecimientos</h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
              {project.acknowledgements}
            </p>
          </section>
        )}
      </div>
    </article>
  );
}
