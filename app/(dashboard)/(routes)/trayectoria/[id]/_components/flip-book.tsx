"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PageFlip } from "page-flip";
import {
  TransformComponent,
  TransformWrapper,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize,
  Minimize,
  Minus,
  Plus,
} from "lucide-react";
import "./flip-book.css";

import type { ProjectDocument } from "@/lib/projects";
import { BackLink } from "../../_components/back-link";

type FlipBookProps = {
  publication: ProjectDocument;
  /**
   * Modo inmersivo: el lector abre ocupando toda la ventana y, al salir,
   * lleva a esta ruta (la página del proyecto) en lugar de encogerse.
   */
  exitHref?: string;
  /** Texto del enlace de salida en modo inmersivo. */
  exitLabel?: string;
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

/**
 * Ancho base de una página. El alto sale de la proporción de la hoja del
 * documento: un periódico tabloide y un informe en carta no miden lo mismo.
 */
const PAGE_WIDTH = 550;
const MAX_SCALE = 4;
/** Margen alrededor del libro en modo inmersivo (p-4). */
const STAGE_PADDING = 32;

/**
 * Lector de publicaciones con efecto de pasar páginas (page-flip).
 * - Muestra imágenes WebP de cada página y solo carga las cercanas.
 * - Incrustado, la rueda del mouse sigue desplazando la página.
 * - Con `exitHref` abre directo a ventana completa (modo inmersivo).
 * - A ventana completa: rueda / pellizco acercan hacia el cursor, arrastrar
 *   mueve la página ampliada, doble clic vuelve al libro.
 * - Teclado: ← → pasan página; + − acercan; Esc quita el zoom o sale.
 */
export const FlipBook = ({
  publication,
  exitHref,
  exitLabel = "Volver",
}: FlipBookProps) => {
  const total = publication.pageCount;
  const pageHeight = Math.round(
    (PAGE_WIDTH * publication.pageHeight) / publication.pageWidth
  );
  /** Ancho / alto del libro abierto (dos páginas). */
  const spreadRatio = (PAGE_WIDTH * 2) / pageHeight;
  const immersive = Boolean(exitHref);
  const router = useRouter();

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
  const [expanded, setExpanded] = useState(immersive);
  /** Pantalla completa nativa del navegador (además de ocupar la ventana). */
  const [nativeFs, setNativeFs] = useState(false);
  const [zoom, setZoom] = useState<ZoomSession | null>(null);
  const [scale, setScale] = useState(1);
  /** Ancho del libro en modo inmersivo (px CSS), ajustado al espacio disponible. */
  const [bookWidth, setBookWidth] = useState<number | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  /** Zoom del navegador con el que se ajustó el libro por última vez. */
  const fitDprRef = useRef<number | null>(null);

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
        img.dataset.src = publication.pages[n - 1].url;

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
        height: pageHeight,
        size: "stretch",
        minWidth: 240,
        maxWidth: 1000,
        minHeight: Math.round((240 * pageHeight) / PAGE_WIDTH),
        maxHeight: Math.round((1000 * pageHeight) / PAGE_WIDTH),
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
  }, [publication, total, pageHeight, loadAround]);

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
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    nativeFullscreenRef.current = false;
    if (exitHref) {
      router.push(exitHref);
      return;
    }
    setExpanded(false);
    setZoom(null);
  }, [exitHref, router]);

  /** En modo inmersivo el botón alterna solo la pantalla completa nativa. */
  const toggleNativeFs = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else readerRef.current?.requestFullscreen?.().catch(() => {});
  }, []);

  useEffect(() => {
    const onChange = () => {
      setNativeFs(Boolean(document.fullscreenElement));
      if (!document.fullscreenElement && nativeFullscreenRef.current) {
        nativeFullscreenRef.current = false;
        if (immersive) return;
        setExpanded(false);
        setZoom(null);
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [immersive]);

  // Modo inmersivo: el libro se ajusta al espacio disponible. Si lo que cambia
  // es el zoom del navegador (Ctrl +), se conserva el ancho: así el pliego
  // completo crece y aparece el desplazamiento, en vez de encogerse a una página.
  useEffect(() => {
    if (!immersive) return;
    const fit = () => {
      const stage = stageRef.current;
      if (!stage) return;
      const dpr = window.devicePixelRatio;
      if (fitDprRef.current !== null && fitDprRef.current !== dpr) return;
      fitDprRef.current = dpr;
      setBookWidth(
        Math.floor(
          Math.min(
            (stage.clientHeight - STAGE_PADDING) * spreadRatio,
            stage.clientWidth - STAGE_PADDING
          )
        )
      );
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [immersive, spreadRatio]);

  useEffect(() => {
    if (bookWidth === null) return;
    const raf = requestAnimationFrame(() => flipRef.current?.update());
    return () => cancelAnimationFrame(raf);
  }, [bookWidth, ready]);

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

      let rect: Rect = {
        left: b.left - s.left,
        top: b.top - s.top,
        width: b.width,
        height: b.height,
      };
      // Con el navegador ampliado el libro puede ser más grande que el
      // escenario: la vista ampliada parte entonces de un encuadre que sí cabe.
      const overflows =
        rect.left < 0 ||
        rect.top < 0 ||
        rect.left + rect.width > s.width + 1 ||
        rect.top + rect.height > s.height + 1;
      if (overflows) {
        const k = Math.min(
          (s.width - STAGE_PADDING) / b.width,
          (s.height - STAGE_PADDING) / b.height
        );
        const width = b.width * k;
        const height = b.height * k;
        rect = { left: (s.width - width) / 2, top: (s.height - height) / 2, width, height };
        anchor = undefined;
      }

      setZoom({
        rect,
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
      // Si el libro no cabe (navegador ampliado), la rueda desplaza como en
      // cualquier página; el zoom del lector sigue disponible con el botón +.
      const scroller = scrollerRef.current;
      if (
        scroller &&
        (scroller.scrollHeight > scroller.clientHeight + 1 ||
          scroller.scrollWidth > scroller.clientWidth + 1)
      ) {
        return;
      }
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
      {immersive && exitHref && (
        <div className="flex min-h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 py-2">
          <BackLink href={exitHref}>{exitLabel}</BackLink>
          <span className="h-4 w-px shrink-0 bg-slate-300" />
          <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
            {publication.title}
          </h1>
          <a
            href={publication.pdf}
            download
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Descargar</span>
          </a>
        </div>
      )}

      {/* Escenario: libro y, encima, la vista ampliada */}
      <div
        ref={stageRef}
        className={`relative ${
          immersive
            ? "min-h-0 flex-1"
            : expanded
              ? "flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 pt-4"
              : ""
        }`}
      >
        {/* En modo inmersivo el libro va en un área con desplazamiento propio:
            con margen automático queda centrado si cabe y alcanzable si no. */}
        <div
          ref={scrollerRef}
          className={immersive ? "absolute inset-0 flex overflow-auto p-4" : "contents"}
        >
          <div
            className={`relative ${immersive ? "m-auto shrink-0" : "mx-auto w-full"} ${
              zoom ? "invisible" : ""
            }`}
            style={
              immersive
                ? { width: bookWidth ?? `min(100%, calc((100vh - 160px) * ${spreadRatio}))` }
                : {
                    maxWidth: expanded
                      ? `calc((100vh - 110px) * ${spreadRatio})`
                      : `calc((100vh - 280px) * ${spreadRatio})`,
                  }
            }
          >
            {!ready && (
              <div
                className="mx-auto flex w-full items-center justify-center rounded-lg bg-white/60 text-sm text-slate-500"
                style={{ aspectRatio: spreadRatio }}
              >
                Cargando documento…
              </div>
            )}
            <div ref={hostRef} aria-label={publication.title} role="region" />
          </div>
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
                          src={publication.pages[i].urlLarge ?? publication.pages[i].url}
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

        {immersive ? (
          <button
            type="button"
            onClick={toggleNativeFs}
            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-orange-50 hover:text-orange-700"
            title={nativeFs ? "Salir de pantalla completa (Esc)" : "Pantalla completa"}
          >
            {nativeFs ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            <span className="hidden sm:inline">
              {nativeFs ? "Salir de pantalla completa" : "Pantalla completa"}
            </span>
          </button>
        ) : (
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
        )}

      </div>
    </div>
  );
};
