/**
 * Lecturas del sitio público (`/proyectos`) sobre los registros publicados del
 * mapa y la línea de tiempo. Solo para el servidor.
 *
 * Todas van en caché con la etiqueta `TIMELINE_TAG`: la base de datos solo se
 * consulta la primera vez y después de que alguien guarda en el panel
 * (`actions/timeline.ts` invalida la etiqueta).
 */
import "server-only";

import { unstable_cache } from "next/cache";

import { db } from "@/lib/db";
import type { Project, ProjectDocument } from "@/lib/projects";
import { formatDate, type MapEntry } from "@/lib/timeline";

export const TIMELINE_TAG = "timeline";

const KIND_LABELS: Record<string, string> = {
  newspaper: "Periódico",
  magazine: "Revista",
  booklet: "Cartilla",
  book: "Libro",
  deliverable: "Entregable",
  report: "Informe",
  other: "Documento",
};

const cached = <Args extends unknown[], Result>(
  read: (...args: Args) => Promise<Result>,
  key: string
) => unstable_cache(read, [key], { tags: [TIMELINE_TAG] });

const projectHref = (slug: string) => `/proyectos/${slug}`;

/** "2024", "2024 – 2026" o "2024 – actual". */
const period = (startYear: number, endYear: number | null) =>
  endYear === startYear ? String(startYear) : `${startYear} – ${endYear ?? "actual"}`;

const dateText = (date: Date | null) => date?.toISOString().slice(0, 10);

type DocumentRow = {
  slug: string;
  title: string;
  kind: string;
  description: string | null;
  pdfUrl: string;
  pageCount: number;
  pages: { url: string; urlLarge: string | null }[];
  pageWidth: number;
  pageHeight: number;
};

const toDocument = (row: DocumentRow): ProjectDocument => ({
  id: row.slug,
  title: row.title,
  kind: KIND_LABELS[row.kind] ?? KIND_LABELS.other,
  description: row.description ?? undefined,
  pdf: row.pdfUrl,
  pageCount: row.pageCount,
  pages: row.pages.map((page) => ({ url: page.url, urlLarge: page.urlLarge ?? undefined })),
  pageWidth: row.pageWidth,
  pageHeight: row.pageHeight,
  isReport: row.kind === "report",
});

const documentSelect = {
  slug: true,
  title: true,
  kind: true,
  description: true,
  pdfUrl: true,
  pageCount: true,
  pages: true,
  pageWidth: true,
  pageHeight: true,
} as const;

/** Lista liviana para el mapa: todos los registros publicados, de los tres tipos. */
export const getMapEntries = cached(async (): Promise<MapEntry[]> => {
  const entries = await db.timelineEntry.findMany({
    where: { status: "published" },
    orderBy: [{ startYear: "desc" }, { title: "asc" }],
    select: {
      id: true,
      type: true,
      slug: true,
      title: true,
      shortDescription: true,
      locationText: true,
      startYear: true,
      endYear: true,
      locations: true,
      images: true,
      participationDate: true,
      modality: true,
      reason: true,
      speakerName: true,
      speakerRole: true,
      relatedEntryIds: true,
      // Del mapa solo se usa la publicación destacada: su tipo y su portada.
      documents: {
        where: { kind: { not: "report" } },
        orderBy: { position: "asc" },
        take: 1,
        select: documentSelect,
      },
    },
  });

  const byId = new Map(entries.map((entry) => [entry.id, entry]));

  return entries.map((entry) => ({
    id: entry.id,
    type: entry.type,
    title: entry.title,
    description: entry.shortDescription,
    place: entry.locationText,
    startYear: entry.startYear,
    endYear: entry.endYear ?? undefined,
    places: entry.locations.map((location) => ({
      name: location.name,
      coordinates: [location.longitude, location.latitude] as [number, number],
    })),
    images: entry.images.map((image) => ({
      src: image.url,
      alt: image.alt,
      credit: image.credit ?? undefined,
    })),
    href: entry.type === "project" ? projectHref(entry.slug) : undefined,
    publication: entry.documents[0]
      ? // El mapa no pasa páginas: basta la portada.
        { ...toDocument(entry.documents[0]), pages: toDocument(entry.documents[0]).pages.slice(0, 1) }
      : undefined,
    date: dateText(entry.participationDate),
    modality: entry.modality ?? undefined,
    reason: entry.reason ?? undefined,
    speaker: entry.speakerName
      ? { name: entry.speakerName, role: entry.speakerRole ?? undefined }
      : undefined,
    // Solo se nombran los relacionados que también están publicados.
    related: entry.relatedEntryIds.flatMap((id) => {
      const other = byId.get(id);
      if (!other) return [];
      return [
        {
          title: other.title,
          href: other.type === "project" ? projectHref(other.slug) : undefined,
        },
      ];
    }),
  }));
}, "map-entries");

/**
 * Un proyecto publicado por su dirección. Si la dirección es una anterior
 * (el registro se cerró y ganó el año), responde a cuál redirigir.
 */
export const getProject = cached(
  async (slug: string): Promise<{ project: Project } | { redirectTo: string } | null> => {
    const entry = await db.timelineEntry.findFirst({
      where: {
        type: "project",
        status: "published",
        OR: [{ slug }, { previousSlugs: { has: slug } }],
      },
      include: {
        institutions: { select: { name: true }, orderBy: { name: "asc" } },
        documents: { orderBy: { position: "asc" }, select: documentSelect },
      },
    });
    if (!entry) return null;
    if (entry.slug !== slug) return { redirectTo: projectHref(entry.slug) };

    // Participaciones y alianzas que nombran este proyecto.
    const pointing = await db.timelineEntry.findMany({
      where: {
        status: "published",
        type: { in: ["participation", "alliance"] },
        relatedEntryIds: { has: entry.id },
      },
      orderBy: { startYear: "desc" },
      select: {
        type: true,
        title: true,
        locationText: true,
        startYear: true,
        endYear: true,
        participationDate: true,
      },
    });

    const documents = entry.documents.map(toDocument);

    return {
      project: {
        id: entry.slug,
        title: entry.title,
        place: entry.locationText,
        year: period(entry.startYear, entry.endYear),
        description: entry.shortDescription,
        points: entry.locations.map(
          (location) => [location.longitude, location.latitude] as [number, number]
        ),
        images: entry.images.map((image) => ({
          src: image.url,
          alt: image.alt,
          credit: image.credit ?? undefined,
        })),
        href: projectHref(entry.slug),
        externalLink: entry.externalLinkUrl
          ? { href: entry.externalLinkUrl, label: entry.externalLinkText ?? "Visitar sitio" }
          : undefined,
        documents,
        publication: documents.find((document) => !document.isReport),
        institutions: entry.institutions.map((institution) => institution.name),
        people: entry.people.map((person) => ({ name: person.name, role: person.role })),
        story: entry.story ?? undefined,
        quote: entry.quote
          ? { text: entry.quote.text, author: entry.quote.author, role: entry.quote.role ?? undefined }
          : undefined,
        acknowledgements: entry.acknowledgements ?? undefined,
        related: pointing.map((other) => {
          const date = dateText(other.participationDate);
          return other.type === "participation"
            ? {
                type: "participacion" as const,
                title: other.title,
                detail: [date && formatDate(date), other.locationText].filter(Boolean).join(" · "),
              }
            : {
                type: "alianza" as const,
                title: other.title,
                detail: period(other.startYear, other.endYear),
              };
        }),
      },
    };
  },
  "project"
);

export type ShelfItem = {
  project: Pick<Project, "id" | "title" | "place" | "year" | "href">;
  document: ProjectDocument;
};

/** Todos los documentos de los proyectos publicados, para la estantería. */
export const getAllDocuments = cached(async (): Promise<ShelfItem[]> => {
  const documents = await db.timelineDocument.findMany({
    where: { entry: { status: "published", type: "project" } },
    orderBy: [{ createdAt: "desc" }],
    select: {
      ...documentSelect,
      entry: {
        select: { slug: true, title: true, locationText: true, startYear: true, endYear: true },
      },
    },
  });

  return documents.map(({ entry, ...row }) => ({
    project: {
      id: entry.slug,
      title: entry.title,
      place: entry.locationText,
      year: period(entry.startYear, entry.endYear),
      href: projectHref(entry.slug),
    },
    // La estantería solo muestra la portada.
    document: { ...toDocument(row), pages: toDocument(row).pages.slice(0, 1) },
  }));
}, "all-documents");

/** Direcciones de los proyectos publicados, para el sitemap. */
export const getProjectLinks = cached(async () => {
  const entries = await db.timelineEntry.findMany({
    where: { status: "published", type: "project" },
    select: { slug: true, updatedAt: true },
  });
  return entries.map((entry) => ({
    href: projectHref(entry.slug),
    updatedAt: entry.updatedAt.toISOString(),
  }));
}, "project-links");
