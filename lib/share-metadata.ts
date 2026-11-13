/**
 * Vista previa de un enlace en redes sociales. Las redes no leen siempre WebP,
 * así que las fotos pasan por `/api/share-image`, que las entrega en JPEG.
 */
import type { Metadata } from "next";

export const SITE_NAME = "Aula STEAM Sonny Jiménez";

export const SHAREABLE_IMAGE = /^https:\/\/([a-z0-9-]+\.)?(ufs\.sh|utfs\.io)\/f\/[\w-]+$/i;

const SIZE = { width: 1200, height: 630 };

const DEFAULT_IMAGE = { url: "/og-aula-steam.png", ...SIZE, alt: SITE_NAME };

const shareImage = (sources: (string | null | undefined)[], alt: string) => {
  const src = sources.find((source) => source && SHAREABLE_IMAGE.test(source));
  return src
    ? { url: `/api/share-image?src=${encodeURIComponent(src)}`, ...SIZE, alt }
    : DEFAULT_IMAGE;
};

type ShareInput = {
  title: string;
  description?: string;
  path: string;
  /** En orden de preferencia: se usa la primera que se pueda adaptar. */
  images?: (string | null | undefined)[];
  article?: { publishedTime?: string; authors?: string[] };
};

export const shareMetadata = ({
  title,
  description,
  path,
  images = [],
  article,
}: ShareInput): Metadata => {
  const image = shareImage(images, title);
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      siteName: SITE_NAME,
      locale: "es_CO",
      url: path,
      title,
      description,
      images: [image],
      ...(article ? { type: "article", ...article } : { type: "website" }),
    },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
};

/** Sin `url` ni dirección canónica: las heredarían todas las páginas. */
export const defaultShareMetadata = (description: string): Metadata => ({
  openGraph: {
    siteName: SITE_NAME,
    locale: "es_CO",
    type: "website",
    title: SITE_NAME,
    description,
    images: [DEFAULT_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [DEFAULT_IMAGE.url] },
});
