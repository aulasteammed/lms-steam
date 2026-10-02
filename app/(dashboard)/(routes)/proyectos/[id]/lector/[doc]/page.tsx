import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getDocument, getProject } from "@/lib/projects";
import { FlipBook } from "../../_components/flip-book";

type Props = {
  params: Promise<{ id: string; doc: string }>;
  searchParams: Promise<{ desde?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, doc } = await params;
  const project = getProject(id);
  const document = project && getDocument(project, doc);
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
  const project = getProject(id);
  const document = project && getDocument(project, doc);
  if (!project || !document) return notFound();

  const fromShelf = desde === "publicaciones";

  return (
    <FlipBook
      publication={document}
      exitHref={fromShelf ? "/proyectos/publicaciones" : project.href}
      exitLabel={fromShelf ? "Volver a publicaciones" : "Volver al proyecto"}
    />
  );
}
