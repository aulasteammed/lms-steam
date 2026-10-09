"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { preconnect } from "react-dom";
import type {
  GeoJSONSource,
  Map as MapLibreMap,
  Marker,
  StyleSpecification,
  LayerSpecification,
} from "maplibre-gl";
import Link from "next/link";
import { Globe, Library, Loader2, Minus, Plus } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import "./projects-map.css";

import {
  TYPE_LABELS,
  periodLabel,
  timelineYear,
  type EntryType,
  type MapEntry,
} from "@/lib/timeline";
import { EntryCard } from "./entry-card";
import { IntroCard, type IntroItem } from "./intro-card";
import { TimelineBar, TypeSelector } from "./map-filters";

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

const ENTRY_ZOOM = 13;
const DESKTOP_BREAKPOINT = 768;

/** Fuente GeoJSON con los puntos visibles; MapLibre los agrupa por cercanía. */
const SOURCE = "entries";
/** Distancia en píxeles a la que dos puntos se juntan en un grupo. */
const CLUSTER_RADIUS = 44;
/**
 * El mapa no acerca más allá de este zoom y hasta aquí se agrupa. Así, los
 * registros que están en el mismo lugar nunca quedan uno encima del otro:
 * siguen como grupo y al tocarlo se listan en la columna.
 */
const MAX_ZOOM = 16;

/** Texto de la portada de los tipos que no vienen de `proyectos-portada.json`. */
const TYPE_INTRO: Record<Exclude<EntryType, "project">, { title: string; text: string }> = {
  participation: {
    title: "Participaciones",
    text: "Congresos, ferias y encuentros donde el Aula STEAM presentó su trabajo. Recorre el mapa para ver dónde estuvo y qué llevó a cada espacio.",
  },
  alliance: {
    title: "Alianzas",
    text: "Instituciones y organizaciones con las que el aula ha trabajado. Recorre el mapa para ver dónde están y qué se hizo en conjunto.",
  },
};

type ProjectsMapProps = {
  entries: MapEntry[];
  /** Portada de los proyectos (texto editable en content/proyectos-portada.json). */
  intro: { title: string; text: string };
  /** Año en que se ubican los registros en curso. */
  currentYear: number;
};

type MarkerItem = { marker: Marker; el: HTMLButtonElement };

const NO_CARDS: MapEntry[] = [];

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

const toGeoJSON = (entries: MapEntry[]) => ({
  type: "FeatureCollection" as const,
  features: entries.flatMap((entry) =>
    entry.coordinates
      ? [
          {
            type: "Feature" as const,
            properties: { id: entry.id },
            geometry: { type: "Point" as const, coordinates: entry.coordinates },
          },
        ]
      : []
  ),
});

/**
 * Mapa interactivo con relieve y recorrido de registros (estilo StoryMaps):
 * - El selector de tipo y la línea de tiempo deciden qué registros se ven;
 *   se cargan todos y se filtran en memoria, sin volver al servidor.
 * - Al entrar se ve la vista completa: todos los puntos del tipo y solo la
 *   portada. Las cards de los registros aparecen al elegir un año, para que
 *   la columna nunca sea una lista interminable.
 * - Al hacer scroll sobre la columna de cards se pasa de un registro a otro
 *   y el mapa vuela al punto de la card que queda en el centro.
 * - Al hacer clic en un punto, la columna se desplaza hasta su card.
 * - Los puntos cercanos se agrupan. Un grupo se abre al tocarlo; si sus
 *   registros están en el mismo lugar, se listan en la columna.
 * - Al arrastrar o hacer zoom en el mapa, las cards se ocultan para explorar.
 */
export const ProjectsMap = ({ entries, intro, currentYear }: ProjectsMapProps) => {
  // Abre la conexión con los servidores del mapa lo antes posible.
  preconnect(BASEMAP_HOST, { crossOrigin: "anonymous" });
  preconnect(TERRAIN_HOST, { crossOrigin: "anonymous" });

  const containerRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const introRef = useRef<HTMLElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const maplibreRef = useRef<typeof import("maplibre-gl") | null>(null);
  /** Marcadores en pantalla: `p<id>` para un registro, `c<id>` para un grupo. */
  const markersRef = useRef(new Map<string, MarkerItem>());
  /** Card hacia la que se está desplazando la columna tras un clic en el mapa. */
  const scrollTargetRef = useRef<number | null>(null);
  const flyTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /** Registro al que ir cuando terminen de aparecer las cards de su año. */
  const pendingRef = useRef<string | null>(null);

  const [type, setType] = useState<EntryType>("project");
  /** Año elegido en la línea de tiempo; `null` = vista completa. */
  const [year, setYear] = useState<number | null>(null);
  /** Registros del grupo abierto (los que comparten un punto del mapa). */
  const [group, setGroup] = useState<string[] | null>(null);
  /** Card activa: -1 es la portada, 0..n-1 los registros visibles. */
  const [active, setActive] = useState(-1);
  const [storyVisible, setStoryVisible] = useState(entries.length > 0);
  const [loading, setLoading] = useState(true);

  const typeCounts = useMemo(() => {
    const counts: Record<EntryType, number> = { project: 0, participation: 0, alliance: 0 };
    for (const entry of entries) counts[entry.type]++;
    return counts;
  }, [entries]);

  /** Todos los años con algún registro, de cualquier tipo, sin saltos. */
  const years = useMemo(() => {
    if (entries.length === 0) return [];
    const all = entries.map((e) => timelineYear(e, currentYear));
    const first = Math.min(...all);
    return Array.from({ length: Math.max(...all) - first + 1 }, (_, i) => first + i);
  }, [entries, currentYear]);

  const ofType = useMemo(() => entries.filter((e) => e.type === type), [entries, type]);

  const yearCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const entry of ofType) {
      const y = timelineYear(entry, currentYear);
      counts[y] = (counts[y] ?? 0) + 1;
    }
    return counts;
  }, [ofType, currentYear]);

  /** Puntos del mapa: los del año elegido o, en la vista completa, todos los del tipo. */
  const points = useMemo(
    () =>
      year === null
        ? ofType
        : ofType.filter((e) => timelineYear(e, currentYear) === year),
    [ofType, year, currentYear]
  );
  /** Cards de la columna: solo las del año elegido. */
  const cards = year === null ? NO_CARDS : points;

  // Valores actuales para los listeners del mapa, que se crean una sola vez.
  const pointsRef = useRef(points);
  pointsRef.current = points;
  const cardsRef = useRef(cards);
  cardsRef.current = cards;
  const typeRef = useRef(type);
  typeRef.current = type;
  const activeRef = useRef(active);
  activeRef.current = active;
  const storyVisibleRef = useRef(storyVisible);
  storyVisibleRef.current = storyVisible;

  const isDesktop = () => window.innerWidth >= DESKTOP_BREAKPOINT;

  /** Desplazamiento para que el punto quede al lado de la columna de cards. */
  const getOffset = (): [number, number] => {
    const column = columnRef.current;
    if (!column) return [0, 0];
    return isDesktop()
      ? [Math.round(column.offsetWidth / 2), 0]
      : [0, -Math.round(column.offsetHeight / 2)];
  };

  const getBounds = (list: MapEntry[]): [[number, number], [number, number]] | null => {
    const points = list.flatMap((e) => (e.coordinates ? [e.coordinates] : []));
    if (points.length === 0) return null;
    const lngs = points.map((p) => p[0]);
    const lats = points.map((p) => p[1]);
    return [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ];
  };

  /** Margen para encuadrar todos los puntos, dejando libre la columna de cards. */
  const getFitPadding = (withStory: boolean) => {
    const base = 70;
    const column = columnRef.current;
    if (!withStory || !column) return base;
    return isDesktop()
      ? { top: base, bottom: base + 30, right: base, left: column.offsetWidth + 20 }
      : { top: base, left: 30, right: 30, bottom: column.offsetHeight + 60 };
  };

  const fitAll = useCallback((withStory: boolean) => {
    const bounds = getBounds(pointsRef.current);
    if (!mapRef.current || !bounds) return;
    mapRef.current.fitBounds(bounds, {
      padding: getFitPadding(withStory),
      maxZoom: ENTRY_ZOOM,
      duration: 1500,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flyToEntry = useCallback((index: number) => {
    const coordinates = cardsRef.current[index]?.coordinates;
    // Las participaciones virtuales no tienen punto: el mapa se queda donde está.
    if (!coordinates) return;
    mapRef.current?.flyTo({
      center: coordinates,
      zoom: ENTRY_ZOOM,
      offset: getOffset(),
      speed: 1.4,
      maxDuration: 2000,
      essential: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Desplaza la columna hasta una card (-1 = portada) sin que el mapa vuele por las intermedias. */
  const scrollToCard = useCallback((index: number) => {
    const scroller = scrollerRef.current;
    const section = index === -1 ? introRef.current : sectionRefs.current[index];
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
  }, []);

  /** Muestra la card del registro y desplaza la columna hasta ella. */
  const goToEntry = useCallback(
    (id: string) => {
      setStoryVisible(true);
      const index = cardsRef.current.findIndex((e) => e.id === id);
      if (index === -1) {
        // Vista completa: se elige el año del registro y, cuando sus cards
        // ya están en la columna, se vuelve a llamar con el mismo registro.
        const entry = entries.find((e) => e.id === id);
        if (!entry) return;
        pendingRef.current = id;
        setYear(timelineYear(entry, currentYear));
        return;
      }
      setActive(index);
      flyToEntry(index);
      scrollToCard(index);
    },
    [entries, currentYear, flyToEntry, scrollToCard]
  );

  /** Lista en la portada los registros de un punto que agrupa varios. */
  const showGroup = useCallback(
    (ids: string[]) => {
      setGroup(ids);
      setStoryVisible(true);
      setActive(-1);
      scrollToCard(-1);
    },
    [scrollToCard]
  );

  /** Vuelve a la vista completa: todos los puntos del tipo y la portada. */
  const showAll = useCallback(() => {
    setYear(null);
    setGroup(null);
    setStoryVisible(true);
    setActive(-1);
    scrollToCard(-1);
    fitAll(true);
  }, [fitAll, scrollToCard]);

  const selectType = (next: EntryType) => {
    // Si el año elegido no tiene registros del nuevo tipo, se vuelve a la vista completa.
    const hasYear = entries.some(
      (e) => e.type === next && timelineYear(e, currentYear) === year
    );
    if (!hasYear) setYear(null);
    setType(next);
    setStoryVisible(true);
  };

  /** Elegir el año que ya estaba elegido lo suelta. */
  const selectYear = (next: number) => {
    setYear((current) => (current === next ? null : next));
    setStoryVisible(true);
  };

  /**
   * Pone en el mapa un marcador por cada punto o grupo que la fuente tiene en
   * pantalla y quita los que ya no están. Los marcadores son botones HTML, no
   * una capa dibujada, para que se puedan recorrer con el teclado.
   */
  const syncMarkers = useCallback(() => {
    const map = mapRef.current;
    const maplibregl = maplibreRef.current;
    if (!map || !maplibregl || !map.getSource(SOURCE) || !map.isSourceLoaded(SOURCE)) return;

    const markers = markersRef.current;
    const list = pointsRef.current;
    const activeEntry = storyVisibleRef.current
      ? cardsRef.current[activeRef.current]
      : undefined;
    const activePoint = activeEntry?.coordinates ? map.project(activeEntry.coordinates) : null;
    const seen = new Set<string>();

    for (const feature of map.querySourceFeatures(SOURCE)) {
      if (feature.geometry.type !== "Point") continue;
      const props = feature.properties as {
        id?: string;
        cluster?: boolean;
        cluster_id?: number;
        point_count?: number;
      };
      const key = props.cluster ? `c${props.cluster_id}` : `p${props.id}`;
      // El mismo punto puede venir repetido, una vez por cada tesela que toca.
      if (seen.has(key)) continue;
      seen.add(key);

      const entry = props.cluster ? undefined : list.find((e) => e.id === props.id);
      const coordinates =
        entry?.coordinates ?? (feature.geometry.coordinates as [number, number]);

      let item = markers.get(key);
      if (!item) {
        const el = document.createElement("button");
        el.type = "button";
        const typeClass = `project-marker is-${typeRef.current}`;

        if (props.cluster) {
          const clusterId = props.cluster_id!;
          const count = props.point_count ?? 0;
          el.className = `${typeClass} is-cluster`;
          el.setAttribute(
            "aria-label",
            `${count} ${TYPE_LABELS[typeRef.current].plural.toLowerCase()} en esta zona`
          );
          el.innerHTML = `<span class="project-marker__dot">${count}</span>`;
          el.addEventListener("click", async (ev) => {
            ev.stopPropagation();
            const source = map.getSource(SOURCE) as GeoJSONSource | undefined;
            if (!source) return;
            try {
              const [zoom, leaves] = await Promise.all([
                source.getClusterExpansionZoom(clusterId),
                source.getClusterLeaves(clusterId, count, 0),
              ]);
              if (zoom > MAX_ZOOM) {
                // No se puede separar: sus registros están en el mismo lugar.
                showGroupRef.current(leaves.map((leaf) => String(leaf.properties?.id)));
              } else {
                map.easeTo({
                  center: coordinates,
                  zoom,
                  offset: storyVisibleRef.current ? getOffset() : [0, 0],
                });
              }
            } catch {
              // El grupo ya no existe (cambió el zoom o el filtro).
            }
          });
        } else if (entry) {
          el.className = entry.publication ? `${typeClass} has-publication` : typeClass;
          el.setAttribute("aria-label", entry.title);
          el.innerHTML = `<span class="project-marker__dot"></span><span class="project-marker__label">${escapeHtml(entry.title)}</span>`;
          el.addEventListener("click", (ev) => {
            ev.stopPropagation();
            goToRef.current(entry.id);
          });
        } else {
          continue;
        }

        const marker = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat(coordinates)
          .addTo(map);
        item = { marker, el };
        markers.set(key, item);
      }

      // Activo: el punto de la card actual o el grupo que lo contiene.
      let isActive = false;
      if (props.cluster && activePoint) {
        const point = map.project(coordinates);
        isActive =
          Math.hypot(point.x - activePoint.x, point.y - activePoint.y) <= CLUSTER_RADIUS;
      } else if (!props.cluster) {
        isActive = activeEntry?.id === props.id;
      }
      item.el.classList.toggle("is-active", isActive);
    }

    for (const [key, item] of markers) {
      if (seen.has(key)) continue;
      item.marker.remove();
      markers.delete(key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Referencias estables para los listeners de los marcadores.
  const goToRef = useRef(goToEntry);
  goToRef.current = goToEntry;
  const showGroupRef = useRef(showGroup);
  showGroupRef.current = showGroup;

  // Detecta la card que queda en el centro de la columna al hacer scroll.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const observer = new IntersectionObserver(
      (observed) => {
        for (const item of observed) {
          if (!item.isIntersecting) continue;
          const index = Number((item.target as HTMLElement).dataset.index);

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
            () => (index === -1 ? fitAll(true) : flyToEntry(index)),
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
  }, [flyToEntry, fitAll, cards]);

  // Inicialización del mapa (una sola vez).
  useEffect(() => {
    let cancelled = false;
    const markers = markersRef.current;

    (async () => {
      // Librería y estilo se descargan en paralelo.
      const [maplibre, style] = await Promise.all([import("maplibre-gl"), buildStyle()]);
      if (cancelled || !containerRef.current) return;
      const maplibregl = maplibre.default;
      maplibreRef.current = maplibregl;

      const bounds = getBounds(pointsRef.current);
      const map = new maplibregl.Map({
        container: containerRef.current,
        style,
        // Arranca mostrando todos los registros junto a la card de portada.
        ...(bounds
          ? {
              bounds,
              fitBoundsOptions: { padding: getFitPadding(true), maxZoom: ENTRY_ZOOM },
            }
          : { center: [-75.5636, 6.2518] as [number, number], zoom: 6 }),
        minZoom: 4,
        maxZoom: MAX_ZOOM,
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
        map.addSource(SOURCE, {
          type: "geojson",
          data: toGeoJSON(pointsRef.current),
          cluster: true,
          clusterRadius: CLUSTER_RADIUS,
          clusterMaxZoom: MAX_ZOOM,
        });
        // La fuente solo calcula sus grupos si alguna capa la usa. Esta capa
        // no se ve: los puntos se dibujan como marcadores HTML.
        map.addLayer({
          id: SOURCE,
          type: "circle",
          source: SOURCE,
          paint: { "circle-radius": 1, "circle-opacity": 0 },
        });
        map.on("render", syncMarkers);

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
    })();

    return () => {
      cancelled = true;
      markers.forEach(({ marker }) => marker.remove());
      markers.clear();
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Al cambiar de tipo o de año: nuevos puntos, columna al inicio y encuadre.
  useEffect(() => {
    setGroup(null);
    setActive(-1);
    scrollTargetRef.current = null;
    scrollerRef.current?.scrollTo({ top: 0, left: 0 });

    const source = mapRef.current?.getSource(SOURCE) as GeoJSONSource | undefined;
    if (!source) return;
    // Los grupos se numeran de nuevo con cada lista: se quitan los marcadores viejos.
    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current.clear();
    source.setData(toGeoJSON(points));

    // Si se llegó aquí desde un punto de la vista completa, se va a su card.
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending) goToRef.current(pending);
    else fitAll(true);
  }, [points, loading, fitAll]);

  // Resalta el marcador activo mientras las cards están visibles.
  useEffect(() => {
    syncMarkers();
  }, [active, storyVisible, syncMarkers]);

  // Esc oculta las cards.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setStoryVisible(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const plural = TYPE_LABELS[type].plural.toLowerCase();
  const typeIntro = type === "project" ? intro : TYPE_INTRO[type];
  const countLabel = (n: number) =>
    `${n} ${(n === 1 ? TYPE_LABELS[type].singular : TYPE_LABELS[type].plural).toLowerCase()}`;
  const toItem = (entry: MapEntry): IntroItem => ({
    key: entry.id,
    title: entry.title,
    subtitle: `${entry.place} · ${periodLabel(entry)}`,
    onSelect: () => goToEntry(entry.id),
  });
  const groupEntries = group
    ? points.filter((entry) => group.includes(entry.id))
    : null;
  /** Años con registros del tipo elegido, del más reciente al más antiguo. */
  const yearItems: IntroItem[] = years
    .filter((y) => yearCounts[y])
    .reverse()
    .map((y) => ({
      key: String(y),
      title: String(y),
      subtitle: countLabel(yearCounts[y]),
      onSelect: () => selectYear(y),
    }));
  const allYears = { label: "Todos los años", onClick: showAll };

  return (
    <div className="absolute inset-0 overflow-hidden bg-stone-100">
      {/* MapLibre fuerza position:relative en su contenedor, por eso va envuelto. */}
      <div className="absolute inset-0">
        <div ref={containerRef} className="h-full w-full" />
      </div>

      {/* Selector de tipo e indicador de carga del mapa */}
      <div className="absolute inset-x-3 top-3 z-10 flex flex-col items-end gap-2 md:inset-x-4 md:top-4">
        <TypeSelector selected={type} counts={typeCounts} onSelect={selectType} />
        {loading && (
          <div className="pointer-events-none flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-xs text-slate-600 shadow-sm">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Cargando mapa…
          </div>
        )}
      </div>

      {/* Línea de tiempo: franja sobre las cards en celular y en el borde inferior en escritorio.
          Va antes de la columna para que las cards queden encima de la franja. */}
      <div
        className={`pointer-events-none absolute inset-x-0 transition-all md:bottom-0 ${
          storyVisible ? "bottom-[60%]" : "bottom-0"
        }`}
      >
        <TimelineBar
          years={years}
          counts={yearCounts}
          selected={year}
          onSelect={selectYear}
          className={storyVisible ? "md:pl-[min(520px,46%)]" : ""}
        />
      </div>

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
            {groupEntries ? (
              <IntroCard
                type={type}
                eyebrow={`${countLabel(groupEntries.length)} en el mismo lugar`}
                title={groupEntries[0]?.place ?? "En este punto"}
                text={`Estos ${plural} comparten ubicación en el mapa. Elige uno para ver su tarjeta.`}
                items={groupEntries.map(toItem)}
                back={{ label: "Volver", onClick: () => setGroup(null) }}
              />
            ) : year === null ? (
              <IntroCard
                type={type}
                eyebrow={`${countLabel(ofType.length)} · ${years[0] ?? ""} – ${years[years.length - 1] ?? ""}`}
                title={typeIntro.title}
                text={typeIntro.text}
                items={yearItems}
                onStart={yearItems[0]?.onSelect}
              />
            ) : (
              <IntroCard
                type={type}
                eyebrow={`${countLabel(cards.length)} · ${year}`}
                title={typeIntro.title}
                text={typeIntro.text}
                items={cards.map(toItem)}
                onStart={cards[0] && (() => goToEntry(cards[0].id))}
                back={allYears}
              />
            )}
          </section>

          {cards.map((entry, i) => (
            <section
              key={entry.id}
              ref={(el) => {
                sectionRefs.current[i] = el;
              }}
              data-index={i}
              className="relative flex h-full w-full shrink-0 snap-center items-end px-4 pb-4 md:h-auto md:min-h-full md:items-center md:px-10 md:py-10"
            >
              <EntryCard
                entry={entry}
                active={i === active}
                onClose={() => setStoryVisible(false)}
              />
            </section>
          ))}
        </div>
      </div>

      {/* Controles: publicaciones, ver todos y zoom */}
      <div
        className={`absolute right-3 flex flex-col items-end gap-2 transition-all md:right-4 md:bottom-28 ${
          storyVisible ? "bottom-[calc(60%+56px)]" : "bottom-28"
        }`}
      >
        <Link
          href="/proyectos/publicaciones"
          className="flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-md transition hover:bg-orange-50 hover:text-orange-700"
        >
          <Library className="h-4 w-4" />
          Publicaciones
        </Link>
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
