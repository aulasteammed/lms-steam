/**
 * Registro tal como lo edita el panel: el modelo `TimelineEntry` de la base de
 * datos, aplanado para los formularios. Lo arma `lib/timeline-admin.ts` y lo
 * guardan las acciones de `actions/timeline.ts`.
 *
 * Este archivo no importa nada del servidor: lo usan las dos partes.
 */
import type { EntryType, Modality } from "@/lib/timeline";

export type DraftImage = { url: string; alt: string; credit?: string };
export type DraftPerson = { name: string; role: string };
/** Un lugar del registro: su nombre y su punto en el mapa. */
export type DraftLocation = { name: string; latitude: number; longitude: number };

export type DocumentKind =
  | "newspaper"
  | "magazine"
  | "booklet"
  | "book"
  | "deliverable"
  | "report"
  | "other";

export type DraftDocument = {
  id: string;
  title: string;
  kind: DocumentKind;
  pdfUrl: string;
  pageCount: number;
  /** Primera página, como portada. */
  coverUrl: string;
};

export type EntryDraft = {
  id: string;
  type: EntryType;
  status: "draft" | "published";
  title: string;
  shortDescription: string;
  startYear: number | null;
  /** `null` = en curso. */
  endYear: number | null;
  /** Resumen de la ubicación: "Cauca, Chocó y Antioquia". */
  locationText: string;
  /** Lugares del registro; vacío en participaciones virtuales. */
  locations: DraftLocation[];
  images: DraftImage[];
  /** Nombres de las instituciones. */
  institutions: string[];

  // ── Solo proyectos ──
  people: DraftPerson[];
  story: { title: string; paragraphs: string[] } | null;
  quote: { text: string; author: string; role?: string } | null;
  acknowledgements: string;
  documents: DraftDocument[];

  // ── Solo participaciones ──
  /** `AAAA-MM-DD`. */
  participationDate: string;
  modality: Modality | null;
  reason: string;
  speakerName: string;
  speakerRole: string;

  // ── Participaciones y alianzas ──
  relatedEntryIds: string[];
};

/** Lo que guarda una tarjeta. Los documentos se guardan aparte, uno por uno. */
export type EntryPatch = Partial<
  Omit<EntryDraft, "id" | "type" | "status" | "documents">
>;

export const SHORT_DESCRIPTION_MAX = 250;

/** Cuántos lugares (puntos en el mapa) puede tener un registro. */
export const MAX_LOCATIONS = 6;

/** Proyectos: 2 imágenes. Participaciones y alianzas: 1. */
export const maxImages = (type: EntryType) => (type === "project" ? 2 : 1);

export const DOCUMENT_KIND_LABELS: Record<DocumentKind, string> = {
  newspaper: "Periódico",
  magazine: "Revista",
  booklet: "Cartilla",
  book: "Libro",
  deliverable: "Entregable",
  report: "Informe",
  other: "Otro",
};

/**
 * Publicaciones y entregables: lo que el proyecto produjo. Se destacan con su
 * portada, y el primero va en el encabezado de la página del proyecto.
 */
export const FEATURED_KINDS: DocumentKind[] = [
  "newspaper",
  "magazine",
  "booklet",
  "book",
  "deliverable",
  "other",
];

/** Los informes cuentan cómo se hizo el proyecto: van aparte, en una lista. */
export const isReport = (kind: DocumentKind) => kind === "report";

/** "2024", "2024 – 2026", "2024 – actual" o "Sin periodo". */
export const draftPeriodLabel = (
  draft: Pick<EntryDraft, "type" | "participationDate" | "startYear" | "endYear">
) => {
  if (draft.type === "participation") {
    return draft.participationDate ? draft.participationDate.slice(0, 4) : "Sin fecha";
  }
  if (!draft.startYear) return "Sin periodo";
  if (draft.endYear === draft.startYear) return String(draft.startYear);
  return `${draft.startYear} – ${draft.endYear ?? "actual"}`;
};

/** Lo mínimo para publicar. El resto de los campos es opcional. */
export const requiredFields = (draft: EntryDraft) => {
  const isVirtual = draft.type === "participation" && draft.modality === "virtual";
  const fields = [
    { label: "Título", done: draft.title.trim().length > 0 },
    { label: "Descripción corta", done: draft.shortDescription.trim().length > 0 },
    draft.type === "participation"
      ? { label: "Fecha y modalidad", done: Boolean(draft.participationDate && draft.modality) }
      : { label: "Periodo", done: draft.startYear !== null },
    {
      label: "Ubicación",
      done:
        draft.locationText.trim().length > 0 &&
        (isVirtual || draft.locations.length > 0),
    },
    { label: "Imagen", done: draft.images.length > 0 },
  ];
  if (draft.type === "alliance") {
    fields.push({ label: "Institución aliada", done: draft.institutions.length > 0 });
  }
  return fields;
};
