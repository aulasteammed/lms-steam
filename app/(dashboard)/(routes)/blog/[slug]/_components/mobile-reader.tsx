"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const MONO  = "var(--font-mono, 'IBM Plex Mono', monospace)";
const SERIF = "var(--font-serif, 'Playfair Display', Georgia, serif)";

const TEMPLATE_LABELS: Record<string, string> = {
    cover_person:   "Personaje",
    full_article:   "Artículo",
    profile_simple: "Perfil",
    news_short:     "Noticia",
};

const BLOCKS_PER_PAGE = 4;

type Block = {
    id:             string;
    type:           "paragraph" | "pullquote" | "image" | "divider" | "list";
    content?:       string;
    imageUrl?:      string;
    imagePosition?: "fw" | "fl" | "fr";
    caption?:       string;
    items?:         string[];
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
    authorPhoto:          string | null;
    authorSocialPlatform: string | null;
    authorSocialUrl:      string | null;
    template:             string;
    accentColor:          string;
    darkColColor:         string;
    blocks:               Block[];
    publishedAt:          Date | null;
};

type AdjacentArticle = { slug: string; title: string } | null;

// ── Block renderer (mobile) ───────────────────────────────────

function MobileBlock({ block, accent }: { block: Block; accent: string }) {
    if (block.type === "paragraph") {
        return (
            <p className="text-[13px] leading-[1.75] text-[#12110f] mb-3">
                {block.content}
            </p>
        );
    }
    if (block.type === "pullquote") {
        return (
            <blockquote
                className="border-l-2 pl-3 py-1 my-3 text-[14px] font-semibold italic leading-snug text-[#12110f]"
                style={{ borderColor: accent, fontFamily: SERIF }}>
                {block.content}
            </blockquote>
        );
    }
    if (block.type === "list" && block.items?.length) {
        return (
            <ul className="my-3 flex flex-col gap-1.5">
                {block.items.filter(Boolean).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] leading-snug text-gray-700"> 
                        <span 
                            className="mt-0.5 text-[10px] flex-shrink-0" 
                            style={{ color: accent }}
                        >
                            ●
                        </span>
                        
                        <span className="text-gray-900">
                            {item}
                        </span>
                    </li>
                ))}
            </ul>
        );
    }
    if (block.type === "image" && block.imageUrl) {
        return (
            <div className="my-3 rounded-lg overflow-hidden border border-[#e2ddd8]">
                <div className="relative w-full aspect-[3/2]">
                    <Image src={block.imageUrl} alt={block.caption ?? ""} fill className="object-cover" sizes="400px" />
                </div>
                {block.caption && (
                    <p className="text-[10px] text-[#8a8682] px-2 py-1.5" style={{ fontFamily: MONO }}>
                        {block.caption}
                    </p>
                )}
            </div>
        );
    }
    if (block.type === "divider") {
        return <hr className="border-t border-dashed border-[#e2ddd8] my-3" />;
    }
    return null;
}

// ── Cover slide ───────────────────────────────────────────────

function CoverSlide({ article, accent, totalPages }: {
    article:    Article;
    accent:     string;
    totalPages: number;
}) {
    const dark     = article.darkColColor || "#12110f";
    const initials = article.authorName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    const label    = TEMPLATE_LABELS[article.template] ?? article.template;
    const date     = article.publishedAt
        ? new Date(article.publishedAt).toLocaleDateString("es-CO", { day: "numeric", month: "short" })
        : "";

    return (
        <div className="relative w-full h-full flex flex-col" style={{ background: dark }}>
            {/* Cover image */}
            {article.coverImage ? (
                <div className="relative w-full flex-1 min-h-0">
                    <Image src={article.coverImage} alt={article.title} fill
                        className="object-cover opacity-60" sizes="400px" priority />
                    {/* gradient overlay */}
                    <div className="absolute inset-0"
                        style={{ background: `linear-gradient(to bottom, transparent 30%, ${dark} 85%)` }} />
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center" style={{ background: dark }}>
                    <span className="text-[64px] font-black opacity-[0.06] leading-none text-center text-white"
                        style={{ fontFamily: SERIF }}>
                        {article.title.split(" ").slice(0, 2).join("\n")}
                    </span>
                </div>
            )}

            {/* Content overlaid at bottom */}
            <div className="px-5 pb-6 pt-3 flex flex-col gap-2.5">
                <span className="text-[9px] tracking-[0.28em] uppercase font-medium"
                    style={{ color: accent, fontFamily: MONO }}>
                    {label}
                </span>
                <h1 className="text-[28px] font-black leading-[0.95] tracking-tight text-white"
                    style={{ fontFamily: SERIF }}>
                    {article.title}
                </h1>
                {article.subtitle && (
                    <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2">
                        {article.subtitle}
                    </p>
                )}
                {article.hookPhrase && (
                    <p className="text-[11px] italic text-white/70 leading-snug"
                        style={{ fontFamily: SERIF }}>
                        &ldquo;{article.hookPhrase}&rdquo;
                    </p>
                )}

                {/* Byline */}
                <div className="flex items-center gap-2 pt-2.5 border-t border-white/10 mt-1">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0 overflow-hidden"
                        style={{ background: accent }}>
                        {article.authorPhoto
                            ? <Image src={article.authorPhoto} alt={article.authorName} width={24} height={24} className="object-cover w-full h-full" />
                            : initials
                        }
                    </div>
                    <span className="text-[11px] text-white/70">{article.authorName}</span>
                    <span className="ml-auto text-[10px] text-white/25" style={{ fontFamily: MONO }}>{date}</span>
                </div>

                <div className="text-[9px] text-white/90 text-center mt-0.5" style={{ fontFamily: MONO }}>
                    {totalPages} {totalPages === 1 ? "página" : "páginas"} · desliza →
                </div>
            </div>
        </div>
    );
}

// ── Content slide ─────────────────────────────────────────────

function ContentSlide({ blocks, pageNum, totalPages, accent, articleTitle }: {
    blocks:       Block[];
    pageNum:      number;
    totalPages:   number;
    accent:       string;
    articleTitle: string;
}) {
    return (
        <div className="w-full h-full flex flex-col" style={{ background: "#fafaf8" }}>
            {/* Mini header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#e2ddd8] flex-shrink-0">
                <span className="text-[9px] text-[#8a8682] truncate max-w-[180px]" style={{ fontFamily: MONO }}>
                    {articleTitle}
                </span>
                <span className="text-[9px] text-[#8a8682] flex-shrink-0 ml-2" style={{ fontFamily: MONO }}>
                    {pageNum}/{totalPages}
                </span>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
                {blocks.map(block => (
                    <MobileBlock key={block.id} block={block} accent={accent} />
                ))}
            </div>
        </div>
    );
}

// ── End slide ─────────────────────────────────────────────────

function EndSlide({ article, accent, next, viewCount }: {
    article:    Article;
    accent:     string;
    next:       AdjacentArticle;
    viewCount:  number;
}) {
    const dark = article.darkColColor || "#12110f";
    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4 px-5"
            style={{ background: dark }}>
            <div className="text-[32px] opacity-20">✦</div>
            <div className="text-center">
                <h3 className="text-[18px] font-black text-white leading-tight mb-1"
                    style={{ fontFamily: SERIF }}>
                    Fin del artículo
                </h3>
                <p className="text-[10px] text-white/30" style={{ fontFamily: MONO }}>
                    {article.authorName}
                </p>
            </div>

            {/* Views */}
            <div className="flex items-center gap-1.5 text-[10px] text-white/30" style={{ fontFamily: MONO }}>
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                {viewCount.toLocaleString("es-CO")} vistas
            </div>

            {/* Next article */}
            {next && (
                <Link href={`/blog/${next.slug}`}
                    className="w-full border-l-2 px-4 py-3 mt-1 block"
                    style={{ borderColor: accent, background: "rgba(255,255,255,0.04)" }}>
                    <div className="text-[9px] tracking-[0.2em] uppercase mb-1.5"
                        style={{ color: accent, fontFamily: MONO }}>
                        Siguiente
                    </div>
                    <div className="text-[14px] font-bold text-white leading-snug"
                        style={{ fontFamily: SERIF }}>
                        {next.title}
                    </div>
                </Link>
            )}

            {/* Back to feed */}
            <Link href="/blog"
                className="text-[10px] text-white/25 hover:text-white/50 transition-colors mt-1"
                style={{ fontFamily: MONO }}>
                ← Ver todos los artículos
            </Link>
        </div>
    );
}

// ── Main export ───────────────────────────────────────────────

export function MobileReader({ article, viewCount, articleId, articleSlug, prev, next }: {
    article:     Article;
    viewCount:   number;
    articleId:   string;
    articleSlug: string;
    prev:      AdjacentArticle;
    next:      AdjacentArticle;
}) {
    const accent = article.accentColor || "#e8622a";

    // Sort and chunk blocks into pages
    const blocks = (Array.isArray(article.blocks) ? article.blocks as Block[] : [])
        .sort((a, b) => a.position - b.position)
        .filter(b => b.type !== "divider" || true); // keep all

    // Split into pages of BLOCKS_PER_PAGE
    const pages: Block[][] = [];
    for (let i = 0; i < blocks.length; i += BLOCKS_PER_PAGE) {
        pages.push(blocks.slice(i, i + BLOCKS_PER_PAGE));
    }
    // If no blocks, still show cover + end
    if (pages.length === 0) pages.push([]);

    // Slides: [cover, ...content pages, end]
    const totalSlides  = 1 + pages.length + 1;
    const lastSlide    = totalSlides - 1;

    const [slide, setSlide] = useState(0);
    const viewRecorded = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Register view when reaching end slide
    useEffect(() => {
        if (slide === lastSlide && !viewRecorded.current) {
            viewRecorded.current = true;
            fetch(`/api/blog/articles/${articleSlug}/views`, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ articleId }),
            }).catch(() => {});
        }
    }, [slide, lastSlide, articleId]);

    // Touch swipe
    const touchStart = useRef<number | null>(null);
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStart.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStart.current === null) return;
        const delta = touchStart.current - e.changedTouches[0].clientX;
        if (Math.abs(delta) > 40) {
            if (delta > 0 && slide < lastSlide) setSlide(s => s + 1);
            if (delta < 0 && slide > 0)         setSlide(s => s - 1);
        }
        touchStart.current = null;
    };

    const goSlide = (n: number) => setSlide(Math.max(0, Math.min(lastSlide, n)));

    return (
        <div ref={containerRef}
            className="relative w-full h-screen overflow-hidden flex flex-col"
            style={{ background: "#0d0f10" }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}>

            {/* Slides track */}
            <div className="flex-1 min-h-0 relative overflow-hidden">
                <div
                    className="flex h-full"
                    style={{
                        width:     `${totalSlides * 100}%`,
                        transform: `translateX(-${(slide / totalSlides) * 100}%)`,
                        transition: "transform 0.38s cubic-bezier(0.77,0,0.18,1)",
                    }}>

                    {/* Slide 0 — Cover */}
                    <div className="h-full flex-shrink-0" style={{ width: `${100 / totalSlides}%` }}>
                        <CoverSlide article={article} accent={accent} totalPages={pages.length} />
                    </div>

                    {/* Slides 1..N — Content pages */}
                    {pages.map((pageBlocks, i) => (
                        <div key={i} className="h-full flex-shrink-0" style={{ width: `${100 / totalSlides}%` }}>
                            <ContentSlide
                                blocks={pageBlocks}
                                pageNum={i + 1}
                                totalPages={pages.length}
                                accent={accent}
                                articleTitle={article.title}
                            />
                        </div>
                    ))}

                    {/* Last slide — End */}
                    <div className="h-full flex-shrink-0" style={{ width: `${100 / totalSlides}%` }}>
                        <EndSlide article={article} accent={accent} next={next} viewCount={viewCount} />
                    </div>
                </div>
            </div>

            {/* Bottom controls */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3"
                style={{ background: "#0d0f10" }}>

                {/* Prev button */}
                <button
                    onClick={() => goSlide(slide - 1)}
                    disabled={slide === 0}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-lg transition-colors disabled:opacity-10"
                    style={{ background: "rgba(255,255,255,0.1)" }}>
                    ‹
                </button>

                {/* Dots */}
                <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalSlides }).map((_, i) => (
                        <button key={i} onClick={() => goSlide(i)}
                            className="transition-all duration-200 rounded-full"
                            style={{
                                width:      i === slide ? "14px" : "5px",
                                height:     "5px",
                                background: i === slide ? accent : "rgba(255,255,255,0.18)",
                                borderRadius: "3px",
                            }} />
                    ))}
                </div>

                {/* Next button */}
                <button
                    onClick={() => goSlide(slide + 1)}
                    disabled={slide === lastSlide}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-lg transition-colors disabled:opacity-10"
                    style={{ background: "rgba(255,255,255,0.1)" }}>
                    ›
                </button>
            </div>
        </div>
    );
}