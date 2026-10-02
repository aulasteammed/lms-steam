import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

type MiniMapProps = {
  /** [longitud, latitud] */
  coordinates: [number, number];
  place: string;
};

const ZOOM = 10;
const TILE_HOST = "https://tile.openstreetmap.org";

/**
 * Mapa pequeño y estático del lugar del proyecto: cuatro teselas de
 * OpenStreetMap con un punto encima. No carga la librería del mapa.
 */
export const MiniMap = ({ coordinates, place }: MiniMapProps) => {
  const [lon, lat] = coordinates;
  const n = 2 ** ZOOM;
  const rad = (lat * Math.PI) / 180;
  const x = ((lon + 180) / 360) * n;
  const y = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n;

  // Las 4 teselas que rodean el punto, para que quede cerca del centro.
  const x0 = Math.round(x) - 1;
  const y0 = Math.round(y) - 1;
  const tiles = [
    [x0, y0],
    [x0 + 1, y0],
    [x0, y0 + 1],
    [x0 + 1, y0 + 1],
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="relative aspect-square bg-stone-100">
        <div className="grid h-full w-full grid-cols-2 saturate-[0.65]">
          {tiles.map(([tx, ty]) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${tx}-${ty}`}
              src={`${TILE_HOST}/${ZOOM}/${tx}/${ty}.png`}
              alt=""
              loading="lazy"
              className="h-full w-full"
            />
          ))}
        </div>
        <span
          className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-orange-600 shadow-[0_0_0_6px_rgba(249,115,22,0.28)]"
          style={{ left: `${((x - x0) / 2) * 100}%`, top: `${((y - y0) / 2) * 100}%` }}
        />
        <span className="absolute bottom-1 right-1.5 rounded bg-white/80 px-1 text-[10px] text-slate-500">
          © OpenStreetMap
        </span>
      </div>
      <div className="space-y-2 p-4">
        <p className="flex items-start gap-2 text-sm text-slate-700">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
          {place}
        </p>
        <Link
          href="/proyectos"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-700 hover:underline"
        >
          Ver en el mapa completo
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};
