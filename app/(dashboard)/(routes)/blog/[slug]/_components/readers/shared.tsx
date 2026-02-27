"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";


export const TEMPLATE_LABELS: Record<string, string> = {
    cover_person:   "Personaje",
    full_article:   "Artículo",
    profile_simple: "Perfil",
    news_short:     "Noticia",
};

// ── Types ─────────────────────────────────────────────────────

export type Block = {
    id:             string;
    type:           "paragraph" | "pullquote" | "image" | "divider";
    content?:       string;
    imageUrl?:      string;
    imagePosition?: "fw" | "fl" | "fr";
    caption?:       string;
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

// ── Social icon ───────────────────────────────────────────────

const SOCIAL_PATHS: Record<string, string> = {
    instagram: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
    twitter:   "M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z",
    linkedin:  "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
    facebook:  "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
    tiktok:    "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
    youtube:   "M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z",
    github:    "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
    website:   "M12 2a10 10 0 100 20A10 10 0 0012 2zm0 0",
};

export function SocialIcon({ platform }: { platform: string }) {
    const d = SOCIAL_PATHS[platform.toLowerCase()];
    if (!d) return <span className="text-[10px] uppercase">{platform}</span>;
    return <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d={d} /></svg>;
}

// ── Progress bar ──────────────────────────────────────────────
// Escucha scroll en el div con id "reader-scroll"

export function ProgressBar({ accent, scrollId = "reader-scroll" }: { accent: string; scrollId?: string }) {
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        const el = document.getElementById(scrollId);
        if (!el) return;
        const fn = () => {
            const p = el.scrollTop / (el.scrollHeight - el.clientHeight) * 100 || 0;
            setProgress(Math.min(100, p));
        };
        el.addEventListener("scroll", fn, { passive: true });
        return () => el.removeEventListener("scroll", fn);
    }, [scrollId]);
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
            ? "float-left mr-5 mb-3 w-[46%]"
            : block.imagePosition === "fr"
                ? "float-right ml-5 mb-3 w-[46%]"
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
    return null;
}

// ── Byline ────────────────────────────────────────────────────

export function Byline({ article, viewCount, dark = false }: {
    article:   Article;
    viewCount: number;
    dark?:     boolean;
}) {
    const initials = article.authorName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    const border   = dark ? "border-white/15"  : "border-[#e2ddd8]";
    const nameCol  = dark ? "text-white"        : "text-[#12110f]";
    const metaCol  = dark ? "text-white/50"     : "text-[#8a8682]";

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
                {article.authorSocialPlatform && article.authorSocialUrl && (
                    <a href={article.authorSocialUrl} target="_blank" rel="noopener noreferrer"
                        className={`flex items-center gap-1.5 text-[11px] ${metaCol} hover:opacity-70 transition-opacity w-fit`}
                       >
                        <SocialIcon platform={article.authorSocialPlatform} />
                        <span className="truncate">{article.authorSocialUrl}</span>
                    </a>
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
                <div className={`flex items-center justify-end gap-1 text-[10px] ${metaCol} mt-1`}>
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                    {viewCount.toLocaleString("es-CO")} vistas
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

    // Registrar vista al llegar al final
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