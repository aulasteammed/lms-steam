import { Handshake, Presentation, Users, type LucideIcon } from "lucide-react";
import type { EntryType } from "@/lib/timeline";

export const TYPE_STYLES: Record<
  EntryType,
  { icon: LucideIcon; soft: string; dot: string; text: string; button: string }
> = {
  project: {
    icon: Users,
    soft: "bg-editorial-accent-soft text-editorial-cta-hover",
    dot: "bg-editorial-cta",
    text: "text-editorial-cta",
    button: "bg-editorial-cta hover:bg-editorial-cta-hover focus-visible:ring-editorial-accent",
  },
  participation: {
    icon: Presentation,
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
