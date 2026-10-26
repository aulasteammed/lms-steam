/**
 * Subida de archivos del panel de `/teacher/trayectoria`, desde el navegador.
 *
 * Las fotos se reducen y se pasan a WebP antes de subirlas, y de cada PDF se
 * dibujan sus páginas como imágenes para el visor. Así el archivo original de
 * varios megas nunca llega al visitante y no hace falta un servidor que convierta.
 */
import { uploadFiles } from "@/lib/uploadthing";

/** Lado mayor de una foto ya reducida. */
const IMAGE_MAX_SIDE = 1600;
/** Ancho de una página en el visor: un solo tamaño por documento. */
const PAGE_WIDTH = 1400;
/** Cuántas páginas van en cada subida (el tope de `timelinePage`). */
const PAGES_PER_UPLOAD = 12;

const canvasToFile = async (canvas: HTMLCanvasElement, name: string, quality: number) => {
  const toBlob = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

  let blob = await toBlob("image/webp");
  // Un navegador que no sabe escribir WebP devuelve PNG: ahí se usa JPEG.
  if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg");
  if (!blob) throw new Error("No se pudo preparar la imagen");

  const extension = blob.type === "image/webp" ? "webp" : "jpg";
  return new File([blob], `${name}.${extension}`, { type: blob.type });
};

/** Reduce una foto a 1600 px de lado mayor y la pasa a WebP. */
export const compressImage = async (file: File) => {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, IMAGE_MAX_SIDE / Math.max(bitmap.width, bitmap.height));

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return canvasToFile(canvas, file.name.replace(/\.[^.]+$/, "") || "imagen", 0.82);
};

/** Comprime y sube fotos; devuelve sus direcciones en el mismo orden. */
export const uploadImages = async (files: File[]) => {
  if (files.length === 0) return [];
  const compressed = await Promise.all(files.map(compressImage));
  const uploaded = await uploadFiles("timelineImage", { files: compressed, input: {} });
  return uploaded.map((file) => file.ufsUrl);
};

export type UploadedDocument = {
  pdfUrl: string;
  pdfSizeBytes: number;
  pages: string[];
  pageWidth: number;
  pageHeight: number;
};

type DocumentProgress = { done: number; total: number };

/**
 * Sube un PDF y sus páginas como imágenes. Las páginas se suben por tandas
 * mientras se siguen dibujando las siguientes, y el PDF viaja en paralelo.
 *
 * Si algo falla, el error trae en `uploaded` lo que alcanzó a subirse, para borrarlo.
 */
export const uploadDocument = async (
  file: File,
  onProgress: (progress: DocumentProgress) => void
): Promise<UploadedDocument> => {
  const uploadedUrls: string[] = [];
  /** Subidas en marcha: si algo falla se esperan, para saber qué quedó arriba. */
  const pending: Promise<unknown>[] = [];

  try {
    // La librería del PDF pesa: solo se descarga cuando alguien sube un documento.
    const pdfjs = await import("pdfjs-dist");
    // Copia de `pdfjs-dist/build/pdf.worker.min.mjs`; debe ser de la misma versión.
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const total = pdf.numPages;
    let done = 0;
    onProgress({ done, total });

    const pdfUpload = uploadFiles("timelinePdf", { files: [file], input: {} }).then(([uploaded]) => {
      uploadedUrls.push(uploaded.ufsUrl);
      return uploaded.ufsUrl;
    });
    pending.push(pdfUpload);

    const uploadBatch = async (batch: File[]) => {
      const uploaded = await uploadFiles("timelinePage", { files: batch, input: {} });
      const urls = uploaded.map((page) => page.ufsUrl);
      uploadedUrls.push(...urls);
      done += urls.length;
      onProgress({ done, total });
      return urls;
    };

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No se pudo preparar el documento");

    const uploads: Promise<string[]>[] = [];
    let batch: File[] = [];
    let pageWidth = 0;
    let pageHeight = 0;

    for (let number = 1; number <= total; number++) {
      const page = await pdf.getPage(number);
      const natural = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: PAGE_WIDTH / natural.width });
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      if (number === 1) {
        pageWidth = canvas.width;
        pageHeight = canvas.height;
      }

      await page.render({ canvasContext: context, viewport }).promise;
      batch.push(await canvasToFile(canvas, `pagina-${String(number).padStart(3, "0")}`, 0.8));
      page.cleanup();

      if (batch.length === PAGES_PER_UPLOAD || number === total) {
        const upload = uploadBatch(batch);
        uploads.push(upload);
        pending.push(upload);
        batch = [];
      }
    }

    const [pdfUrl, pages] = await Promise.all([pdfUpload, Promise.all(uploads)]);
    await pdf.destroy();

    return { pdfUrl, pdfSizeBytes: file.size, pages: pages.flat(), pageWidth, pageHeight };
  } catch (error) {
    await Promise.allSettled(pending);
    throw Object.assign(new Error("No se pudo subir el documento", { cause: error }), {
      uploaded: uploadedUrls,
    });
  }
};
