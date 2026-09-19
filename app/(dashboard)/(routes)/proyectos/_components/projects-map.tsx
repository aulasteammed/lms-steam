"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { preconnect } from "react-dom";
import type {
  Map as MapLibreMap,
  Marker,
  StyleSpecification,
  LayerSpecification,
} from "maplibre-gl";
import { Globe, Loader2, Minus, Plus } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import "./projects-map.css";

import type { Project } from "@/lib/projects";
import { ProjectCard } from "./project-card";
import { IntroCard } from "./intro-card";

/** Mapa base vectorial gratuito (sin API key). */
const BASEMAP_HOST = "https://tiles.openfreemap.org";
const BASEMAP_STYLE = `${BASEMAP_HOST}/styles/liberty`;

/** Modelo de elevación gratuito para el sombreado de relieve. */
const TERRAIN_HOST = "https://s3.amazonaws.com";
const TERRAIN_TILES = `${TERRAIN_HOST}/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`;
/**
 * Zoom máximo del relieve. Por encima se reutilizan (escalan) los tiles de este
 * nivel: el relieve se ve igual de bien y se descargan muchos menos archivos.
 */
const TERRAIN_MAX_ZOOM = 11;

/** Capas del estilo base que no aportan al mapa y lo hacen más pesado. */
const REMOVED_SOURCE_LAYERS = new Set([
  "building",
  "poi",
  "housenumber",
  "aerodrome_label",
  "aeroway",
  "mountain_peak",
]);

const PROJECT_ZOOM = 13;
const DESKTOP_BREAKPOINT = 768;

type ProjectsMapProps = {
  projects: Project[];
  intro: { title: string; text: string };
};

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );

/**
 * Descarga el estilo base y lo adelgaza antes de crear el mapa:
 * quita edificios/POIs, agrega el relieve y usa nombres en español.
 * Así el mapa se dibuja completo en una sola pasada.
 */
const buildStyle = async (): Promise<StyleSpecification | string> => {
  try {
    const res = await fetch(BASEMAP_STYLE);
    if (!res.ok) throw new Error(String(res.status));
    const style = (await res.json()) as StyleSpecification;

    const layers = style.layers.filter((layer) => {
      const sourceLayer = (layer as { "source-layer"?: string })["source-layer"];
      if (layer.type === "fill-extrusion") return false;
      return !(sourceLayer && REMOVED_SOURCE_LAYERS.has(sourceLayer));
    });

    for (const layer of layers) {
      const sourceLayer = (layer as { "source-layer"?: string })["source-layer"];
      if (
        layer.type === "symbol" &&
        (sourceLayer === "place" || sourceLayer === "water_name")
      ) {
        layer.layout = {
          ...layer.layout,
          "text-field": ["coalesce", ["get", "name:es"], ["get", "name"]],
        };
      }
    }

    const hillshade: LayerSpecification = {
      id: "relief-hillshade",
      type: "hillshade",
      source: "terrain-dem",
      paint: {
        "hillshade-exaggeration": 0.6,
        "hillshade-shadow-color": "#5f5446",
        "hillshade-highlight-color": "#ffffff",
        "hillshade-accent-color": "#7d6f5c",
      },
    };
    // El agua se dibuja encima del relieve para que el mar y los lagos se vean planos.
    const isWater = (l: LayerSpecification) =>
      l.type === "fill" &&
      (l as { "source-layer"?: string })["source-layer"] === "water";
    const waterLayers = layers.filter(isWater);
    const baseLayers = layers.filter((l) => !isWater(l));
    const firstSymbol = baseLayers.findIndex((l) => l.type === "symbol");
    baseLayers.splice(
      firstSymbol === -1 ? baseLayers.length : firstSymbol,
      0,
      hillshade,
      ...waterLayers
    );

    return {
      ...style,
      sources: {
        ...style.sources,
        "terrain-dem": {
          type: "raster-dem",
          tiles: [TERRAIN_TILES],
          tileSize: 256,
          encoding: "terrarium",
          maxzoom: TERRAIN_MAX_ZOOM,
          attribution:
            '<a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noopener">Relieve: AWS Terrain Tiles</a>',
        },
      },
      layers: baseLayers,
    };
  } catch {
    // Si algo falla, se usa el estilo base tal cual (sin relieve).
    return BASEMAP_STYLE;
  }
};

/**
 * Mapa interactivo con relieve y recorrido de proyectos (estilo StoryMaps):
 * - Al hacer scroll sobre la columna de cards se pasa de un proyecto a otro
 *   y el mapa vuela al punto de la card que queda en el centro.
 * - Al hacer clic en un punto, la columna se desplaza hasta su card.
 * - Al arrastrar o hacer zoom en el mapa, las cards se ocultan para explorar.
 */
export const ProjectsMap = ({ projects, intro }: ProjectsMapProps) => {
  // Abre la conexión con los servidores del mapa lo antes posible.
  preconnect(BASEMAP_HOST, { crossOrigin: "anonymous" });
  preconnect(TERRAIN_HOST, { crossOrigin: "anonymous" });

  const containerRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const introRef = useRef<HTMLElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<{ marker: Marker; el: HTMLButtonElement }[]>([]);
  /** Card hacia la que se está desplazando la columna tras un clic en el mapa. */
  const scrollTargetRef = useRef<number | null>(null);
  const flyTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /** Card activa: -1 es la portada, 0..n-1 los proyectos. */
  const [active, setActive] = useState(-1);
  const [storyVisible, setStoryVisible] = useState(projects.length > 0);
  const [loading, setLoading] = useState(true);

  const isDesktop = () => window.innerWidth >= DESKTOP_BREAKPOINT;

  /** Desplazamiento para que el punto quede al lado de la columna de cards. */
  const getOffset = (): [number, number] => {
    const column = columnRef.current;
    if (!column) return [0, 0];
    return isDesktop()
      ? [Math.round(column.offsetWidth / 2), 0]
      : [0, -Math.round(column.offsetHeight / 2)];
  };

  const getBounds = (): [[number, number], [number, number]] => {
    const lngs = projects.map((p) => p.coordinates[0]);
    const lats = projects.map((p) => p.coordinates[1]);
    return [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ];
  };

  /** Margen para encuadrar todos los puntos, dejando libre la columna de cards. */
  const getFitPadding = (withStory: boolean) => {
    const base = 60;
    const column = columnRef.current;
    if (!withStory || !column) return base;
    return isDesktop()
      ? { top: base, bottom: base, right: base, left: column.offsetWidth + 20 }
      : { top: base, left: 30, right: 30, bottom: column.offsetHeight + 20 };
  };

  const fitAll = useCallback(
    (withStory: boolean) => {
      if (!mapRef.current || projects.length === 0) return;
      mapRef.current.fitBounds(getBounds(), {
        padding: getFitPadding(withStory),
        maxZoom: PROJECT_ZOOM,
        duration: 1500,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projects]
  );

  const flyToProject = useCallback(
    (index: number) => {
      const project = projects[index];
      if (!project) return;
      mapRef.current?.flyTo({
        center: project.coordinates,
        zoom: PROJECT_ZOOM,
        offset: getOffset(),
        speed: 1.4,
        maxDuration: 2000,
        essential: true,
      });
    },
    [projects]
  );

  /** Muestra la card del proyecto y desplaza la columna hasta ella. */
  const goToProject = useCallback(
    (index: number) => {
      setStoryVisible(true);
      setActive(index);
      flyToProject(index);

      const scroller = scrollerRef.current;
      const section = sectionRefs.current[index];
      if (!scroller || !section) return;

      scrollTargetRef.current = index;
      scroller.scrollTo({
        top: isDesktop() ? section.offsetTop : 0,
        left: isDesktop() ? 0 : section.offsetLeft,
        behavior: "smooth",
      });
      // Por si la columna ya estaba en esa card y no hay desplazamiento.
      setTimeout(() => {
        if (scrollTargetRef.current === index) scrollTargetRef.current = null;
      }, 1200);
    },
    [flyToProject]
  );

  // Referencia estable para los listeners de los marcadores (creados una sola vez).
  const goToRef = useRef(goToProject);
  goToRef.current = goToProject;

  const showAll = useCallback(() => {
    setStoryVisible(false);
    fitAll(false);
  }, [fitAll]);

  // Detecta la card que queda en el centro de la columna al hacer scroll.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.index);

          // Durante un desplazamiento provocado por un clic se ignoran las
          // cards intermedias para que el mapa no vuele por cada una.
          const target = scrollTargetRef.current;
          if (target !== null) {
            if (index !== target) continue;
            scrollTargetRef.current = null;
            continue;
          }

          setActive(index);
          clearTimeout(flyTimerRef.current);
          flyTimerRef.current = setTimeout(
            () => (index === -1 ? fitAll(true) : flyToProject(index)),
            120
          );
        }
      },
      { root: scroller, threshold: 0.6 }
    );

    if (introRef.current) observer.observe(introRef.current);
    sectionRefs.current.forEach((section) => section && observer.observe(section));
    return () => {
      observer.disconnect();
      clearTimeout(flyTimerRef.current);
    };
  }, [flyToProject, fitAll, projects.length]);

  // Inicialización del mapa (una sola vez).
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Librería y estilo se descargan en paralelo.
      const [{ default: maplibregl }, style] = await Promise.all([
        import("maplibre-gl"),
        buildStyle(),
      ]);
      if (cancelled || !containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style,
        // Arranca mostrando todos los proyectos junto a la card de portada.
        ...(projects.length
          ? {
              bounds: getBounds(),
              fitBoundsOptions: { padding: getFitPadding(true), maxZoom: PROJECT_ZOOM },
            }
          : { center: [-75.5636, 6.2518] as [number, number], zoom: 6 }),
        minZoom: 4,
        maxZoom: 17,
        // En pantallas de alta densidad no se renderiza a más de 2x.
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        fadeDuration: 150,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        attributionControl: { compact: true },
      });
      map.touchZoomRotate.disableRotation();
      map.keyboard.disableRotation();
      mapRef.current = map;

      map.once("load", () => {
        setLoading(false);
        // Créditos del mapa plegados (se abren con el botón "i").
        containerRef.current
          ?.querySelector(".maplibregl-ctrl-attrib")
          ?.classList.remove("maplibregl-compact-show");
      });

      // Al explorar el mapa (arrastrar o zoom del usuario) se ocultan las cards.
      map.on("movestart", (e) => {
        if ((e as { originalEvent?: Event }).originalEvent) setStoryVisible(false);
      });

      // Marcadores numerados.
      markersRef.current = projects.map((project, i) => {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "project-marker";
        el.setAttribute("aria-label", `${i + 1}. ${project.title}`);
        el.innerHTML = `<span class="project-marker__dot">${i + 1}</span><span class="project-marker__label">${escapeHtml(project.title)}</span>`;
        el.addEventListener("click", (ev) => {
          ev.stopPropagation();
          goToRef.current(i);
        });

        const marker = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat(project.coordinates)
          .addTo(map);
        return { marker, el };
      });
    })();

    return () => {
      cancelled = true;
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resalta el marcador activo mientras las cards están visibles.
  useEffect(() => {
    markersRef.current.forEach(({ el }, i) => {
      el.classList.toggle("is-active", storyVisible && i === active);
    });
  }, [active, storyVisible]);

  // Esc oculta las cards.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setStoryVisible(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-stone-100">
      {/* MapLibre fuerza position:relative en su contenedor, por eso va envuelto. */}
      <div className="absolute inset-0">
        <div ref={containerRef} className="h-full w-full" />
      </div>

      {/* Indicador de carga del mapa */}
      {loading && (
        <div className="pointer-events-none absolute right-4 top-4 flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-xs text-slate-600 shadow-sm">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Cargando mapa…
        </div>
      )}

      {/* Columna de cards (vertical en escritorio, deslizable en celular) */}
      <div
        ref={columnRef}
        className={`absolute inset-x-0 bottom-0 h-[60%] transition-opacity duration-300 md:inset-y-0 md:right-auto md:h-auto md:w-[min(520px,46%)] ${
          storyVisible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!storyVisible}
      >
        <div
          ref={scrollerRef}
          className="story-scroller relative flex h-full snap-x snap-mandatory overflow-x-auto overscroll-contain md:block md:snap-y md:overflow-x-hidden md:overflow-y-auto"
        >
          <section
            ref={introRef}
            data-index={-1}
            className="relative flex h-full w-full shrink-0 snap-center items-end px-4 pb-4 md:h-auto md:min-h-full md:items-center md:px-10 md:py-10"
          >
            <IntroCard
              title={intro.title}
              text={intro.text}
              projects={projects}
              onSelect={goToProject}
            />
          </section>

          {projects.map((project, i) => (
            <section
              key={project.id}
              ref={(el) => {
                sectionRefs.current[i] = el;
              }}
              data-index={i}
              className="relative flex h-full w-full shrink-0 snap-center items-end px-4 pb-4 md:h-auto md:min-h-full md:items-center md:px-10 md:py-10"
            >
              <ProjectCard
                project={project}
                number={i + 1}
                active={i === active}
                onClose={() => setStoryVisible(false)}
              />

            </section>
          ))}
        </div>
      </div>

      {/* Controles: ver todos + zoom */}
      <div
        className={`absolute right-3 flex flex-col items-end gap-2 transition-all md:right-4 ${
          storyVisible ? "bottom-[calc(60%+12px)] md:bottom-8" : "bottom-8"
        }`}
      >
        <button
          type="button"
          onClick={showAll}
          className="flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-md transition hover:bg-orange-50 hover:text-orange-700"
        >
          <Globe className="h-4 w-4" />
          Ver todos
        </button>
        <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md divide-y divide-slate-200">
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn()}
            className="flex h-10 w-10 items-center justify-center text-slate-700 transition hover:bg-slate-50"
            aria-label="Acercar"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut()}
            className="flex h-10 w-10 items-center justify-center text-slate-700 transition hover:bg-slate-50"
            aria-label="Alejar"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
