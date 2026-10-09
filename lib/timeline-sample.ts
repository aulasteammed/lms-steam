/**
 * Datos de prueba del mapa, mientras se conecta la base de datos.
 *
 * Los proyectos salen de `content/proyectos.json`. Las participaciones y las
 * alianzas son de ejemplo: lo que no se conoce va entre corchetes. Cubren los
 * casos que el mapa debe resolver: participación virtual (sin punto), dos
 * registros en el mismo lugar y una alianza en curso.
 */
import { PROJECTS, type Project } from "@/lib/projects";
import type { MapEntry } from "@/lib/timeline";

/** "2024 – 2026" → 2024 y 2026; "2024 – actual" → 2024 y en curso. */
const parsePeriod = (period: string) => {
  const years = (period.match(/\d{4}/g) ?? []).map(Number);
  const startYear = years[0] ?? new Date().getFullYear();
  const ongoing = /actual/i.test(period);
  return { startYear, endYear: ongoing ? undefined : (years[1] ?? startYear) };
};

const fromProject = (project: Project): MapEntry => ({
  id: project.id,
  type: "project",
  title: project.title,
  description: project.description,
  place: project.place,
  ...parsePeriod(project.year),
  coordinates: project.coordinates,
  images: project.images,
  href: project.href,
  publication: project.publication,
  related: [],
});

const entreAguas = PROJECTS.find((p) => p.id === "comuna-1");
const relatedProject = entreAguas
  ? [{ title: entreAguas.title, href: entreAguas.href }]
  : [];

const SAMPLE_PARTICIPATIONS: MapEntry[] = [
  {
    id: "participacion-1",
    type: "participation",
    title: "[Nombre del congreso] · [edición]",
    description:
      "[Descripción corta de la participación: qué se presentó y ante quién. Máximo 250 caracteres.]",
    place: "Universidad Nacional de Colombia, Bogotá",
    startYear: 2025,
    endYear: 2025,
    coordinates: [-74.084, 4.6382],
    images: [{ src: "/images/Slide_02.jpg", alt: "Foto de ejemplo" }],
    date: "2025-05-10",
    modality: "in_person",
    reason: "[Por qué se participó: qué buscaba el aula en este espacio.]",
    speaker: { name: "[Nombre de la persona]", role: "[Rol en el aula]" },
    related: relatedProject,
  },
  {
    id: "participacion-2",
    type: "participation",
    title: "[Nombre del encuentro] · [edición]",
    description:
      "[Descripción corta de la participación: qué se presentó y ante quién. Máximo 250 caracteres.]",
    place: "Sede Medellín, Universidad Nacional de Colombia",
    startYear: 2025,
    endYear: 2025,
    coordinates: [-75.5773, 6.2616],
    images: [{ src: "/images/Slide_03.jpg", alt: "Foto de ejemplo" }],
    date: "2025-10-22",
    modality: "hybrid",
    speaker: { name: "[Nombre de la persona]", role: "[Rol en el aula]" },
    related: [],
  },
  {
    id: "participacion-3",
    type: "participation",
    title: "[Nombre de la feria] · [edición]",
    description:
      "[Descripción corta de la participación: qué se presentó y ante quién. Máximo 250 caracteres.]",
    place: "Sede Medellín, Universidad Nacional de Colombia",
    startYear: 2024,
    endYear: 2024,
    coordinates: [-75.5773, 6.2616],
    images: [{ src: "/images/Slide_01.jpg", alt: "Foto de ejemplo" }],
    date: "2024-07-24",
    modality: "in_person",
    reason: "[Por qué se participó: qué buscaba el aula en este espacio.]",
    related: [],
  },
  {
    id: "participacion-4",
    type: "participation",
    title: "[Nombre del seminario virtual] · [edición]",
    description:
      "[Descripción corta de la participación: qué se presentó y ante quién. Máximo 250 caracteres.]",
    place: "Virtual",
    startYear: 2024,
    endYear: 2024,
    coordinates: null,
    images: [{ src: "/images/Slide_04.jpg", alt: "Foto de ejemplo" }],
    date: "2024-09-18",
    modality: "virtual",
    speaker: { name: "[Nombre de la persona]" },
    related: relatedProject,
  },
];

const SAMPLE_ALLIANCES: MapEntry[] = [
  {
    id: "alianza-1",
    type: "alliance",
    title: "[Institución u organización aliada 1]",
    description:
      "[Descripción corta de la alianza: qué se hace en conjunto y desde cuándo. Máximo 250 caracteres.]",
    place: "Medellín, Antioquia",
    startYear: 2024,
    coordinates: [-75.5694, 6.2442],
    images: [{ src: "/images/Slide_05.jpg", alt: "Foto de ejemplo" }],
    related: [...relatedProject, { title: "[Nombre del congreso] · [edición]" }],
  },
  {
    id: "alianza-2",
    type: "alliance",
    title: "[Institución u organización aliada 2]",
    description:
      "[Descripción corta de la alianza: qué se hace en conjunto y desde cuándo. Máximo 250 caracteres.]",
    place: "Quibdó, Chocó",
    startYear: 2023,
    endYear: 2024,
    coordinates: [-76.6583, 5.6919],
    images: [{ src: "/images/Slide_03.jpg", alt: "Foto de ejemplo" }],
    related: [],
  },
  {
    id: "alianza-3",
    type: "alliance",
    title: "[Institución u organización aliada 3]",
    description:
      "[Descripción corta de la alianza: qué se hace en conjunto y desde cuándo. Máximo 250 caracteres.]",
    place: "Santa Marta, Magdalena",
    startYear: 2023,
    endYear: 2023,
    coordinates: [-74.199, 11.2408],
    images: [{ src: "/images/Slide_04.jpg", alt: "Foto de ejemplo" }],
    related: [],
  },
];

export const MAP_ENTRIES: MapEntry[] = [
  ...PROJECTS.map(fromProject),
  ...SAMPLE_PARTICIPATIONS,
  ...SAMPLE_ALLIANCES,
];
