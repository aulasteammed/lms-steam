import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { getDocument } from "@/lib/projects";
import { getProject } from "@/lib/timeline-data";
import { FlipBook } from "../../_components/flip-book";

type Props = {
  params: Promise<{ id: string; doc: string }>;
  searchParams: Promise<{ desde?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, doc } = await params;
  const found = await getProject(id);
  const document = found && "project" in found && getDocument(found.project, doc);
  if (!document) return {};
  return { title: document.title, description: document.description };
}

/**
 * Visor de un documento del proyecto (periódico, revista, informe…), con
 * dirección propia para poder compartirlo. Abre a ventana completa, sin vista
 * intermedia, y "Volver" regresa al lugar desde donde se abrió.
 */
export default async function ReaderPage({ params, searchParams }: Props) {
  const { id, doc } = await params;
  const { desde } = await searchParams;
  const found = await getProject(id);
  if (!found) return notFound();
  if ("redirectTo" in found) return permanentRedirect(`${found.redirectTo}/lector/${doc}`);
  const { project } = found;
  const document = getDocument(project, doc);
  if (!document) return notFound();

  const fromShelf = desde === "publicaciones";

  return (
    <FlipBook
      publication={document}
      exitHref={fromShelf ? "/trayectoria/publicaciones" : project.href}
      exitLabel={fromShelf ? "Volver a publicaciones" : "Volver al proyecto"}
    />
  );
}
