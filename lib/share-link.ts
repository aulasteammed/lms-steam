import toast from "react-hot-toast";

/** Menú de compartir del dispositivo o, si no lo hay, copia el enlace. */
export const sharePage = async (title: string, path?: string) => {
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
