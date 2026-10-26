/**
 * Formas de un proyecto y de sus documentos tal como los pintan las páginas
 * de `/trayectoria`. Los datos salen de la base de datos (`lib/timeline-data.ts`)
 * y se editan en el panel de profesor (`/teacher/trayectoria`).
 *
 * Este archivo solo tiene tipos y funciones puras: lo usan el servidor y el
 * navegador.
 */

export type ProjectImage = { src: string; alt: string; credit?: string };

/** Una página de un documento, como imagen para el visor. */
export type DocumentPage = {
  url: string;
  /** Versión de mayor resolución para el zoom. Sin ella, el zoom usa `url`. */
  urlLarge?: string;
};

export type ProjectDocument = {
  /** Identificador dentro del proyecto; forma la dirección del visor. */
  id: string;
  title: string;
  /** "Periódico", "Revista", "Cartilla", "Informe"… */
  kind: string;
  description?: string;
  /** PDF original, para la descarga. */
  pdf: string;
  pageCount: number;
  /** Las páginas como imágenes, en orden. */
  pages: DocumentPage[];
  /** Tamaño de una página en píxeles; da la proporción de la hoja al visor. */
  pageWidth: number;
  pageHeight: number;
  /** Informes: se listan aparte de las publicaciones y los entregables. */
  isReport: boolean;
};

/** Portada de un documento: su primera página. */
export const coverUrl = (doc: ProjectDocument) => doc.pages[0].url;

export type Project = {
  /** La dirección del proyecto: /trayectoria/<id>. */
  id: string;
  title: string;
  place: string;
  /** "2024", "2024 – 2026" o "2024 – actual". */
  year: string;
  description: string;
  /** Los lugares del proyecto, cada uno como [longitud, latitud]. */
  points: [number, number][];
  /** Nombres de esos lugares, en el mismo orden. */
  placeNames: string[];
  images: ProjectImage[];
  href: string;
  externalLink?: { href: string; label: string };
  /** Todos los documentos del proyecto, en su orden. */
  documents: ProjectDocument[];
  /** Publicación destacada: el primer periódico, revista, entregable o similar. */
  publication?: ProjectDocument;
  institutions: string[];
  people: { name: string; role: string }[];
  story?: { title: string; paragraphs: string[] };
  quote?: { text: string; author: string; role?: string };
  acknowledgements?: string;
  /** Participaciones y alianzas ligadas al proyecto (no tienen página propia). */
  related: { type: "participacion" | "alianza"; title: string; detail?: string }[];
};

export const getDocument = (project: Project, documentId: string) =>
  project.documents.find((d) => d.id === documentId);

/** Desde dónde se abrió el visor, para que "Volver" regrese al mismo lugar. */
export type ReaderOrigin = "publicaciones";

export const readerHref = (
  project: Pick<Project, "href">,
  doc: ProjectDocument,
  from?: ReaderOrigin
) => `${project.href}/lector/${doc.id}${from ? `?desde=${from}` : ""}`;
