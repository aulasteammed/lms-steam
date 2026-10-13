"use server";

/**
 * Escrituras del panel de profesor sobre los registros del mapa y la línea de
 * tiempo. Cada acción responde `{ ok }` en vez de lanzar el error, para que el
 * panel pueda mostrar el mensaje también en producción.
 */
import { auth } from "@clerk/nextjs/server";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { UTApi } from "uploadthing/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { isTeacher } from "@/lib/teacher";
import { NO_YEAR, getAdminEntry, slugify } from "@/lib/timeline-admin";
import {
  SHORT_DESCRIPTION_MAX,
  maxImages,
  requiredFields,
  type DraftDocument,
  type EntryPatch,
} from "@/app/(dashboard)/(routes)/teacher/proyectos/_components/draft";

type Result<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

const LIST_PATH = "/teacher/proyectos";
/** Nombres que ya son rutas de `/proyectos` y no pueden ser la dirección de un registro. */
const RESERVED_SLUGS = ["publicaciones"];

const utapi = new UTApi();

const fail = (error: string): Result<never> => ({ ok: false, error });
const done = <T,>(data: T): Result<T> => ({ ok: true, data });

const isAllowed = async () => {
  const { userId } = await auth();
  return isTeacher(userId);
};

const objectId = z.string().regex(/^[a-f0-9]{24}$/);
/** Solo se aceptan archivos que subió el propio panel a UploadThing. */
const uploadUrl = z.string().regex(/^https:\/\/([a-z0-9-]+\.)?(ufs\.sh|utfs\.io)\/f\/[\w-]+$/i);
const text = (max: number) => z.string().trim().max(max);

/** Borra archivos de UploadThing después de responder, para no demorar el guardado. */
const deleteFilesLater = (urls: string[]) => {
  const keys = urls.filter((url) => uploadUrl.safeParse(url).success).map((url) => url.split("/f/")[1]);
  if (keys.length === 0) return;
  after(async () => {
    try {
      await utapi.deleteFiles(keys);
    } catch (error) {
      console.error("[TIMELINE] No se pudieron borrar archivos:", keys, error);
    }
  });
};

/** Primera dirección libre: "entre-aguas-2026", "entre-aguas-2026-2"… */
const uniqueSlug = async (base: string, ownId?: string) => {
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    if (RESERVED_SLUGS.includes(candidate)) continue;
    const taken = await db.timelineEntry.findFirst({
      where: {
        OR: [{ slug: candidate }, { previousSlugs: { has: candidate } }],
        ...(ownId ? { NOT: { id: ownId } } : {}),
      },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
};

const createSchema = z.object({
  type: z.enum(["project", "participation", "alliance"]),
  title: text(200).min(1),
});

export async function createEntry(input: z.infer<typeof createSchema>): Promise<Result<{ id: string }>> {
  if (!(await isAllowed())) return fail("No autorizado");
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return fail("Elige el tipo y escribe el nombre");

  try {
    const entry = await db.timelineEntry.create({
      data: {
        type: parsed.data.type,
        title: parsed.data.title,
        slug: await uniqueSlug(slugify(parsed.data.title)),
        shortDescription: "",
        startYear: NO_YEAR,
        locationText: "",
      },
      select: { id: true },
    });
    revalidatePath(LIST_PATH);
    return done({ id: entry.id });
  } catch (error) {
    console.error("[TIMELINE_CREATE]", error);
    return fail("No se pudo crear el registro");
  }
}

const year = z.number().int().min(1900).max(2100);

const patchSchema = z
  .object({
    title: text(200).min(1),
    shortDescription: text(SHORT_DESCRIPTION_MAX),
    startYear: year,
    endYear: year.nullable(),
    locationText: text(200),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    images: z
      .array(z.object({ url: uploadUrl, alt: text(300).min(1), credit: text(120).optional() }))
      .max(2),
    institutions: z.array(text(200).min(1)).max(30),
    people: z.array(z.object({ name: text(120).min(1), role: text(120).min(1) })).max(40),
    story: z
      .object({ title: text(200).min(1), paragraphs: z.array(text(5000).min(1)).min(1).max(40) })
      .nullable(),
    quote: z
      .object({ text: text(600).min(1), author: text(120).min(1), role: text(120).optional() })
      .nullable(),
    acknowledgements: text(2000),
    participationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    modality: z.enum(["in_person", "virtual", "hybrid"]).nullable(),
    reason: text(1000),
    speakerName: text(120),
    speakerRole: text(120),
    relatedEntryIds: z.array(objectId).max(50),
  })
  .partial()
  .strict();

/** Guarda los campos de una tarjeta. */
export async function updateEntry(id: string, patch: EntryPatch): Promise<Result> {
  if (!(await isAllowed())) return fail("No autorizado");
  const parsed = patchSchema.safeParse(patch);
  if (!objectId.safeParse(id).success || !parsed.success) return fail("Hay un dato que no es válido");
  const input = parsed.data;

  try {
    const current = await db.timelineEntry.findUnique({
      where: { id },
      select: {
        type: true,
        title: true,
        slug: true,
        endYear: true,
        publishedAt: true,
        images: { select: { url: true } },
      },
    });
    if (!current) return fail("El registro ya no existe");
    if (input.images && input.images.length > maxImages(current.type)) {
      return fail("Son más imágenes de las permitidas");
    }

    const { institutions, story, quote, images, participationDate, ...plain } = input;
    const data: Prisma.TimelineEntryUpdateInput = {
      ...plain,
      // Los textos opcionales vacíos se guardan como "sin dato".
      ...(plain.acknowledgements !== undefined && { acknowledgements: plain.acknowledgements || null }),
      ...(plain.reason !== undefined && { reason: plain.reason || null }),
      ...(plain.speakerName !== undefined && { speakerName: plain.speakerName || null }),
      ...(plain.speakerRole !== undefined && { speakerRole: plain.speakerRole || null }),
    };

    if (participationDate !== undefined) data.participationDate = new Date(participationDate);
    if (story !== undefined) data.story = story ? { set: story } : { unset: true };
    if (quote !== undefined) {
      data.quote = quote ? { set: { ...quote, role: quote.role || null } } : { unset: true };
    }
    if (images !== undefined) {
      data.images = images.map((image) => ({ ...image, credit: image.credit || null }));
    }

    if (institutions !== undefined) {
      // Cada institución se registra una sola vez: se busca por su nombre sin
      // tildes ni mayúsculas y solo se crea si no existe.
      const names = [...new Map(institutions.map((name) => [slugify(name), name])).entries()];
      const saved = await Promise.all(
        names.map(([slug, name]) =>
          db.timelineInstitution.upsert({
            where: { slug },
            update: {},
            create: { name, slug },
            select: { id: true },
          })
        )
      );
      data.institutions = { set: saved.map((institution) => ({ id: institution.id })) };
    }

    // La dirección lleva el año de cierre. Mientras el registro no se haya
    // publicado sigue al título; después solo cambia al cerrarse (gana el año)
    // y la dirección anterior queda guardada para redirigir.
    const title = input.title ?? current.title;
    const endYear = input.endYear !== undefined ? input.endYear : current.endYear;
    if (!current.publishedAt) {
      if (input.title !== undefined || input.endYear !== undefined) {
        data.slug = await uniqueSlug(slugify(title) + (endYear ? `-${endYear}` : ""), id);
      }
    } else if (current.endYear === null && endYear !== null) {
      data.slug = await uniqueSlug(`${current.slug}-${endYear}`, id);
      data.previousSlugs = { push: current.slug };
    }

    await db.timelineEntry.update({ where: { id }, data, select: { id: true } });

    if (images !== undefined) {
      const kept = new Set(images.map((image) => image.url));
      deleteFilesLater(current.images.map((image) => image.url).filter((url) => !kept.has(url)));
    }
    // Solo estos campos se ven en la tabla; los demás no la invalidan.
    if (
      input.title !== undefined ||
      input.startYear !== undefined ||
      input.endYear !== undefined ||
      participationDate !== undefined
    ) {
      revalidatePath(LIST_PATH);
    }
    return done(undefined);
  } catch (error) {
    console.error("[TIMELINE_UPDATE]", error);
    return fail("No se pudo guardar");
  }
}

export async function setEntryPublished(id: string, published: boolean): Promise<Result> {
  if (!(await isAllowed())) return fail("No autorizado");

  try {
    const draft = await getAdminEntry(id);
    if (!draft) return fail("El registro ya no existe");

    if (published) {
      const missing = requiredFields(draft).filter((field) => !field.done);
      if (missing.length > 0) {
        return fail(`Falta: ${missing.map((field) => field.label.toLowerCase()).join(", ")}`);
      }
    }

    const current = await db.timelineEntry.findUnique({ where: { id }, select: { publishedAt: true } });
    await db.timelineEntry.update({
      where: { id },
      data: {
        status: published ? "published" : "draft",
        // Se conserva la fecha de la primera publicación.
        ...(published && !current?.publishedAt && { publishedAt: new Date() }),
      },
      select: { id: true },
    });
    revalidatePath(LIST_PATH);
    return done(undefined);
  } catch (error) {
    console.error("[TIMELINE_PUBLISH]", error);
    return fail("No se pudo cambiar el estado");
  }
}

export async function deleteEntry(id: string): Promise<Result> {
  if (!(await isAllowed())) return fail("No autorizado");
  if (!objectId.safeParse(id).success) return fail("El registro ya no existe");

  try {
    const entry = await db.timelineEntry.findUnique({
      where: { id },
      select: {
        images: { select: { url: true } },
        documents: { select: { pdfUrl: true, pages: true } },
      },
    });
    if (!entry) return fail("El registro ya no existe");

    // Lo que apuntaba a este registro: sus instituciones y los registros relacionados.
    const pointing = await db.timelineEntry.findMany({
      where: { relatedEntryIds: { has: id } },
      select: { id: true, relatedEntryIds: true },
    });
    await Promise.all([
      db.timelineEntry.update({
        where: { id },
        data: { institutions: { set: [] } },
        select: { id: true },
      }),
      ...pointing.map((other) =>
        db.timelineEntry.update({
          where: { id: other.id },
          data: { relatedEntryIds: other.relatedEntryIds.filter((related) => related !== id) },
          select: { id: true },
        })
      ),
    ]);
    await db.timelineEntry.delete({ where: { id }, select: { id: true } });

    deleteFilesLater([
      ...entry.images.map((image) => image.url),
      ...entry.documents.flatMap((document) => [
        document.pdfUrl,
        ...document.pages.map((page) => page.url),
      ]),
    ]);
    revalidatePath(LIST_PATH);
    return done(undefined);
  } catch (error) {
    console.error("[TIMELINE_DELETE]", error);
    return fail("No se pudo eliminar");
  }
}

const documentSchema = z.object({
  title: text(200).min(1),
  kind: z.enum(["newspaper", "magazine", "booklet", "book", "deliverable", "report", "other"]),
  pdfUrl: uploadUrl,
  pdfSizeBytes: z.number().int().positive(),
  /** Las páginas ya convertidas a imagen, en orden. */
  pages: z.array(uploadUrl).min(1).max(300),
  pageWidth: z.number().int().positive(),
  pageHeight: z.number().int().positive(),
});

/** Registra un documento cuyo PDF y páginas ya se subieron. */
export async function addDocument(
  entryId: string,
  input: z.infer<typeof documentSchema>
): Promise<Result<DraftDocument>> {
  if (!(await isAllowed())) return fail("No autorizado");
  const parsed = documentSchema.safeParse(input);
  if (!objectId.safeParse(entryId).success || !parsed.success) {
    return fail("El documento no es válido");
  }
  const { pages, ...fields } = parsed.data;

  try {
    const entry = await db.timelineEntry.findUnique({
      where: { id: entryId },
      select: { type: true, documents: { select: { slug: true, position: true } } },
    });
    if (!entry) return fail("El registro ya no existe");
    if (entry.type !== "project") return fail("Solo los proyectos tienen documentos");

    const taken = new Set(entry.documents.map((document) => document.slug));
    const base = slugify(fields.title);
    let slug = base;
    for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;

    const document = await db.timelineDocument.create({
      data: {
        ...fields,
        entryId,
        slug,
        pages: pages.map((url) => ({ url })),
        pageCount: pages.length,
        position: Math.max(-1, ...entry.documents.map((existing) => existing.position)) + 1,
      },
      select: { id: true },
    });

    return done({
      id: document.id,
      title: fields.title,
      kind: fields.kind,
      pdfUrl: fields.pdfUrl,
      pageCount: pages.length,
      coverUrl: pages[0],
    });
  } catch (error) {
    console.error("[TIMELINE_DOCUMENT_ADD]", error);
    return fail("No se pudo guardar el documento");
  }
}

export async function deleteDocument(documentId: string): Promise<Result> {
  if (!(await isAllowed())) return fail("No autorizado");
  if (!objectId.safeParse(documentId).success) return fail("El documento ya no existe");

  try {
    const document = await db.timelineDocument.delete({
      where: { id: documentId },
      select: { pdfUrl: true, pages: true },
    });
    deleteFilesLater([document.pdfUrl, ...document.pages.map((page) => page.url)]);
    return done(undefined);
  } catch (error) {
    console.error("[TIMELINE_DOCUMENT_DELETE]", error);
    return fail("No se pudo eliminar el documento");
  }
}

/** Borra archivos recién subidos cuando el guardado que los iba a usar falló. */
export async function discardUploads(urls: string[]): Promise<void> {
  if (!(await isAllowed())) return;
  deleteFilesLater(urls.slice(0, 400));
}
