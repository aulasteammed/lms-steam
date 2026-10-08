import Link from "next/link";
import { BookOpen, Download } from "lucide-react";
import type { ProjectDocument } from "@/lib/projects";

type DocumentActionsProps = {
  document: ProjectDocument;
  /** Dirección del visor para este documento. */
  readHref: string;
  className?: string;
};

const button =
  "inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-lg px-3.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2";

/**
 * Las dos acciones de un documento, siempre juntas y en el mismo orden:
 * leerlo en el visor y descargar su PDF. Se usa igual en la página del
 * proyecto y en la estantería.
 */
export const DocumentActions = ({
  document,
  readHref,
  className = "",
}: DocumentActionsProps) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <Link
      href={readHref}
      aria-label={`Leer: ${document.title}`}
      className={`${button} bg-orange-600 text-white hover:bg-orange-700`}
    >
      <BookOpen className="h-4 w-4" />
      Leer
    </Link>
    <a
      href={document.pdf}
      download
      aria-label={`Descargar en PDF: ${document.title}`}
      className={`${button} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
    >
      <Download className="h-4 w-4" />
      Descargar
    </a>
  </div>
);
