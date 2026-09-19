/**
 * Proyectos comunitarios del mapa de /proyectos.
 *
 * Los datos se editan en `content/proyectos.json` (ver `content/README.md`).
 * Este archivo los valida al compilar: si falta un campo o un valor está mal
 * escrito, la compilación falla con un mensaje que indica qué corregir.
 */
import { z } from "zod";
import rawProjects from "@/content/proyectos.json";

const fotoSchema = z.object({
  archivo: z.string().min(1),
  descripcion: z.string().min(1, "Cada foto necesita una descripción (texto alternativo)"),
});

const projectSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9-]+$/, "El id solo puede tener minúsculas, números y guiones"),
  titulo: z.string().min(1),
  lugar: z.string().min(1),
  anio: z.string().min(1),
  descripcion: z.string().min(1),
  coordenadas: z.object({
    latitud: z.number().min(-5).max(14, "La latitud debe estar dentro de Colombia"),
    longitud: z.number().min(-82).max(-66, "La longitud debe estar dentro de Colombia"),
  }),
  fotos: z.array(fotoSchema).min(1, "Cada proyecto necesita al menos una foto"),
  enlace: z
    .object({ url: z.string().url(), texto: z.string().optional() })
    .optional(),
  publicacion: z
    .object({
      titulo: z.string().min(1),
      pdf: z.string().min(1).optional(),
      carpeta: z.string().min(1),
      paginas: z.number().int().positive(),
    })
    .optional(),
});

export type ProjectImage = { src: string; alt: string };

export type ProjectPublication = {
  title: string;
  /** PDF original (opcional; hoy no se muestra en la página). */
  pdf?: string;
  pageCount: number;
  /** Carpeta con las imágenes de las páginas (subcarpetas md y lg). */
  pagesBase: string;
};

export type PageSize = "md" | "lg";

/** URL de la imagen de la página `n` (1..pageCount) en el tamaño pedido. */
export const pageUrl = (pub: ProjectPublication, n: number, size: PageSize) =>
  `${pub.pagesBase}/${size}/${String(n).padStart(2, "0")}.webp`;

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
  publication?: ProjectPublication;
};

/** Las rutas relativas se buscan en /public/proyectos/<id>/. */
const resolvePath = (id: string, path: string) =>
  path.startsWith("/") || path.startsWith("http")
    ? path
    : `/proyectos/${id}/${path.replace(/^\.?\//, "")}`;

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
  const pub = p.publicacion;
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
    })),
    href: `/proyectos/${p.id}`,
    externalLink: p.enlace
      ? { href: p.enlace.url, label: p.enlace.texto ?? "Visitar sitio" }
      : undefined,
    publication: pub
      ? {
          title: pub.titulo,
          pdf: pub.pdf ? resolvePath(p.id, pub.pdf) : undefined,
          pageCount: pub.paginas,
          pagesBase: resolvePath(p.id, pub.carpeta),
        }
      : undefined,
  };
});

export const getProject = (id: string) => PROJECTS.find((p) => p.id === id);
