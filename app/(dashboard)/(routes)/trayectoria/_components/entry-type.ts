import { CalendarDays, Handshake, MapPinned, type LucideIcon } from "lucide-react";
import type { EntryType } from "@/lib/timeline";

/**
 * Ícono y color de cada tipo de registro: naranja, el azul del menú del
 * sitio y morado. En la
 * interfaz se usan suaves (fondo claro y texto oscuro del mismo tono) y el
 * color pleno queda para los puntos del mapa (`projects-map.css`) y para el
 * botón principal de la portada.
 */
export const TYPE_STYLES: Record<
  EntryType,
  { icon: LucideIcon; soft: string; dot: string; text: string; button: string }
> = {
  project: {
    icon: MapPinned,
    soft: "bg-orange-100 text-orange-800",
    dot: "bg-orange-600",
    text: "text-orange-700",
    button: "bg-orange-600 hover:bg-orange-700 focus-visible:ring-orange-500",
  },
  participation: {
    icon: CalendarDays,
    soft: "bg-sky-100 text-sky-800",
    dot: "bg-sky-600",
    text: "text-sky-700",
    button: "bg-sky-600 hover:bg-sky-700 focus-visible:ring-sky-500",
  },
  alliance: {
    icon: Handshake,
    soft: "bg-purple-100 text-purple-800",
    dot: "bg-purple-500",
    text: "text-purple-700",
    button: "bg-purple-600 hover:bg-purple-700 focus-visible:ring-purple-500",
  },
};
