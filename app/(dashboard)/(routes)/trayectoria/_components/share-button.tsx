"use client";

import { Share2 } from "lucide-react";
import toast from "react-hot-toast";

type ShareButtonProps = {
  title: string;
  /** Ruta a compartir; por defecto, la página actual. */
  path?: string;
};

/**
 * Comparte la página con el menú del dispositivo (celular) o copia el enlace.
 */
export const ShareButton = ({ title, path }: ShareButtonProps) => {
  const share = async () => {
    const url = path ? new URL(path, window.location.origin).href : window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // la persona cerró el menú
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado");
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
    >
      <Share2 className="h-4 w-4" />
      Compartir
    </button>
  );
};
