import { CalendarDays, Handshake, MapPinned, type LucideIcon } from "lucide-react";
import type { EntryType } from "@/lib/timeline";

/**
 * Ícono y color de cada tipo de registro, de la paleta editorial
 * (`tailwind.config.js`): el naranja del blog, el azul del menú del sitio y el
 * azul del identificador. En la interfaz se usan suaves (fondo claro y texto
 * oscuro del mismo tono) y el color pleno queda para los puntos del mapa
 * (`projects-map.css`) y para el botón principal de la portada. Los tres
 * cumplen WCAG AA con texto blanco.
 */
export const TYPE_STYLES: Record<
  EntryType,
  { icon: LucideIcon; soft: string; dot: string; text: string; button: string }
> = {
  project: {
    icon: MapPinned,
    soft: "bg-editorial-accent-soft text-editorial-cta-hover",
    dot: "bg-editorial-cta",
    text: "text-editorial-cta",
    button: "bg-editorial-cta hover:bg-editorial-cta-hover focus-visible:ring-editorial-accent",
  },
  participation: {
    icon: CalendarDays,
    soft: "bg-sky-50 text-sky-800",
    dot: "bg-sky-700",
    text: "text-sky-700",
    button: "bg-sky-700 hover:bg-sky-800 focus-visible:ring-sky-600",
  },
  alliance: {
    icon: Handshake,
    soft: "bg-editorial-identity-soft text-editorial-identity",
    dot: "bg-editorial-identity",
    text: "text-editorial-identity",
    button: "bg-editorial-identity hover:bg-editorial-identity-hover focus-visible:ring-editorial-identity",
  },
};
