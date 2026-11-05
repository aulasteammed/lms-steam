"use client";

import { Share2 } from "lucide-react";

import { sharePage } from "@/lib/share-link";

type ShareButtonProps = {
  title: string;
  /** Ruta a compartir; por defecto, la página actual. */
  path?: string;
};

/**
 * Comparte la página con el menú del dispositivo (celular) o copia el enlace.
 */
export const ShareButton = ({ title, path }: ShareButtonProps) => (
  <button
    type="button"
    onClick={() => sharePage(title, path)}
    className="inline-flex h-9 items-center gap-2 rounded-lg border border-editorial-line bg-white px-3 text-sm font-medium text-editorial-body transition hover:bg-editorial-paper"
  >
    <Share2 className="h-4 w-4" />
    Compartir
  </button>
);
