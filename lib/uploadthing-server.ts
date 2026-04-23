import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

function normalizeUploadThingUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

export function extractUploadThingFileKey(url?: string | null): string | null {
  if (!url) return null;

  const parsedUrl = normalizeUploadThingUrl(url);
  if (!parsedUrl) return null;

  const filePathIndex = parsedUrl.pathname.indexOf("/f/");
  if (filePathIndex === -1) return null;

  const fileKey = parsedUrl.pathname.slice(filePathIndex + 3).split("/")[0];
  return fileKey || null;
}

export function isUploadThingUrl(url?: string | null): boolean {
  return extractUploadThingFileKey(url) !== null;
}

export async function deleteUploadThingFilesByUrls(urls: Array<string | null | undefined>) {
  const fileKeys = Array.from(
    new Set(
      urls
        .map((url) => extractUploadThingFileKey(url))
        .filter((fileKey): fileKey is string => Boolean(fileKey))
    )
  );

  if (fileKeys.length === 0) return;

  await utapi.deleteFiles(fileKeys);
}

export function extractArticleUploadThingUrls(article: {
  coverImage?: string | null;
  authorPhoto?: string | null;
  blocks?: unknown;
}) {
  const urls = [article.coverImage, article.authorPhoto];

  if (Array.isArray(article.blocks)) {
    for (const block of article.blocks) {
      if (
        block &&
        typeof block === "object" &&
        "imageUrl" in block &&
        typeof block.imageUrl === "string"
      ) {
        urls.push(block.imageUrl);
      }
    }
  }

  return urls;
}
