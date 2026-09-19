import { PROJECTS } from "@/lib/projects";
import intro from "@/content/proyectos-portada.json";
import { ProjectsMap } from "./_components/projects-map";

export const metadata = {
  title: intro.titulo,
};

/**
 * Página pública con el mapa interactivo de proyectos comunitarios.
 * El título y la introducción viven en la card de portada del recorrido
 * (texto editable en content/proyectos-portada.json).
 */
export default function ProjectsPage() {
  return (
    <div className="relative h-full min-h-[480px]">
      <ProjectsMap
        projects={PROJECTS}
        intro={{ title: intro.titulo, text: intro.texto }}
      />
    </div>
  );
}
