import { getMapEntries } from "@/lib/timeline-data";
import intro from "@/content/proyectos-portada.json";
import { ProjectsMap } from "./_components/projects-map";

export const metadata = {
  title: "Trayectoria",
};

/**
 * Página pública con el mapa interactivo y la línea de tiempo de proyectos,
 * participaciones y alianzas. El título y la introducción de los proyectos
 * viven en la card de portada del recorrido (texto editable en
 * content/proyectos-portada.json).
 */
export default async function ProjectsPage() {
  const entries = await getMapEntries();

  return (
    <div className="relative h-full min-h-[480px]">
      <ProjectsMap
        entries={entries}
        intro={{ title: intro.titulo, text: intro.texto }}
        currentYear={new Date().getFullYear()}
      />
    </div>
  );
}
