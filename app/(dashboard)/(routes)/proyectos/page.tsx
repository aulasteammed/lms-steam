import { MAP_ENTRIES } from "@/lib/timeline-sample";
import intro from "@/content/proyectos-portada.json";
import { ProjectsMap } from "./_components/projects-map";

export const metadata = {
  title: intro.titulo,
};

/**
 * Página pública con el mapa interactivo y la línea de tiempo de proyectos,
 * participaciones y alianzas. El título y la introducción de los proyectos
 * viven en la card de portada del recorrido (texto editable en
 * content/proyectos-portada.json).
 */
export default function ProjectsPage() {
  return (
    <div className="relative h-full min-h-[480px]">
      <ProjectsMap
        entries={MAP_ENTRIES}
        intro={{ title: intro.titulo, text: intro.texto }}
        currentYear={new Date().getFullYear()}
      />
    </div>
  );
}
