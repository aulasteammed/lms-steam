import sharp from "sharp";
import type { NextRequest } from "next/server";

import { SHAREABLE_IMAGE } from "@/lib/share-metadata";

/**
 * Foto de UploadThing recortada a 1200 × 630 en JPEG. Solo acepta UploadThing
 * para no servir de puente hacia cualquier dirección; sus archivos no cambian
 * de contenido, por eso la caché de un año.
 */
export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get("src") ?? "";
  if (!SHAREABLE_IMAGE.test(src)) {
    return new Response("Imagen no permitida", { status: 400 });
  }

  try {
    const upstream = await fetch(src);
    if (!upstream.ok) return new Response("No se encontró la imagen", { status: 404 });

    const image = await sharp(Buffer.from(await upstream.arrayBuffer()))
      .rotate()
      .resize(1200, 630, { fit: "cover", position: "attention" })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();

    return new Response(new Uint8Array(image), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[SHARE_IMAGE]", src, error);
    return new Response("No se pudo preparar la imagen", { status: 500 });
  }
}
