/**
 * Lecturas del panel de profesor (`/teacher/proyectos`) sobre los registros
 * del mapa y la línea de tiempo. Solo para el servidor.
 *
 * Cada consulta pide únicamente los campos que su pantalla muestra.
 */
import "server-only";

import { db } from "@/lib/db";
import type { EntryType } from "@/lib/timeline";
import type {
  DocumentKind,
  EntryDraft,
} from "@/app/(dashboard)/(routes)/teacher/proyectos/_components/draft";

/**
 * `startYear` es obligatorio en la base de datos, pero un borrador recién
 * creado aún no tiene periodo. Se guarda 0 y el panel lo lee como "sin dato".
 * Nunca llega al sitio público: para publicar se exige el periodo.
 */
export const NO_YEAR = 0;

/** "Río Guapi · 2ª edición" → "rio-guapi-2a-edicion". */
export const slugify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "registro";

/** "2025-05-10" ⇄ fecha a medianoche UTC, para que no cambie de día al leerla. */
const dateToText = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : "");

export type AdminEntryRow = {
  id: string;
  title: string;
  type: EntryType;
  period: string;
  status: "draft" | "published";
};

/** Filas de la tabla del panel, de la más reciente a la más antigua. */
export const getAdminEntries = () =>
  db.timelineEntry.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      startYear: true,
      endYear: true,
      participationDate: true,
    },
  });

/** Un registro completo, con la forma que editan las tarjetas. */
export const getAdminEntry = async (id: string): Promise<EntryDraft | null> => {
  // Un id que no es de MongoDB haría fallar la consulta en vez de no encontrar nada.
  if (!/^[a-f0-9]{24}$/.test(id)) return null;

  const entry = await db.timelineEntry.findUnique({
    where: { id },
    include: {
      institutions: { select: { name: true }, orderBy: { name: "asc" } },
      documents: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          title: true,
          kind: true,
          pdfUrl: true,
          pageCount: true,
          // De las páginas solo se usa la primera, como portada.
          pages: true,
        },
      },
    },
  });
  if (!entry) return null;

  return {
    id: entry.id,
    type: entry.type,
    status: entry.status,
    title: entry.title,
    shortDescription: entry.shortDescription,
    startYear: entry.startYear === NO_YEAR ? null : entry.startYear,
    endYear: entry.endYear,
    locationText: entry.locationText,
    latitude: entry.latitude,
    longitude: entry.longitude,
    images: entry.images.map((image) => ({
      url: image.url,
      alt: image.alt,
      credit: image.credit ?? undefined,
    })),
    institutions: entry.institutions.map((institution) => institution.name),
    people: entry.people.map((person) => ({ name: person.name, role: person.role })),
    story: entry.story,
    quote: entry.quote
      ? { text: entry.quote.text, author: entry.quote.author, role: entry.quote.role ?? undefined }
      : null,
    acknowledgements: entry.acknowledgements ?? "",
    documents: entry.documents.map((document) => ({
      id: document.id,
      title: document.title,
      kind: document.kind as DocumentKind,
      pdfUrl: document.pdfUrl,
      pageCount: document.pageCount,
      coverUrl: document.pages[0]?.url ?? "",
    })),
    participationDate: dateToText(entry.participationDate),
    modality: entry.modality,
    reason: entry.reason ?? "",
    speakerName: entry.speakerName ?? "",
    speakerRole: entry.speakerRole ?? "",
    relatedEntryIds: entry.relatedEntryIds,
  };
};

/** Proyectos y participaciones con los que se puede relacionar un registro. */
export const getRelatedOptions = () =>
  db.timelineEntry.findMany({
    where: { type: { in: ["project", "participation"] } },
    orderBy: { title: "asc" },
    select: { id: true, title: true, type: true },
  });

/** Instituciones ya registradas, para sugerirlas y no duplicarlas. */
export const getInstitutionNames = async () => {
  const institutions = await db.timelineInstitution.findMany({
    orderBy: { name: "asc" },
    select: { name: true },
  });
  return institutions.map((institution) => institution.name);
};
