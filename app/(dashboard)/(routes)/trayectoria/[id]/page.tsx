import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ExternalLink, Quote } from "lucide-react";

import { readerHref, type Project, type ProjectDocument } from "@/lib/projects";
import { shareMetadata } from "@/lib/share-metadata";
import { timelineYear } from "@/lib/timeline";
import { getMapEntries, getProject } from "@/lib/timeline-data";
import { PageBar } from "../_components/back-link";
import { DocumentActions } from "../_components/document-actions";
import { TYPE_STYLES } from "../_components/entry-type";
import { PublicationCover } from "../_components/publication-cover";
import { ShareButton } from "../_components/share-button";
import { KeepExploring, pickOtherProjects } from "./_components/keep-exploring";
import { MiniMap } from "./_components/mini-map";
import { PhotoGallery } from "./_components/photo-gallery";

type Props = { params: Promise<{ id: string }> };

// Los mismos íconos del tipo que en el mapa y el panel (`entry-type.ts`).
const ParticipationIcon = TYPE_STYLES.participation.icon;
const AllianceIcon = TYPE_STYLES.alliance.icon;

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
  const { project } = found;
  return shareMetadata({
    title: project.title,
    description: project.description,
    path: project.href,
    images: [...project.images.map((image) => image.src), project.publication?.pages[0]?.url],
  });
}

/** Etiqueta pequeña: solo para datos (Ubicación, Periodo…) y el tipo de documento. */
const label = "text-[11px] font-semibold uppercase tracking-[0.14em] text-editorial-soft";
/** Título de cada sección de la página, en la serif del blog: se distingue a simple vista de un dato. */
const sectionHeading = "font-editorial text-xl font-bold text-editorial-ink md:text-2xl";
/** Línea bajo un título (tipo, páginas, periodo): en minúsculas, no como etiqueta sobre el título. */
const meta = "text-sm text-editorial-soft";
const secondaryButton =
  "inline-flex items-center gap-2 rounded-lg border border-editorial-line bg-white px-4 py-2 text-sm font-medium text-editorial-body transition hover:bg-editorial-paper";

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
    <h2 className={sectionHeading}>{title}</h2>
    {/* Dos columnas solo desde 1024 px: antes, el menú lateral deja muy poco ancho. */}
    <ul className="mt-4 grid gap-4 lg:grid-cols-2">
      {documents.map((doc) => (
        <li
          key={doc.id}
          className="flex gap-4 rounded-2xl border border-editorial-line bg-editorial-paper p-4"
        >
          <PublicationCover
            publication={doc}
            href={readerHref(project, doc)}
            className="w-20 shrink-0 self-start"
          />
          <div className="min-w-0">
            <h3 className="font-editorial text-lg font-bold leading-snug text-editorial-ink">
              {doc.title}
            </h3>
            <p className={`mt-0.5 ${meta}`}>
              {doc.kind} · {doc.pageCount} páginas
            </p>
            {doc.description && (
              <p className="mt-1 text-sm leading-relaxed text-editorial-soft">{doc.description}</p>
            )}
            <DocumentActions document={doc} readHref={readerHref(project, doc)} className="mt-3" />
          </div>
        </li>
      ))}
    </ul>
  </section>
);

/** Columnas de la fila de datos: en tableta caben dos; desde 1024 px, todas. */
const FACT_COLUMNS: Record<number, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
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

  // La lista del mapa ya está en caché: de ahí salen el año del recorrido y
  // los otros proyectos, sin otra consulta a la base.
  const entries = await getMapEntries();
  const now = new Date().getFullYear();
  const current = entries.find((entry) => entry.slug === project.id);
  const mapYear = current ? timelineYear(current, now) : undefined;
  const others = pickOtherProjects(entries, current, now);

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

  /** El mapa abre directo en la card de este proyecto, en su año. */
  const mapHref = `/trayectoria?registro=${encodeURIComponent(project.id)}`;

  /** Las fotos van juntas en una sola sección, pequeñas; al tocarlas se abren sobre la página. */
  const photos = project.images.length > 0 && (
    <PhotoGallery images={project.images} title={project.title} />
  );
  /** Lo que va junto al mini-mapa: el relato o, sin relato, las fotos. */
  const besideMap = project.story || photos;
  const miniMap = <MiniMap points={project.points} place={project.place} mapHref={mapHref} />;

  return (
    <article className="pb-16">
      <PageBar backHref={mapHref} backLabel="Volver al mapa">
        <ShareButton title={project.title} />
      </PageBar>

      {/* Las columnas lado a lado empiezan en `lg` (1024 px), no en `md`: el menú
          lateral ya ocupa 224 px desde 768 y en tableta quedaban columnas de ~130 px. */}
      <div className="mx-auto max-w-5xl space-y-12 px-4 pt-10 md:px-8 md:pt-14">
        {/* Encabezado: con publicación, la portada es la protagonista */}
        <header
          className={
            pub ? "grid items-center gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-14" : "max-w-3xl"
          }
        >
          <div>
            <h1 className="break-words font-editorial text-4xl font-bold leading-[1.08] text-editorial-ink text-balance md:text-5xl">
              {project.title}
            </h1>
            {/* Como la línea de fecha de un periódico: bajo el titular, no como etiqueta encima. */}
            <p className="mt-3 text-sm font-medium text-editorial-soft">Proyecto · {project.year}</p>
            <p className="mt-5 text-lg leading-relaxed text-editorial-soft">
              {project.description}
            </p>
          </div>

          {pub && (
            <div className="rounded-3xl bg-editorial-accent-soft px-6 py-8 sm:px-8 lg:px-10">
              <PublicationCover
                publication={pub}
                href={readerHref(project, pub)}
                priority
                className="mx-auto w-full max-w-[260px]"
              />
              <div className="mt-6 text-center">
                {/* Es lo más valioso del proyecto: va como título, no como párrafo. */}
                <h2 className="font-editorial text-xl font-bold leading-snug text-editorial-ink text-balance">
                  {pub.title}
                </h2>
                <p className={`mt-1 ${meta}`}>
                  {pub.kind} · {pub.pageCount} páginas
                </p>
                {pub.description && (
                  <p className="mt-1.5 text-sm leading-relaxed text-editorial-soft">
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
        <section aria-labelledby="datos-del-proyecto">
          <h2 id="datos-del-proyecto" className="sr-only">
            Datos del proyecto
          </h2>
          <dl
            className={`grid grid-cols-2 gap-x-6 gap-y-5 border-y border-editorial-line py-6 ${FACT_COLUMNS[facts.length]}`}
          >
            {facts.map((fact) => (
              <div key={fact.term} className="min-w-0">
                <dt className={label}>{fact.term}</dt>
                <dd className="mt-1.5 text-sm leading-snug text-editorial-ink">
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
        </section>

        {/* Relato con mapa pequeño; sin relato, las fotos ocupan su lugar */}
        {besideMap ? (
          <section>
            {/* El subtítulo va arriba, solo: el mapa arranca a la altura del primer párrafo */}
            {project.story && (
              <h2 className={`mb-4 ${sectionHeading}`}>{project.story.title}</h2>
            )}
            <div className="grid items-start gap-8 lg:grid-cols-[1fr_300px] lg:gap-12">
              {project.story ? (
                // El interlineado deja un aire sobre la primera línea; se compensa
                // para que el texto y el borde del mapa queden a la misma altura.
                <div className="max-w-prose space-y-4 text-base leading-relaxed text-editorial-body lg:-mt-1.5">
                  {project.story.paragraphs.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              ) : (
                photos
              )}
              {/* En tableta y celular el mapa va debajo, sin estirarse a todo el ancho. */}
              <div className="w-full sm:max-w-xs lg:max-w-none">{miniMap}</div>
            </div>
          </section>
        ) : (
          // Ficha mínima (sin relato ni fotos): el mapa conserva su tamaño, no
          // se estira a la columna ancha.
          <div className="w-full sm:max-w-xs">{miniMap}</div>
        )}

        {project.story && photos}

        {/* Cita */}
        {project.quote && (
          <figure className="relative mx-auto max-w-3xl rounded-3xl bg-editorial-accent-soft px-8 pb-8 pt-12 md:px-12 md:pb-10 md:pt-14">
            <span
              aria-hidden
              className="absolute -top-5 left-8 flex h-11 w-11 items-center justify-center rounded-full bg-editorial-cta text-white shadow-md md:left-12"
            >
              <Quote className="h-5 w-5 fill-current" />
            </span>
            <blockquote className="font-editorial text-xl italic leading-relaxed text-editorial-ink md:text-2xl">
              “{project.quote.text}”
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3 text-sm">
              <span aria-hidden className="h-px w-8 bg-editorial-cta" />
              <span>
                <span className="font-semibold text-editorial-ink">{project.quote.author}</span>
                {project.quote.role && (
                  <span className="text-editorial-soft"> · {project.quote.role}</span>
                )}
              </span>
            </figcaption>
          </figure>
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
          <section className="grid gap-10 lg:grid-cols-2 lg:gap-8">
            {participations.length > 0 && (
              <div>
                <h2 className={sectionHeading}>Este proyecto se presentó en</h2>
                <ul className="mt-4 space-y-3">
                  {participations.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 rounded-xl border border-editorial-line p-4"
                    >
                      <ParticipationIcon className={`mt-0.5 h-5 w-5 shrink-0 ${TYPE_STYLES.participation.text}`} />
                      <div>
                        <p className="text-sm font-medium text-editorial-ink">{item.title}</p>
                        {item.detail && (
                          <p className="text-sm text-editorial-soft">{item.detail}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {alliances.length > 0 && (
              <div>
                <h2 className={sectionHeading}>En alianza con</h2>
                <ul className="mt-4 space-y-3">
                  {alliances.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 rounded-xl border border-editorial-line p-4"
                    >
                      <AllianceIcon className={`mt-0.5 h-5 w-5 shrink-0 ${TYPE_STYLES.alliance.text}`} />
                      <div>
                        <p className="text-sm font-medium text-editorial-ink">{item.title}</p>
                        {item.detail && (
                          <p className="text-sm text-editorial-soft">{item.detail}</p>
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
          <section className="border-t border-editorial-line pt-6">
            <h2 className={sectionHeading}>Agradecimientos</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-editorial-soft">
              {project.acknowledgements}
            </p>
          </section>
        )}

        <KeepExploring mapYear={mapYear} others={others} />
      </div>
    </article>
  );
}
