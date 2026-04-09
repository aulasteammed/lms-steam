"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { SocialIcon } from "../../../_components/social-icons";
import { normalizeSocialPlatform } from "../../../_components/social-icons";

export const TEMPLATE_LABELS: Record<string, string> = {
    cover_person:   "Personaje",
    full_article:   "Artículo",
    profile_simple: "Perfil",
    news_short:     "Noticia",
};

// ── Types ─────────────────────────────────────────────────────

export type Block = {
    id:             string;
    type:           "paragraph" | "pullquote" | "image" | "divider" | "list";
    content?:       string;
    imageUrl?:      string;
    imagePosition?: "fw" | "fl" | "fr";
    caption?:       string;
    items?:         string[];
    position:       number;
};

export type Article = {
    id:                   string;
    slug:                 string;
    title:                string;
    subtitle:             string | null;
    coverImage:           string | null;
    authorName:           string;
    authorBio:            string | null;
    authorPhoto:          string | null;
    authorSocialPlatform: string | null;
    authorSocialUrl:      string | null;
    hookPhrase:           string | null;
    template:             string;
    accentColor:          string;
    darkColColor:         string;
    blocks:               Block[];
    publishedAt:          Date | null;
};

export type AdjacentArticle = { slug: string; title: string } | null;

export type ReaderProps = {
    article:   Article;
    viewCount: number;
    articleId: string;
    prev:      AdjacentArticle;
    next:      AdjacentArticle;
};

export function ProgressBar({ accent }: { accent: string }) {
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        const fn = () => {
            const scrolled = window.scrollY;
            const total    = document.documentElement.scrollHeight - window.innerHeight;
            setProgress(total > 0 ? Math.min(100, (scrolled / total) * 100) : 0);
        };
        window.addEventListener("scroll", fn, { passive: true });
        return () => window.removeEventListener("scroll", fn);
    }, []);
    return (
        <div className="fixed top-0 left-0 right-0 h-[3px] bg-[#e2ddd8] z-50 pointer-events-none">
            <div className="h-full transition-[width] duration-75 ease-linear" style={{ width: `${progress}%`, background: accent }} />
        </div>
    );
}

// ── Image overlay ─────────────────────────────────────────────

export function ImageOverlay({ images, currentIdx, onClose, onNav }: {
    images:     { url: string; caption?: string }[];
    currentIdx: number;
    onClose:    () => void;
    onNav:      (d: number) => void;
}) {
    useEffect(() => {
        const fn = (e: KeyboardEvent) => {
            // Cuando el overlay está abierto, ← → navegan imágenes
            if (e.key === "Escape")     onClose();
            if (e.key === "ArrowLeft")  { e.preventDefault(); onNav(-1); }
            if (e.key === "ArrowRight") { e.preventDefault(); onNav(1); }
        };
        window.addEventListener("keydown", fn);
        return () => window.removeEventListener("keydown", fn);
    }, [onClose, onNav]);

    const img = images[currentIdx];
    if (!img) return null;

    return (
        <div className="fixed inset-0 bg-black/92 z-[500] flex flex-col items-center justify-center gap-4"
            onClick={onClose}>
            <button className="absolute top-5 right-6 text-white/50 hover:text-white tracking-widest uppercase text-[11px]"
                onClick={onClose}>
                ESC · Cerrar
            </button>
            <div className="relative max-w-3xl w-full max-h-[70vh] aspect-video" onClick={e => e.stopPropagation()}>
                <Image src={img.url} alt={img.caption ?? ""} fill className="object-contain" sizes="900px" />
            </div>
            {img.caption && (
                <p className="text-[11px] text-white/50 tracking-wide">{img.caption}</p>
            )}
            <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                <button disabled={currentIdx === 0} onClick={() => onNav(-1)}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-10 text-white text-xl flex items-center justify-center transition-colors">‹</button>
                <span className="text-[11px] text-white/40">{currentIdx + 1} / {images.length}</span>
                <button disabled={currentIdx === images.length - 1} onClick={() => onNav(1)}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-10 text-white text-xl flex items-center justify-center transition-colors">›</button>
            </div>
        </div>
    );
}

// ── Block renderer ────────────────────────────────────────────

export function BlockRenderer({ block, accent, paragraphFocused, onImageClick }: {
    block:            Block;
    accent:           string;
    paragraphFocused: boolean | null;
    onImageClick:     (url: string) => void;
}) {
    if (block.type === "paragraph") {
        const dimCls = paragraphFocused === false ? "opacity-[0.12] blur-[0.4px]" : "";
        return (
            <p data-block-type="paragraph"
                className={["text-[16px] leading-[1.88] text-[#2d2d2d] mb-5 break-inside-avoid transition-all duration-200", dimCls].join(" ")}>
                {block.content}
            </p>
        );
    }
    if (block.type === "pullquote") {
        const dimCls = paragraphFocused === false ? "opacity-30" : "";
        return (
            <blockquote
                style={{ fontFamily: "var(--font-blog-serif, Georgia, serif)", borderLeftColor: accent }}
                className={["py-3 px-5 my-5 text-xl font-semibold italic text-[#12110f] leading-snug border-l-[3px] break-inside-avoid transition-all duration-200", dimCls].join(" ")}>
                {block.content}
            </blockquote>
        );
    }
    if (block.type === "divider") {
        return <hr className="border-t border-dashed border-[#e2ddd8] my-4 break-inside-avoid" />;
    }
    if (block.type === "image" && block.imageUrl) {
        const isFloat  = block.imagePosition === "fl" || block.imagePosition === "fr";
        const floatCls = block.imagePosition === "fl"
            ? "md:float-left md:mr-5 mb-3 w-full md:w-[46%]"
            : block.imagePosition === "fr"
                ? "md:float-right md:ml-5 mb-3 w-full md:w-[46%]"
                : "w-full my-4";
        const dimCls = paragraphFocused === false ? "opacity-40" : "";
        return (
            <div className={[floatCls, "break-inside-avoid transition-opacity duration-200", dimCls].join(" ")}>
                <div className={["relative overflow-hidden border border-[#e2ddd8] cursor-pointer group rounded-lg",
                    isFloat ? "aspect-[4/3]" : "aspect-video"].join(" ")}
                    onClick={() => onImageClick(block.imageUrl!)}>
                    <Image src={block.imageUrl} alt={block.caption ?? ""} fill
                        className="object-cover transition-[filter] group-hover:brightness-90" sizes="600px" />
                    <div className="absolute bottom-1.5 right-2 text-sm text-black/40">⊕</div>
                </div>
                {block.caption && (
                    <p className="text-[10px] text-[#8a8682] mt-1.5 leading-relaxed">{block.caption}</p>
                )}
            </div>
        );
    }
    if (block.type === "list" && Array.isArray(block.items) && block.items.length > 0) {
        const dimCls = paragraphFocused === false ? "opacity-[0.12] blur-[0.4px]" : "";
        const validItems = block.items.filter((item: string) => item?.trim().length >= 3);
        if (!validItems.length) return null;
        return (
            <ul className={["mb-5 break-inside-avoid transition-all duration-200 space-y-2", dimCls].join(" ")}>
                {validItems.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2.5 text-[16px] leading-[1.88] text-gray-700">

                        <span 
                            className="mt-[0.55em] w-1.5 h-1.5 rounded-full flex-shrink-0" 
                            style={{ background: accent }} 
                        />
                        
                        <span className="text-gray-900">{item}</span>
                    </li>
                ))}
            </ul>
        );
    }
    return null;
}

// ── Byline ────────────────────────────────────────────────────

export function Byline({
    article,
    viewCount,
    dark = false,
    viewDelta = 0,
    highlightViews = false,
}: {
    article:   Article;
    viewCount: number;
    dark?:     boolean;
    viewDelta?: number;
    highlightViews?: boolean;
}) {
    const normalizedPlatform = normalizeSocialPlatform(article.authorSocialPlatform);
    const initials = article.authorName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    const border   = dark ? "border-white/15"  : "border-[#e2ddd8]";
    const nameCol  = dark ? "text-white"        : "text-[#12110f]";
    const metaCol  = dark ? "text-white/50"     : "text-[#8a8682]";
    const totalViews = viewCount + viewDelta;

    return (
        <div className={`flex items-start gap-3 py-4 border-t border-b ${border}`}>
            <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden border-2"
                style={{ borderColor: article.accentColor }}>
                {article.authorPhoto
                    ? <Image src={article.authorPhoto} alt={article.authorName} width={40} height={40}
                        className="object-cover w-full h-full" />
                    : <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ background: article.accentColor }}>{initials}</div>
                }
            </div>
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className={`text-[13px] font-semibold ${nameCol}`}>{article.authorName}</span>
                {normalizedPlatform && article.authorSocialUrl && (
                    <span
                        className={`flex items-center gap-1.5 text-[11px] ${metaCol} w-fit`}
                       >
                        <SocialIcon platform={normalizedPlatform} />
                        <span className="truncate">{article.authorSocialUrl}</span>
                    </span>
                )}
                {article.authorBio && (
                    <span className={`text-[11px] ${metaCol} leading-relaxed mt-0.5`}>{article.authorBio}</span>
                )}
            </div>
            <div className="text-right flex-shrink-0">
                <div className={`text-[11px] ${metaCol}`}>
                    {article.publishedAt
                        ? new Date(article.publishedAt).toLocaleDateString("es-CO", {
                            day: "numeric", month: "long", year: "numeric",
                        })
                        : ""}
                </div>
                <div
                    className={`flex items-center justify-end gap-1 text-[10px] ${highlightViews ? "" : metaCol} mt-1`}
                    style={highlightViews ? { color: article.accentColor } : undefined}
                >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                    {totalViews.toLocaleString("es-CO")} vistas
                </div>
            </div>
        </div>
    );
}

// ── Prev/Next navigation ──────────────────────────────────────

export function PrevNext({ prev, next }: { prev: AdjacentArticle; next: AdjacentArticle }) {
    return (
        <div className="flex gap-4 pt-7 border-t border-[#e2ddd8]">
            {prev ? (
                <Link href={`/blog/${prev.slug}`}
                    className="flex-1 p-4 bg-white border border-[#e2ddd8] hover:border-[#12110f] hover:shadow-[2px_2px_0_#12110f] transition-all rounded-xl flex flex-col gap-1.5">
                    <span className="text-[9px] tracking-[0.2em] uppercase text-[#8a8682]">← Anterior</span>
                    <span className="text-[14px] font-bold text-[#12110f] leading-snug">{prev.title}</span>
                </Link>
            ) : <div className="flex-1" />}
            <div className="flex items-center">
                <Link href="/blog" className="text-[11px] text-[#8a8682] hover:text-[#12110f] transition-colors px-2"
                   >Ver todos</Link>
            </div>
            {next ? (
                <Link href={`/blog/${next.slug}`}
                    className="flex-1 p-4 bg-white border border-[#e2ddd8] hover:border-[#12110f] hover:shadow-[2px_2px_0_#12110f] transition-all rounded-xl flex flex-col gap-1.5 text-right">
                    <span className="text-[9px] tracking-[0.2em] uppercase text-[#8a8682]">Siguiente →</span>
                    <span className="text-[14px] font-bold text-[#12110f] leading-snug">{next.title}</span>
                </Link>
            ) : <div className="flex-1" />}
        </div>
    );
}

// ── Keyboard shortcuts bar ────────────────────────────────────

export function KeyboardBar() {
    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#12110f] border border-[#2a2a2a] px-4 py-1.5 rounded-full z-40 whitespace-nowrap select-none text-[10px] text-white/40 tracking-wide"
           >
            <kbd className="bg-[#2a2a2a] border border-[#3a3a3a] px-1.5 py-0.5 rounded text-[11px] text-white/70">↑</kbd>
            <kbd className="bg-[#2a2a2a] border border-[#3a3a3a] px-1.5 py-0.5 rounded text-[11px] text-white/70">↓</kbd>
            párrafos
            <span className="w-px h-3 bg-[#2a2a2a]" />
            <kbd className="bg-[#2a2a2a] border border-[#3a3a3a] px-1.5 py-0.5 rounded text-[11px] text-white/70">F</kbd>
            foco
            <span className="w-px h-3 bg-[#2a2a2a]" />
            <kbd className="bg-[#2a2a2a] border border-[#3a3a3a] px-1.5 py-0.5 rounded text-[11px] text-white/70">Esc</kbd>
            salir foco
        </div>
    );
}

// ── Top nav bar ───────────────────────────────────────────────

export function TopBar({ article, focusMode, onToggleFocus }: {
    article:       Article;
    focusMode:     boolean;
    onToggleFocus: () => void;
}) {
    return (
        <div className="sticky top-0 z-40 flex items-center justify-between px-8 py-3 border-b border-[#e2ddd8]"
            style={{ background: "rgba(250,250,248,0.92)", backdropFilter: "blur(8px)" }}>
            <Link href="/blog" className="flex items-center gap-2 group">
                <div className="w-5 h-5 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
                    style={{ background: article.accentColor }}>
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M19 12H5M12 5l-7 7 7 7"/>
                    </svg>
                </div>
                <span className="text-[10px] tracking-[0.2em] uppercase text-[#8a8682] group-hover:text-[#12110f] transition-colors"
                   >Blog</span>
                <span className="text-[#e2ddd8] text-[10px]">›</span>
                <span className="text-[10px] text-[#12110f] truncate max-w-[280px]">{article.title}</span>
            </Link>
            <div className="flex items-center gap-2">
                <button onClick={onToggleFocus}
                    className={["flex items-center gap-1.5 px-3 py-1 text-[10px] tracking-wide uppercase rounded-full border transition-all",
                        focusMode
                            ? "bg-[#12110f] border-[#12110f] text-white"
                            : "bg-white border-[#e2ddd8] text-[#8a8682] hover:border-[#12110f] hover:text-[#12110f]"
                    ].join(" ")}>
                    ◉ Foco
                </button>
                {focusMode && (
                    <button onClick={onToggleFocus}
                        className="px-3 py-1 text-[10px] tracking-wide uppercase rounded-full bg-red-600 border border-red-600 text-white"
                       >
                        ✕ Salir
                    </button>
                )}
            </div>
        </div>
    );
}

// ── useReaderState ────────────────────────────────────────────
// La navegación con ← → requiere que el div scrolleable tenga
// tabIndex={0} y que el listener esté en ese div, no en window.
// De lo contrario el div captura el scroll y consume las teclas.

export function useReaderState({
    articleId, blocks, prev, next, router,
}: {
    articleId: string;
    blocks:    Block[];
    prev:      AdjacentArticle;
    next:      AdjacentArticle;
    router:    ReturnType<typeof import("next/navigation").useRouter>;
}) {
    const paragraphBlocks = blocks.filter(b => b.type === "paragraph");
    const imageBlocks     = blocks.filter(b => b.type === "image" && b.imageUrl)
        .map(b => ({ url: b.imageUrl!, caption: b.caption }));

    const [focusMode,  setFocusMode]  = useState(false);
    const [focusIdx,   setFocusIdx]   = useState(0);
    const [imgOverlay, setImgOverlay] = useState(false);
    const [imgIdx,     setImgIdx]     = useState(0);

    const viewRecorded = useRef(false);
    const endRef       = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const sentinel = endRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !viewRecorded.current) {
                    viewRecorded.current = true;
                    fetch("/api/blog/views", {
                        method:  "POST",
                        headers: { "Content-Type": "application/json" },
                        body:    JSON.stringify({ articleId }),
                    }).catch(() => {});
                }
            },
            { threshold: 0.5 }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [articleId]);

    // Keyboard shortcuts — escuchar en window es suficiente,
    // pero hay que usar e.preventDefault() en ← → para que el
    // div scrolleable no los consuma como scroll horizontal
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            // Overlay abierto — las flechas las maneja ImageOverlay
            if (imgOverlay) return;

            if (e.key === "f" || e.key === "F") {
                setFocusMode(v => !v);
                return;
            }
            if (e.key === "Escape" && focusMode) {
                setFocusMode(false);
                return;
            }

            if (focusMode) {
                // En modo foco ↑↓ navegan párrafos
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setFocusIdx(i => Math.min(i + 1, paragraphBlocks.length - 1));
                }
                if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setFocusIdx(i => Math.max(i - 1, 0));
                }
            } else {
                // Fuera de modo foco ← → navegan artículos
                // preventDefault evita que el div scrolleable los interprete como scroll
                if (e.key === "ArrowLeft" && prev) {
                    e.preventDefault();
                    router.push(`/blog/${prev.slug}`);
                }
                if (e.key === "ArrowRight" && next) {
                    e.preventDefault();
                    router.push(`/blog/${next.slug}`);
                }
            }
        };

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [focusMode, imgOverlay, prev, next, paragraphBlocks.length, router]);

    // Scroll al párrafo enfocado
    useEffect(() => {
        if (!focusMode) return;
        document.querySelectorAll("[data-block-type='paragraph']")[focusIdx]
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, [focusIdx, focusMode]);

    const openImg = (url: string) => {
        const idx = imageBlocks.findIndex(i => i.url === url);
        setImgIdx(idx >= 0 ? idx : 0);
        setImgOverlay(true);
    };

    const navImg = useCallback((d: number) => {
        setImgIdx(i => Math.max(0, Math.min(imageBlocks.length - 1, i + d)));
    }, [imageBlocks.length]);

    const getParagraphFocused = (block: Block): boolean | null => {
        if (!focusMode) return null;
        if (block.type !== "paragraph") return null;
        const idx = paragraphBlocks.findIndex(b => b.id === block.id);
        return idx === focusIdx;
    };

    return {
        focusMode, setFocusMode,
        imgOverlay, setImgOverlay,
        imgIdx, imageBlocks,
        openImg, navImg,
        getParagraphFocused,
        endRef,
    };
}
