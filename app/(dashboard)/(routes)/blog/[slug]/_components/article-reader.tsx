"use client";
// app/(blog)/blog/[slug]/_components/article-reader.tsx

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SocialIcon } from "../../_components/social-icons";
import { normalizeSocialPlatform } from "../../_components/social-icons";

// ── Constants ─────────────────────────────────────────────────
const MONO  = "var(--font-mono, 'IBM Plex Mono', monospace)";
const SERIF = "var(--font-serif, 'Playfair Display', Georgia, serif)";

// ── Types ─────────────────────────────────────────────────────

type Block = {
    id:             string;
    type:           "paragraph" | "pullquote" | "image" | "divider";
    content?:       string;
    imageUrl?:      string;
    imagePosition?: "fw" | "fl" | "fr";
    caption?:       string;
    position:       number;
};

type Article = {
    id:                   string;
    slug:                 string;
    title:                string;
    subtitle:             string | null;
    hookPhrase:           string | null;
    coverImage:           string | null;
    authorName:           string;
    authorBio:            string | null;
    authorSocialPlatform: string | null;
    authorSocialUrl:      string | null;
    template:             string;
    accentColor:          string;
    darkColColor:         string;
    blocks:               Block[];
    publishedAt:          Date | null;
};

type AdjacentArticle = { slug: string; title: string } | null;

const TEMPLATE_LABELS: Record<string, string> = {
    cover_person:   "Personaje",
    full_article:   "Artículo",
    profile_simple: "Perfil",
    news_short:     "Noticia",
};

// ── Progress bar ──────────────────────────────────────────────

function ProgressBar({ accent }: { accent: string }) {
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        const fn = () => {
            const total = document.documentElement.scrollHeight - window.innerHeight;
            const p = total > 0 ? (window.scrollY / total) * 100 : 0;
            setProgress(Math.min(100, Math.max(0, p)));
        };
        window.addEventListener("scroll", fn, { passive: true });
        fn();
        return () => window.removeEventListener("scroll", fn);
    }, []);
    return (
        <div className="fixed top-0 left-0 right-0 h-[3px] bg-[#e2ddd8] z-50">
            <div className="h-full transition-[width] duration-75 ease-linear" style={{ width: `${progress}%`, background: accent }} />
        </div>
    );
}

// ── Image overlay ─────────────────────────────────────────────

function ImageOverlay({ images, currentIdx, onClose, onNav }: {
    images: { url: string; caption?: string }[];
    currentIdx: number;
    onClose: () => void;
    onNav: (d: number) => void;
}) {
    useEffect(() => {
        const fn = (e: KeyboardEvent) => {
            if (e.key === "Escape")     onClose();
            if (e.key === "ArrowLeft")  onNav(-1);
            if (e.key === "ArrowRight") onNav(1);
        };
        window.addEventListener("keydown", fn);
        return () => window.removeEventListener("keydown", fn);
    }, [onClose, onNav]);

    const img = images[currentIdx];
    if (!img) return null;

    return (
        <div className="fixed inset-0 bg-black/92 z-[500] flex flex-col items-center justify-center gap-4" onClick={onClose}>
            <button className="absolute top-5 right-6 text-white/50 hover:text-white tracking-widest uppercase text-[11px]"
                style={{ fontFamily: MONO }} onClick={onClose}>
                ESC · Cerrar
            </button>
            <div className="relative max-w-3xl w-full max-h-[70vh] aspect-video" onClick={e => e.stopPropagation()}>
                <Image src={img.url} alt={img.caption ?? ""} fill className="object-contain" sizes="900px" />
            </div>
            {img.caption && (
                <p className="text-[11px] text-white/50 tracking-wide" style={{ fontFamily: MONO }}>{img.caption}</p>
            )}
            <div className="flex items-center gap-4" onClick={e => e.stopPropagation()}>
                <button disabled={currentIdx === 0} onClick={() => onNav(-1)}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-10 text-white text-xl flex items-center justify-center transition-colors">‹</button>
                <span className="text-[11px] text-white/40" style={{ fontFamily: MONO }}>{currentIdx + 1} / {images.length}</span>
                <button disabled={currentIdx === images.length - 1} onClick={() => onNav(1)}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-10 text-white text-xl flex items-center justify-center transition-colors">›</button>
            </div>
        </div>
    );
}

// ── Block renderer ────────────────────────────────────────────

function BlockRenderer({ block, accent, paragraphFocused, onImageClick }: {
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
                className={["py-3 px-5 my-5 text-xl italic text-[#12110f] leading-snug border-l-[3px] break-inside-avoid transition-all duration-200", dimCls].join(" ")}
                style={{ borderLeftColor: accent, fontFamily: SERIF }}>
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
        const aspectCls = isFloat ? "aspect-[4/3]" : "aspect-video";
        const dimCls = paragraphFocused === false ? "opacity-40" : "";

        return (
            <div className={[floatCls, "break-inside-avoid transition-opacity duration-200", dimCls].join(" ")}>
                <div className={["relative overflow-hidden border border-[#e2ddd8] cursor-pointer group rounded-lg", aspectCls].join(" ")}
                    onClick={() => onImageClick(block.imageUrl!)}>
                    <Image src={block.imageUrl} alt={block.caption ?? ""} fill
                        className="object-cover transition-[filter] group-hover:brightness-90" sizes="600px" />
                    <div className="absolute bottom-1.5 right-2 text-sm text-black/40">⊕</div>
                </div>
                {block.caption && (
                    <p className="text-[10px] text-[#8a8682] mt-1.5 leading-relaxed" style={{ fontFamily: MONO }}>{block.caption}</p>
                )}
            </div>
        );
    }

    return null;
}

// ── Main reader ───────────────────────────────────────────────

export function ArticleReader({ article, viewCount, prev, next, articleId }: {
    article:   Article;
    viewCount: number;
    prev:      AdjacentArticle;
    next:      AdjacentArticle;
    articleId: string;
}) {
    const router = useRouter();
    const endRef = useRef<HTMLDivElement>(null);
    const viewRecorded = useRef(false);
    const normalizedPlatform = normalizeSocialPlatform(article.authorSocialPlatform);


    const blocks = (Array.isArray(article.blocks) ? article.blocks as Block[] : [])
        .sort((a, b) => a.position - b.position);

    const paragraphBlocks = blocks.filter(b => b.type === "paragraph");
    const imageBlocks     = blocks.filter(b => b.type === "image" && b.imageUrl)
        .map(b => ({ url: b.imageUrl!, caption: b.caption }));

    const [focusMode,  setFocusMode]  = useState(false);
    const [focusIdx,   setFocusIdx]   = useState(0);
    const [imgOverlay, setImgOverlay] = useState(false);
    const [imgIdx,     setImgIdx]     = useState(0);
    const [viewDone,   setViewDone]   = useState(false);

    const accent = article.accentColor || "#e8622a";

    // ── Register view when user reaches the end ───────────────
    useEffect(() => {
        const sentinel = endRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !viewRecorded.current) {
                    viewRecorded.current = true;
                    setViewDone(true);
                    // Call API to register view
                    fetch(`/api/blog/views`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ articleId }),
                    }).catch(() => {});
                }
            },
            { threshold: 0.5 }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [articleId]);

    // ── Keyboard shortcuts ────────────────────────────────────
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (imgOverlay) return;
            if (e.key === "f" || e.key === "F") { setFocusMode(v => !v); return; }
            if (e.key === "Escape" && focusMode) { setFocusMode(false); return; }
            if (focusMode) {
                if (e.key === "ArrowDown") { e.preventDefault(); setFocusIdx(i => Math.min(i + 1, paragraphBlocks.length - 1)); }
                if (e.key === "ArrowUp")   { e.preventDefault(); setFocusIdx(i => Math.max(i - 1, 0)); }
            } else {
                if (e.key === "ArrowLeft"  && prev) router.push(`/blog/${prev.slug}`);
                if (e.key === "ArrowRight" && next) router.push(`/blog/${next.slug}`);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [focusMode, imgOverlay, prev, next, paragraphBlocks.length, router]);

    // Scroll focused paragraph into view
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

    return (
        <div id="reader-scroll" className="min-h-full" style={{ background: "#fafaf8" }}>
            <ProgressBar accent={accent} />

            {/* ── Editorial top bar ── */}
            <div className="sticky top-0 z-40 flex items-center justify-between px-8 py-3 border-b border-[#e2ddd8]"
                style={{ background: "rgba(250,250,248,0.92)", backdropFilter: "blur(8px)" }}>

                {/* Breadcrumb / back navigation */}
                <Link href="/blog"
                    className="flex items-center gap-2 group"
                    style={{ fontFamily: MONO }}>
                    {/* Mini accent dot */}
                    <div className="w-5 h-5 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
                        style={{ background: accent }}>
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M19 12H5M12 5l-7 7 7 7"/>
                        </svg>
                    </div>
                    <span className="text-[10px] tracking-[0.2em] uppercase text-[#8a8682] group-hover:text-[#12110f] transition-colors">
                        Blog
                    </span>
                    <span className="text-[#e2ddd8] text-[10px]">›</span>
                    <span className="text-[10px] text-[#12110f] truncate max-w-[280px]">{article.title}</span>
                </Link>

                {/* Focus controls — right side */}
                <div className="flex items-center gap-2">
                    <button onClick={() => setFocusMode(v => !v)}
                        className={["flex items-center gap-1.5 px-3 py-1 text-[10px] tracking-wide uppercase rounded-full border transition-all",
                            focusMode
                                ? "bg-[#12110f] border-[#12110f] text-white"
                                : "bg-white border-[#e2ddd8] text-[#8a8682] hover:border-[#12110f] hover:text-[#12110f]"
                        ].join(" ")}
                        style={{ fontFamily: MONO }}>
                        ◉ Foco
                    </button>
                    {focusMode && (
                        <button onClick={() => setFocusMode(false)}
                            className="flex items-center gap-1 px-3 py-1 text-[10px] tracking-wide uppercase rounded-full bg-red-600 border border-red-600 text-white"
                            style={{ fontFamily: MONO }}>
                            ✕ Salir
                        </button>
                    )}
                </div>
            </div>

            {/* Image overlay */}
            {imgOverlay && imageBlocks.length > 0 && (
                <ImageOverlay images={imageBlocks} currentIdx={imgIdx}
                    onClose={() => setImgOverlay(false)} onNav={navImg} />
            )}

            {/* Article content */}
            <div className="max-w-[800px] mx-auto px-10 pt-10 pb-24">

                {/* Kicker */}
                <div className="text-[10px] tracking-[0.35em] uppercase mb-3"
                    style={{ color: accent, fontFamily: MONO }}>
                    {TEMPLATE_LABELS[article.template] ?? article.template}
                </div>

                {/* Title */}
                <h1 className="text-[52px] font-black leading-[0.92] tracking-[-2px] mb-4 text-[#12110f]"
                    style={{ fontFamily: SERIF }}>
                    {article.title}
                </h1>

                {/* Subtitle */}
                {article.subtitle && (
                    <p className="text-lg italic text-[#8a8682] leading-relaxed mb-7 max-w-[580px]"
                        style={{ fontFamily: SERIF }}>
                        {article.subtitle}
                    </p>
                )}

                {/* Hook phrase */}
                {article.hookPhrase && (
                    <div className="flex items-start gap-3 mb-7 pl-4 border-l-2"
                        style={{ borderColor: accent }}>
                        <p className="text-[17px] font-semibold italic leading-snug text-[#12110f]"
                            style={{ fontFamily: SERIF }}>
                            &ldquo;{article.hookPhrase}&rdquo;
                        </p>
                    </div>
                )}

                {/* Byline */}
                <div className="flex items-start gap-3 py-4 border-t border-b border-[#e2ddd8] mb-9">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ background: accent }}>
                        {article.authorName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span className="text-[13px] font-semibold text-[#12110f]">{article.authorName}</span>
                        {normalizedPlatform && article.authorSocialUrl && (
                            <span
                                className="flex items-center gap-1.5 text-[11px] text-[#8a8682] w-fit"
                                style={{ fontFamily: MONO }}>
                                
                                <SocialIcon platform={normalizedPlatform} />
                                
                                <span className="truncate">{article.authorSocialUrl}</span>
                            </span>
                        )}                       
                        {article.authorBio && (
                            <span className="text-[11px] text-[#8a8682] leading-relaxed mt-0.5">{article.authorBio}</span>
                        )}
                    </div>
                    <div className="text-right flex-shrink-0">
                        <div className="text-[11px] text-[#8a8682]" style={{ fontFamily: MONO }}>
                            {article.publishedAt
                                ? new Date(article.publishedAt).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
                                : ""}
                        </div>
                        <div className={["flex items-center justify-end gap-1 text-[10px] mt-1 transition-colors",
                            viewDone ? "text-[#e8622a]" : "text-[#8a8682]"].join(" ")}
                            style={{ fontFamily: MONO }}>
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                            </svg>
                            {(viewCount + (viewDone ? 1 : 0)).toLocaleString("es-CO")} vistas
                        </div>
                    </div>
                </div>

                {/* Cover */}
                {article.coverImage && (
                    <div className="relative w-full aspect-[21/8] bg-[#12110f] mb-10 overflow-hidden rounded-xl">
                        <Image src={article.coverImage} alt={article.title} fill className="object-cover opacity-85" sizes="800px" />
                    </div>
                )}

                {/* Blocks — 2 columns */}
                <div style={{ columnCount: 2, columnGap: "40px", columnRule: "1px solid #e2ddd8" }}>
                    {blocks.map(block => (
                        <BlockRenderer
                            key={block.id}
                            block={block}
                            accent={accent}
                            paragraphFocused={getParagraphFocused(block)}
                            onImageClick={openImg}
                        />
                    ))}
                    <div style={{ clear: "both" }} />
                </div>

                {/* End sentinel — IntersectionObserver registra la vista aquí */}
                <div ref={endRef} className="h-1 w-full" aria-hidden />

                {/* View registered confirmation */}


                {/* Prev / Next */}
                <div className="flex gap-4 mt-10 pt-7 border-t border-[#e2ddd8]">
                    {prev ? (
                        <Link href={`/blog/${prev.slug}`}
                            className="flex-1 p-4 bg-white border border-[#e2ddd8] hover:border-[#12110f] hover:shadow-[2px_2px_0_#12110f] transition-all rounded-xl flex flex-col gap-1.5">
                            <span className="text-[9px] tracking-[0.2em] uppercase text-[#8a8682]" style={{ fontFamily: MONO }}>← Anterior</span>
                            <span className="text-[14px] font-bold text-[#12110f] leading-snug" style={{ fontFamily: SERIF }}>{prev.title}</span>
                        </Link>
                    ) : <div className="flex-1" />}

                    <div className="flex items-center">
                        <Link href="/blog" className="text-[11px] text-[#8a8682] hover:text-[#12110f] transition-colors px-2" style={{ fontFamily: MONO }}>
                            Ver todos
                        </Link>
                    </div>

                    {next ? (
                        <Link href={`/blog/${next.slug}`}
                            className="flex-1 p-4 bg-white border border-[#e2ddd8] hover:border-[#12110f] hover:shadow-[2px_2px_0_#12110f] transition-all rounded-xl flex flex-col gap-1.5 text-right">
                            <span className="text-[9px] tracking-[0.2em] uppercase text-[#8a8682]" style={{ fontFamily: MONO }}>Siguiente →</span>
                            <span className="text-[14px] font-bold text-[#12110f] leading-snug" style={{ fontFamily: SERIF }}>{next.title}</span>
                        </Link>
                    ) : <div className="flex-1" />}
                </div>
            </div>

            {/* Keyboard shortcuts bar */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#12110f] border border-[#2a2a2a] px-4 py-1.5 rounded-full z-40 whitespace-nowrap select-none text-[10px] text-white/40 tracking-wide"
                style={{ fontFamily: MONO }}>
                <kbd className="bg-[#2a2a2a] border border-[#3a3a3a] px-1.5 py-0.5 rounded text-[11px] text-white/70">↑</kbd>
                <kbd className="bg-[#2a2a2a] border border-[#3a3a3a] px-1.5 py-0.5 rounded text-[11px] text-white/70">↓</kbd>
                párrafos
                <span className="w-px h-3 bg-[#2a2a2a]" />
                <kbd className="bg-[#2a2a2a] border border-[#3a3a3a] px-1.5 py-0.5 rounded text-[11px] text-white/70">←</kbd>
                <kbd className="bg-[#2a2a2a] border border-[#3a3a3a] px-1.5 py-0.5 rounded text-[11px] text-white/70">→</kbd>
                artículos
                <span className="w-px h-3 bg-[#2a2a2a]" />
                <kbd className="bg-[#2a2a2a] border border-[#3a3a3a] px-1.5 py-0.5 rounded text-[11px] text-white/70">F</kbd>
                foco
                <span className="w-px h-3 bg-[#2a2a2a]" />
                <kbd className="bg-[#2a2a2a] border border-[#3a3a3a] px-1.5 py-0.5 rounded text-[11px] text-white/70">Esc</kbd>
                salir
            </div>
        </div>
    );
}
