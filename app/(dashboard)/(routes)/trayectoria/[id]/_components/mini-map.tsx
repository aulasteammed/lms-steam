import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

type MiniMapProps = {
  /** Los lugares del registro, cada uno como [longitud, latitud]. */
  points: [number, number][];
  /** Resumen de la ubicación, debajo del mapa. */
  place: string;
  /** El panel de edición lo muestra sin el enlace al mapa completo. */
  showLink?: boolean;
};

/** Zoom de un registro con un solo lugar; con varios se aleja hasta que quepan. */
const MAX_ZOOM = 10;
const MIN_ZOOM = 2;
/** Parte de una tesela que pueden ocupar los puntos: el resto queda de margen. */
const MAX_SPAN = 0.8;
const TILE_HOST = "https://tile.openstreetmap.org";

/** Posición de un punto en teselas, a un zoom dado. */
const toTile = ([lon, lat]: [number, number], zoom: number) => {
  const n = 2 ** zoom;
  const rad = (lat * Math.PI) / 180;
  return {
    x: ((lon + 180) / 360) * n,
    y: ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n,
  };
};

/**
 * Mapa pequeño y estático de los lugares del registro: cuatro teselas de
 * OpenStreetMap con un punto por lugar. No carga la librería del mapa.
 */
export const MiniMap = ({ points, place, showLink = true }: MiniMapProps) => {
  if (points.length === 0) return null;

  // El zoom más cercano en el que todos los puntos caben con margen.
  let zoom = MAX_ZOOM;
  let tiles = points.map((point) => toTile(point, zoom));
  const span = () =>
    Math.max(
      Math.max(...tiles.map((t) => t.x)) - Math.min(...tiles.map((t) => t.x)),
      Math.max(...tiles.map((t) => t.y)) - Math.min(...tiles.map((t) => t.y))
    );
  while (span() > MAX_SPAN && zoom > MIN_ZOOM) {
    zoom--;
    tiles = points.map((point) => toTile(point, zoom));
  }

  // Las 4 teselas que rodean el centro de los puntos.
  const centerX = (Math.max(...tiles.map((t) => t.x)) + Math.min(...tiles.map((t) => t.x))) / 2;
  const centerY = (Math.max(...tiles.map((t) => t.y)) + Math.min(...tiles.map((t) => t.y))) / 2;
  const x0 = Math.round(centerX) - 1;
  const y0 = Math.round(centerY) - 1;
  const n = 2 ** zoom;
  const grid = [
    [x0, y0],
    [x0 + 1, y0],
    [x0, y0 + 1],
    [x0 + 1, y0 + 1],
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-editorial-line bg-white">
      <div className="relative aspect-square bg-editorial-chip">
        <div className="grid h-full w-full grid-cols-2 saturate-[0.65]">
          {grid.map(([tx, ty]) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${tx}-${ty}`}
              // La columna da la vuelta al mundo; la fila no existe fuera del mapa.
              src={`${TILE_HOST}/${zoom}/${((tx % n) + n) % n}/${Math.min(Math.max(ty, 0), n - 1)}.png`}
              alt=""
              loading="lazy"
              className="h-full w-full"
            />
          ))}
        </div>
        {tiles.map((tile, index) => (
          <span
            key={index}
            className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-editorial-cta shadow-[0_0_0_6px_rgba(184,72,26,0.28)]"
            style={{ left: `${((tile.x - x0) / 2) * 100}%`, top: `${((tile.y - y0) / 2) * 100}%` }}
          />
        ))}
        <span className="absolute bottom-1 right-1.5 rounded bg-white/80 px-1 text-[10px] text-editorial-soft">
          © OpenStreetMap
        </span>
      </div>
      <div className="space-y-2 p-4">
        <p className="flex items-start gap-2 text-sm text-editorial-body">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-editorial-cta" />
          {place}
        </p>
        {showLink && (
          <Link
            href="/trayectoria"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-editorial-cta hover:underline"
          >
            Ver en el mapa completo
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
};
