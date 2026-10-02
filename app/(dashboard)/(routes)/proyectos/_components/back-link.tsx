import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type BackLinkProps = {
  href: string;
  /** Siempre "Volver a <lugar>": al mapa, al proyecto, a publicaciones. */
  children: React.ReactNode;
};

/**
 * Enlace de "Volver" de la sección de proyectos. Es el único que se usa en
 * la página del proyecto, la estantería y el visor, para que se vea igual.
 */
export const BackLink = ({ href, children }: BackLinkProps) => (
  <Link
    href={href}
    className="inline-flex shrink-0 items-center gap-2 rounded-lg text-sm font-medium text-slate-500 transition hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
  >
    <ArrowLeft className="h-4 w-4" />
    {children}
  </Link>
);

type PageBarProps = {
  backHref: string;
  backLabel: string;
  /** Acciones a la derecha (compartir, etc.). */
  children?: React.ReactNode;
};

/** Barra superior fija de las páginas de la sección, con el enlace de volver. */
export const PageBar = ({ backHref, backLabel, children }: PageBarProps) => (
  <div className="sticky top-[80px] z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
    <div className="mx-auto flex min-h-14 max-w-5xl items-center justify-between gap-3 px-4 py-2 md:px-8">
      <BackLink href={backHref}>{backLabel}</BackLink>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  </div>
);
