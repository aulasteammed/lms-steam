/**
 * Proyectos comunitarios del mapa de /proyectos.
 *
 * Los datos se editan en `content/proyectos.json` (ver `content/README.md`).
 * Este archivo los valida al compilar: si falta un campo o un valor está mal
 * escrito, la compilación falla con un mensaje que indica qué corregir.
 */
import { z } from "zod";
import rawProjects from "@/content/proyectos.json";

const slug = /^[a-z0-9-]+$/;

const fotoSchema = z.object({
  archivo: z.string().min(1),
  descripcion: z.string().min(1, "Cada foto necesita una descripción (texto alternativo)"),
  /** Pie de foto visible (autor, año). Opcional. */
  credito: z.string().min(1).optional(),
});

/**
 * Documento del proyecto que se lee en el visor: periódico, revista, informe
 * u otro entregable. Siempre lleva su PDF para poder descargarlo.
 */
const documentoSchema = z.object({
  id: z.string().regex(slug, "El id solo puede tener minúsculas, números y guiones"),
  titulo: z.string().min(1),
  tipo: z.string().min(1),
  descripcion: z.string().min(1).optional(),
  pdf: z.string().min(1, "Cada documento necesita su PDF para la descarga"),
  carpeta: z.string().min(1),
  paginas: z.number().int().positive(),
});

/** Nombres que ya son rutas de la sección y no pueden ser el id de un proyecto. */
const RESERVED_IDS = ["publicaciones"];

const projectSchema = z.object({
  id: z
    .string()
    .regex(slug, "El id solo puede tener minúsculas, números y guiones")
    .refine((id) => !RESERVED_IDS.includes(id), "Ese id está reservado"),
  titulo: z.string().min(1),
  lugar: z.string().min(1),
  anio: z.string().min(1),
  descripcion: z.string().min(1),
  coordenadas: z.object({
    latitud: z.number().min(-5).max(14, "La latitud debe estar dentro de Colombia"),
    longitud: z.number().min(-82).max(-66, "La longitud debe estar dentro de Colombia"),
  }),
  fotos: z
    .array(fotoSchema)
    .min(1, "Cada proyecto necesita al menos una foto")
    .max(2, "Cada proyecto tiene máximo 2 fotos"),
  instituciones: z.array(z.string().min(1)).optional(),
  personas: z
    .array(z.object({ nombre: z.string().min(1), rol: z.string().min(1) }))
    .optional(),
  relato: z
    .object({
      titulo: z.string().min(1),
      parrafos: z.array(z.string().min(1)).min(1),
    })
    .optional(),
  cita: z
    .object({
      texto: z.string().min(1),
      autor: z.string().min(1),
      rol: z.string().min(1).optional(),
    })
    .optional(),
  agradecimientos: z.string().min(1).optional(),
  relacionados: z
    .array(
      z.object({
        tipo: z.enum(["participacion", "alianza"]),
        titulo: z.string().min(1),
        detalle: z.string().min(1).optional(),
      })
    )
    .optional(),
  enlace: z
    .object({ url: z.string().url(), texto: z.string().optional() })
    .optional(),
  documentos: z
    .array(documentoSchema)
    .refine(
      (docs) => new Set(docs.map((d) => d.id)).size === docs.length,
      "Dos documentos del mismo proyecto tienen el mismo id"
    )
    .optional(),
});

export type ProjectImage = { src: string; alt: string; credit?: string };

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
  /** Carpeta con las imágenes de las páginas (subcarpetas md y lg). */
  pagesBase: string;
  /** Informes y entregables: se listan aparte de las publicaciones. */
  isReport: boolean;
};

export type PageSize = "md" | "lg";

/** URL de la imagen de la página `n` (1..pageCount) en el tamaño pedido. */
export const pageUrl = (doc: ProjectDocument, n: number, size: PageSize) =>
  `${doc.pagesBase}/${size}/${String(n).padStart(2, "0")}.webp`;

/** Portada de un documento: su primera página. */
export const coverUrl = (doc: ProjectDocument, size: PageSize = "md") =>
  pageUrl(doc, 1, size);

export type Project = {
  id: string;
  title: string;
  place: string;
  year: string;
  description: string;
  /** [longitud, latitud], el orden que usa el mapa. */
  coordinates: [number, number];
  images: ProjectImage[];
  href: string;
  externalLink?: { href: string; label: string };
  /** Todos los documentos del proyecto, en el orden del JSON. */
  documents: ProjectDocument[];
  /** Publicación destacada: el primer periódico, revista o similar. */
  publication?: ProjectDocument;
  institutions: string[];
  people: { name: string; role: string }[];
  story?: { title: string; paragraphs: string[] };
  quote?: { text: string; author: string; role?: string };
  acknowledgements?: string;
  /** Participaciones y alianzas ligadas al proyecto (no tienen página propia). */
  related: { type: "participacion" | "alianza"; title: string; detail?: string }[];
};

/** Las rutas relativas se buscan en /public/proyectos/<id>/. */
const resolvePath = (id: string, path: string) =>
  path.startsWith("/") || path.startsWith("http")
    ? path
    : `/proyectos/${id}/${path.replace(/^\.?\//, "")}`;

const isReportKind = (kind: string) => /^(informe|entregable)/i.test(kind.trim());

const parsed = z.array(projectSchema).safeParse(rawProjects);
if (!parsed.success) {
  const detail = parsed.error.issues
    .map((i) => `  • proyecto ${i.path.join(" → ")}: ${i.message}`)
    .join("\n");
  throw new Error(`content/proyectos.json tiene errores:\n${detail}`);
}

const ids = parsed.data.map((p) => p.id);
const duplicated = ids.find((id, i) => ids.indexOf(id) !== i);
if (duplicated) {
  throw new Error(`content/proyectos.json: el id "${duplicated}" está repetido`);
}

export const PROJECTS: Project[] = parsed.data.map((p) => {
  const documents: ProjectDocument[] = (p.documentos ?? []).map((d) => ({
    id: d.id,
    title: d.titulo,
    kind: d.tipo,
    description: d.descripcion,
    pdf: resolvePath(p.id, d.pdf),
    pageCount: d.paginas,
    pagesBase: resolvePath(p.id, d.carpeta),
    isReport: isReportKind(d.tipo),
  }));

  return {
    id: p.id,
    title: p.titulo,
    place: p.lugar,
    year: p.anio,
    description: p.descripcion,
    coordinates: [p.coordenadas.longitud, p.coordenadas.latitud],
    images: p.fotos.map((f) => ({
      src: resolvePath(p.id, f.archivo),
      alt: f.descripcion,
      credit: f.credito,
    })),
    href: `/proyectos/${p.id}`,
    externalLink: p.enlace
      ? { href: p.enlace.url, label: p.enlace.texto ?? "Visitar sitio" }
      : undefined,
    documents,
    publication: documents.find((d) => !d.isReport),
    institutions: p.instituciones ?? [],
    people: (p.personas ?? []).map((x) => ({ name: x.nombre, role: x.rol })),
    story: p.relato
      ? { title: p.relato.titulo, paragraphs: p.relato.parrafos }
      : undefined,
    quote: p.cita
      ? { text: p.cita.texto, author: p.cita.autor, role: p.cita.rol }
      : undefined,
    acknowledgements: p.agradecimientos,
    related: (p.relacionados ?? []).map((r) => ({
      type: r.tipo,
      title: r.titulo,
      detail: r.detalle,
    })),
  };
});

export const getProject = (id: string) => PROJECTS.find((p) => p.id === id);

export const getDocument = (project: Project, documentId: string) =>
  project.documents.find((d) => d.id === documentId);

/** Todos los documentos de todos los proyectos, para la estantería. */
export const ALL_DOCUMENTS = PROJECTS.flatMap((project) =>
  project.documents.map((document) => ({ project, document }))
);

const READ_LABELS: Record<string, string> = {
  periódico: "Leer el periódico",
  revista: "Leer la revista",
  cartilla: "Leer la cartilla",
  libro: "Leer el libro",
  informe: "Leer el informe",
};

/** Texto del botón para abrir el visor, según el tipo de documento. */
export const readLabel = (doc: ProjectDocument) =>
  READ_LABELS[doc.kind.toLowerCase()] ?? "Leer el documento";

/** Desde dónde se abrió el visor, para que "Volver" regrese al mismo lugar. */
export type ReaderOrigin = "publicaciones";

export const readerHref = (
  project: Project,
  doc: ProjectDocument,
  from?: ReaderOrigin
) => `${project.href}/lector/${doc.id}${from ? `?desde=${from}` : ""}`;
