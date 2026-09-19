"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PageFlip } from "page-flip";
import {
  TransformComponent,
  TransformWrapper,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Minus,
  Plus,
} from "lucide-react";
import "./flip-book.css";

import { pageUrl, type ProjectPublication } from "@/lib/projects";

type FlipBookProps = {
  publication: ProjectPublication;
};

type Orientation = "portrait" | "landscape";

/** Rectángulo del libro dentro del escenario, para calzar la vista ampliada encima. */
type Rect = { left: number; top: number; width: number; height: number };

type ZoomSession = {
  rect: Rect;
  /** Punto (relativo al escenario) que queda fijo al empezar a acercar. */
  anchor: { x: number; y: number };
  startScale: number;
};

/** Proporción de una página (tabloide 792 × 1224 pt). */
const PAGE_WIDTH = 550;
const PAGE_HEIGHT = 850;
const MAX_SCALE = 4;

/**
 * Lector de publicaciones con efecto de pasar páginas (page-flip).
 * - Muestra imágenes WebP de cada página y solo carga las cercanas.
 * - En la página normal la rueda del mouse sigue desplazando la página.
 * - En pantalla completa: rueda / pellizco acercan hacia el cursor, arrastrar
 *   mueve la página ampliada, doble clic vuelve al libro.
 * - Teclado: ← → pasan página; + − acercan; Esc quita el zoom o sale.
 */
export const FlipBook = ({ publication }: FlipBookProps) => {
  const total = publication.pageCount;

  const readerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<PageFlip | null>(null);
  const zoomApiRef = useRef<ReactZoomPanPinchRef | null>(null);
  const zoomArmedRef = useRef(false);
  const imgsRef = useRef<HTMLImageElement[]>([]);
  const nativeFullscreenRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [current, setCurrent] = useState(0);
  const [orientation, setOrientation] = useState<Orientation>("landscape");
  const [expanded, setExpanded] = useState(false);
  const [zoom, setZoom] = useState<ZoomSession | null>(null);
  const [scale, setScale] = useState(1);

  /** Carga las imágenes de las páginas alrededor de la actual. */
  const loadAround = useCallback((index: number) => {
    for (let i = index - 2; i <= index + 5; i++) {
      const img = imgsRef.current[i];
      if (img && !img.getAttribute("src") && img.dataset.src) {
        img.src = img.dataset.src;
      }
    }
  }, []);

  // Crea el libro. page-flip manipula el DOM, por eso las páginas se crean
  // fuera de React dentro de un contenedor propio.
  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;

    (async () => {
      const { PageFlip } = await import("page-flip");
      if (cancelled || !host) return;

      const book = document.createElement("div");
      host.appendChild(book);

      const pages: HTMLElement[] = [];
      const imgs: HTMLImageElement[] = [];
      for (let n = 1; n <= total; n++) {
        const page = document.createElement("div");
        page.className = "flip-page";
        if (n === 1 || n === total) page.dataset.density = "hard";

        const img = document.createElement("img");
        img.alt = `Página ${n} de ${total}`;
        img.decoding = "async";
        img.draggable = false;
        img.dataset.src = pageUrl(publication, n, "md");

        page.appendChild(img);
        book.appendChild(page);
        pages.push(page);
        imgs.push(img);
      }
      imgsRef.current = imgs;
      loadAround(0);

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      const flip = new PageFlip(book, {
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
        size: "stretch",
        minWidth: 240,
        maxWidth: 1000,
        minHeight: 371,
        maxHeight: 1545,
        showCover: true,
        usePortrait: true,
        mobileScrollSupport: false,
        drawShadow: !reduceMotion,
        maxShadowOpacity: 0.35,
        flippingTime: reduceMotion ? 250 : 800,
        showPageCorners: true,
      });
      flip.loadFromHTML(pages);

      flip.on("flip", (e) => {
        const index = e.data as number;
        setCurrent(index);
        loadAround(index);
      });
      flip.on("changeOrientation", (e) => {
        setOrientation(e.data as Orientation);
      });

      flipRef.current = flip;
      setOrientation(flip.getOrientation());
      setReady(true);
    })();

    return () => {
      cancelled = true;
      try {
        flipRef.current?.destroy();
      } catch {
        // ya estaba destruido
      }
      flipRef.current = null;
      imgsRef.current = [];
      if (host) host.innerHTML = "";
    };
  }, [publication, total, loadAround]);

  const label =
    orientation === "portrait"
      ? `Página ${current + 1} de ${total}`
      : current === 0
        ? `Portada · 1 de ${total}`
        : current >= total - 1
          ? `Contraportada · ${total} de ${total}`
          : `Páginas ${current + 1}–${current + 2} de ${total}`;

  /**
   * Páginas en cada lado del libro, igual que las dibuja page-flip:
   * en horizontal la portada va a la derecha y la contraportada a la izquierda.
   */
  const slots: (number | null)[] =
    orientation === "portrait"
      ? [current]
      : current === 0
        ? [null, 0]
        : [current, current + 1 < total ? current + 1 : null];

  const prev = () => flipRef.current?.flipPrev();
  const next = () => flipRef.current?.flipNext();

  // ── Pantalla completa ────────────────────────────────────────────────
  // API nativa cuando existe; si no (iPhone), el lector ocupa toda la ventana.
  const enterExpanded = useCallback(async () => {
    setExpanded(true);
    const el = readerRef.current;
    if (el?.requestFullscreen && !document.fullscreenElement) {
      try {
        await el.requestFullscreen();
        nativeFullscreenRef.current = true;
      } catch {
        nativeFullscreenRef.current = false;
      }
    }
  }, []);

  const exitExpanded = useCallback(() => {
    setExpanded(false);
    setZoom(null);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    nativeFullscreenRef.current = false;
  }, []);

  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement && nativeFullscreenRef.current) {
        nativeFullscreenRef.current = false;
        setExpanded(false);
        setZoom(null);
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // El libro se recalcula al cambiar de tamaño; se bloquea el scroll de fondo.
  useEffect(() => {
    const raf = requestAnimationFrame(() => flipRef.current?.update());
    document.body.style.overflow = expanded ? "hidden" : "";
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = "";
    };
  }, [expanded]);

  // ── Zoom (solo en pantalla completa) ─────────────────────────────────
  /** Pasa del libro a la vista ampliada, fijando el punto `anchor`. */
  const startZoom = useCallback(
    (anchor?: { x: number; y: number }, startScale = 1.5) => {
      const stage = stageRef.current;
      const block = hostRef.current?.querySelector<HTMLElement>(".stf__block");
      if (!stage || !block) return;

      const s = stage.getBoundingClientRect();
      const b = block.getBoundingClientRect();
      zoomArmedRef.current = false;
      setScale(1);
      setZoom({
        rect: { left: b.left - s.left, top: b.top - s.top, width: b.width, height: b.height },
        anchor: anchor ?? { x: s.width / 2, y: s.height / 2 },
        startScale,
      });
    },
    []
  );

  const endZoom = useCallback(() => {
    zoomApiRef.current = null;
    setZoom(null);
    setScale(1);
  }, []);

  // Rueda o pellizco sobre el libro (en pantalla completa) empiezan el zoom.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !expanded || zoom) return;

    const toStage = (clientX: number, clientY: number) => {
      const s = stage.getBoundingClientRect();
      return { x: clientX - s.left, y: clientY - s.top };
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) startZoom(toStage(e.clientX, e.clientY), 1.25);
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      const [a, b] = [e.touches[0], e.touches[1]];
      startZoom(toStage((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2), 1.5);
    };

    stage.addEventListener("wheel", onWheel, { passive: false });
    stage.addEventListener("touchstart", onTouchStart, { passive: true });
    return () => {
      stage.removeEventListener("wheel", onWheel);
      stage.removeEventListener("touchstart", onTouchStart);
    };
  }, [expanded, zoom, startZoom]);

  const zoomIn = () => {
    if (!zoom) startZoom(undefined, 1.5);
    else zoomApiRef.current?.zoomIn(0.5);
  };
  const zoomOut = () => zoomApiRef.current?.zoomOut(0.5);

  // Teclado.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, [contenteditable]")) return;
      if (e.key === "ArrowLeft") flipRef.current?.flipPrev();
      else if (e.key === "ArrowRight") flipRef.current?.flipNext();
      else if (e.key === "Escape" && expanded) {
        if (zoom) endZoom();
        else exitExpanded();
      } else if (expanded && (e.key === "+" || e.key === "=")) zoomIn();
      else if (expanded && e.key === "-") zoomOut();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, zoom, exitExpanded, endZoom]);

  const iconButton =
    "flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white";

  return (
    <div
      ref={readerRef}
      className={
        expanded
          ? "fixed inset-0 z-[100] flex flex-col bg-stone-100"
          : "flex flex-col gap-4 rounded-2xl border border-slate-200 bg-stone-100 p-3 md:p-6"
      }
    >
      {/* Escenario: libro y, encima, la vista ampliada */}
      <div
        ref={stageRef}
        className={`relative ${
          expanded
            ? "flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 pt-4"
            : ""
        }`}
      >
        <div
          className={`relative mx-auto w-full ${zoom ? "invisible" : ""}`}
          style={{
            maxWidth: expanded
              ? "calc((100vh - 110px) * 1.294)"
              : "calc((100vh - 280px) * 1.294)",
          }}
        >
          {!ready && (
            <div className="mx-auto flex aspect-[1100/850] w-full items-center justify-center rounded-lg bg-white/60 text-sm text-slate-500">
              Cargando publicación…
            </div>
          )}
          <div ref={hostRef} aria-label={publication.title} role="region" />
        </div>

        {zoom && (
          <div className="absolute inset-0 cursor-grab active:cursor-grabbing">
            <TransformWrapper
              minScale={1}
              maxScale={MAX_SCALE}
              limitToBounds
              wheel={{ step: 0.35 }}
              doubleClick={{ mode: "reset" }}
              initialScale={zoom.startScale}
              initialPositionX={zoom.anchor.x * (1 - zoom.startScale)}
              initialPositionY={zoom.anchor.y * (1 - zoom.startScale)}
              onInit={(api) => {
                zoomApiRef.current = api;
                setScale(zoom.startScale);
                // A partir de aquí, volver a escala 1 cierra la vista ampliada.
                setTimeout(() => (zoomArmedRef.current = true), 150);
              }}
              onTransformed={(_, state) => {
                setScale(state.scale);
                if (zoomArmedRef.current && state.scale <= 1.001) {
                  zoomArmedRef.current = false;
                  setTimeout(endZoom, 0);
                }
              }}
            >
              <TransformComponent
                wrapperStyle={{ width: "100%", height: "100%" }}
                contentStyle={{ width: "100%", height: "100%" }}
              >
                <div className="relative h-full w-full">
                  <div
                    className="absolute flex"
                    style={{
                      left: zoom.rect.left,
                      top: zoom.rect.top,
                      width: zoom.rect.width,
                      height: zoom.rect.height,
                    }}
                  >
                    {slots.map((i, slot) =>
                      i === null ? (
                        <div key={`empty-${slot}`} className="h-full flex-1" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={i}
                          src={pageUrl(publication, i + 1, "lg")}
                          alt={`Página ${i + 1} de ${total}`}
                          draggable={false}
                          className="h-full min-w-0 flex-1 select-none bg-white object-cover shadow-md"
                        />
                      )
                    )}
                  </div>
                </div>
              </TransformComponent>
            </TransformWrapper>
          </div>
        )}
      </div>

      {/* Barra de controles */}
      <div
        className={`flex flex-wrap items-center justify-center gap-2 ${
          expanded ? "px-4 py-3" : ""
        }`}
      >
        <button
          type="button"
          onClick={prev}
          disabled={current === 0}
          className={iconButton}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span
          className="min-w-[11rem] text-center text-sm font-medium tabular-nums text-slate-700"
          aria-live="polite"
        >
          {label}
        </span>
        <button
          type="button"
          onClick={next}
          disabled={current >= total - 1}
          className={iconButton}
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <span className="mx-1 hidden h-6 w-px bg-slate-300 sm:block" />

        {expanded && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={zoomOut}
              disabled={!zoom}
              className={iconButton}
              aria-label="Alejar"
              title="Alejar (−)"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-12 text-center text-sm tabular-nums text-slate-600">
              {Math.round((zoom ? scale : 1) * 100)}%
            </span>
            <button
              type="button"
              onClick={zoomIn}
              disabled={scale >= MAX_SCALE - 0.01}
              className={iconButton}
              aria-label="Acercar"
              title="Acercar (+) · también con la rueda o pellizcando"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => (expanded ? exitExpanded() : enterExpanded())}
          className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-orange-50 hover:text-orange-700"
          title={expanded ? "Salir (Esc)" : "Pantalla completa (con zoom)"}
        >
          {expanded ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          <span className="hidden sm:inline">
            {expanded ? "Salir" : "Pantalla completa"}
          </span>
        </button>

        {expanded && (
          <p className="hidden w-full text-center text-xs text-slate-500 md:block">
            {zoom
              ? "Arrastra para moverte · doble clic para volver al libro"
              : "Usa la rueda del mouse o pellizca para acercar"}
          </p>
        )}
      </div>
    </div>
  );
};
