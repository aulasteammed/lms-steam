/**
 * Registros del mapa y la línea de tiempo de /trayectoria: proyectos,
 * participaciones y alianzas.
 *
 * `MapEntry` es la lista liviana que recibe el mapa. Tiene la forma del modelo
 * `TimelineEntry` de la base de datos; la arma `lib/timeline-data.ts`.
 */
import type { ProjectDocument, ProjectImage } from "@/lib/projects";

export type EntryType = "project" | "participation" | "alliance";
export type Modality = "in_person" | "virtual" | "hybrid";

export type MapPlace = {
  name: string;
  /** [longitud, latitud], el orden que usa el mapa. */
  coordinates: [number, number];
};

export type MapEntry = {
  id: string;
  type: EntryType;
  /** Nombre del proyecto, de la participación o de la alianza. */
  title: string;
  description: string;
  /** Resumen de la ubicación: "Cauca, Chocó y Antioquia". */
  place: string;
  /** Año de inicio. En participaciones, el año en que ocurrió. */
  startYear: number;
  /** Año de cierre. Sin dato = en curso. */
  endYear?: number;
  /**
   * Lugares del registro: en el mapa sale un punto por cada uno y todos abren
   * la misma tarjeta. Vacío en participaciones virtuales: no van en el mapa.
   */
  places: MapPlace[];
  images: ProjectImage[];

  // ── Solo proyectos ──
  /** Página del proyecto. Las participaciones y alianzas no tienen página. */
  href?: string;
  /** Publicación destacada: periódico, revista o similar. */
  publication?: ProjectDocument;

  // ── Solo participaciones ──
  /** Fecha en que el aula participó, `AAAA-MM-DD`. */
  date?: string;
  modality?: Modality;
  /** Por qué se participó. */
  reason?: string;
  speaker?: { name: string; role?: string };
  /** Quién organizó el evento. */
  organizer?: string;
  /** Instituciones aliadas con las que fue el aula. */
  partners?: string[];

  // ── Participaciones y alianzas ──
  /** Proyectos o participaciones con los que se relaciona el registro. */
  related: { title: string; href?: string }[];
};

export const ENTRY_TYPES: EntryType[] = ["project", "participation", "alliance"];

export const TYPE_LABELS: Record<EntryType, { singular: string; plural: string }> = {
  project: { singular: "Proyecto", plural: "Proyectos" },
  participation: { singular: "Participación", plural: "Participaciones" },
  alliance: { singular: "Alianza", plural: "Alianzas" },
};

export const MODALITY_LABELS: Record<Modality, string> = {
  in_person: "Presencial",
  virtual: "Virtual",
  hybrid: "Híbrida",
};

/**
 * Año en que el registro aparece en la línea de tiempo: el de cierre o, si
 * sigue en curso, el actual. No se guarda, para que lo que está en curso
 * avance solo cada enero.
 */
export const timelineYear = (entry: MapEntry, currentYear: number) =>
  entry.endYear ?? currentYear;

/**
 * "2024", "2024 – 2026" o "2024 – actual". Los espacios del guion no se parten
 * (` `), para que el rango nunca quede cortado en dos líneas.
 */
export const periodLabel = (entry: MapEntry) => {
  if (entry.type === "participation" || entry.endYear === entry.startYear) {
    return String(entry.startYear);
  }
  return `${entry.startYear}\u00a0–\u00a0${entry.endYear ?? "actual"}`;
};

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** "2025-05-10" → "10 de mayo de 2025". */
export const formatDate = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);
  return `${day} de ${MONTHS[month - 1]} de ${year}`;
};
