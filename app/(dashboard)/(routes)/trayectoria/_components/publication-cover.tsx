import Link from "next/link";
import { coverUrl, type ProjectDocument } from "@/lib/projects";

type PublicationCoverProps = {
  publication: ProjectDocument;
  /** Página del visor a la que lleva la portada. */
  href: string;
  className?: string;
  /** La portada visible al cargar la página no se difiere. */
  priority?: boolean;
};

/**
 * Portada de un documento con aspecto de impreso (lomo y sombra).
 * La imagen es la primera página, así que no requiere un archivo aparte, y
 * conserva su proporción: un informe en carta no mide lo mismo que un periódico.
 */
export const PublicationCover = ({
  publication,
  href,
  className = "",
  priority = false,
}: PublicationCoverProps) => (
  <Link
    href={href}
    aria-label={`Leer: ${publication.title}`}
    className={`group relative block overflow-hidden rounded-r-md rounded-l-sm bg-white shadow-[0_1px_2px_rgba(15,23,42,0.2),0_18px_40px_-12px_rgba(15,23,42,0.45)] ring-1 ring-slate-900/10 transition duration-300 hover:-translate-y-1 hover:shadow-[0_1px_2px_rgba(15,23,42,0.2),0_28px_50px_-14px_rgba(15,23,42,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-4 ${className}`}
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={coverUrl(publication)}
      alt={`Portada de ${publication.title}`}
      loading={priority ? "eager" : "lazy"}
      className="block h-auto w-full"
    />
    {/* Lomo */}
    <span
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-0 w-[7%] bg-gradient-to-r from-black/25 via-black/5 to-transparent"
    />
  </Link>
);
