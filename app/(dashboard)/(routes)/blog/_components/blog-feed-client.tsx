"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const TEMPLATE_LABELS: Record<string, string> = {
    cover_person:   "Personaje",
    full_article:   "Artículo",
    profile_simple: "Perfil",
    news_short:     "Noticia",
};

const MONO = "var(--font-mono, 'IBM Plex Mono', monospace)";
const SERIF = "var(--font-serif, 'Playfair Display', Georgia, serif)";

function initials(name: string) {
    return name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
}

function fmt(d: Date | string, opts: Intl.DateTimeFormatOptions) {
    return new Date(d).toLocaleDateString("es-CO", opts);
}

// ── View badge ────────────────────────────────────────────────

function ViewBadge({ count }: { count: number }) {
    return (
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[9px] tracking-wide px-2 py-0.5 rounded-full z-10"
            style={{ fontFamily: MONO }}>
            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            {count.toLocaleString("es-CO")}
        </div>
    );
}

// ── Card thumb ────────────────────────────────────────────────

function CardThumb({ article, featured = false }: { article: any; featured?: boolean }) {
    return (
        <div className={[
            "relative overflow-hidden bg-[#12110f]",
            featured ? "h-[340px]" : "aspect-video",
        ].join(" ")}>
            {article.coverImage
                ? <Image src={article.coverImage} alt={article.title} fill className="object-cover opacity-85" sizes="700px" />
                : <div className="absolute inset-0 flex items-center justify-center px-5">
                    <span className="text-4xl font-black text-white/[0.07] tracking-tight leading-none text-center"
                        style={{ fontFamily: SERIF }}>
                        {article.title.split(" ").slice(0, 3).join(" ")}
                    </span>
                  </div>
            }
            <ViewBadge count={article._count.views} />
        </div>
    );
}

// ── Featured card (2×2) ───────────────────────────────────────

function FeaturedCard({ article }: { article: any }) {
    return (
        <Link href={`/blog/${article.slug}`}
            className="group col-span-2 row-span-2 bg-white overflow-hidden flex flex-col transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#12110f] rounded-2xl border border-[#e2ddd8]">
            <CardThumb article={article} featured />
            <div className="p-5 pb-3 flex-1">
                <div className="text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: article.accentColor, fontFamily: MONO }}>
                    {TEMPLATE_LABELS[article.template] ?? article.template}
                    {article.publishedAt ? ` · ${fmt(article.publishedAt, { day: "numeric", month: "short", year: "numeric" })}` : ""}
                </div>
                <h3 className="text-[22px] font-black leading-tight text-[#12110f] mb-2 group-hover:opacity-70 transition-opacity"
                    style={{ fontFamily: SERIF }}>
                    {article.title}
                </h3>
                {article.subtitle && (
                    <p className="text-[12px] text-[#8a8682] leading-relaxed line-clamp-2">{article.subtitle}</p>
                )}
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#e2ddd8]">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                        style={{ background: article.accentColor }}>
                        {initials(article.authorName)}
                    </div>
                    <span className="text-[11px] text-[#8a8682]">{article.authorName}</span>
                </div>
                <span className="text-[10px] text-[#8a8682]" style={{ fontFamily: MONO }}>
                    {article.publishedAt ? fmt(article.publishedAt, { day: "numeric", month: "short" }) : ""}
                </span>
            </div>
        </Link>
    );
}

// ── Small card ────────────────────────────────────────────────

function SmallCard({ article }: { article: any }) {
    return (
        <Link href={`/blog/${article.slug}`}
            className="group bg-white overflow-hidden flex flex-col transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#12110f] rounded-xl border border-[#e2ddd8]">
            <CardThumb article={article} />
            <div className="px-4 pt-3 pb-1 flex-1">
                <div className="text-[9px] tracking-[0.18em] uppercase mb-1" style={{ color: article.accentColor, fontFamily: MONO }}>
                    {TEMPLATE_LABELS[article.template] ?? article.template}
                </div>
                <h3 className="text-[14px] font-bold leading-snug text-[#12110f] mb-1.5 group-hover:opacity-70 transition-opacity line-clamp-2"
                    style={{ fontFamily: SERIF }}>
                    {article.title}
                </h3>
                {article.subtitle && (
                    <p className="text-[11px] text-[#8a8682] leading-relaxed line-clamp-2">{article.subtitle}</p>
                )}
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#e2ddd8] mt-auto">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
                        style={{ background: article.accentColor }}>
                        {initials(article.authorName)}
                    </div>
                    <span className="text-[10px] text-[#8a8682]">{article.authorName}</span>
                </div>
                <span className="text-[10px] text-[#8a8682]" style={{ fontFamily: MONO }}>
                    {article.publishedAt ? fmt(article.publishedAt, { day: "numeric", month: "short" }) : ""}
                </span>
            </div>
        </Link>
    );
}

// ── Text card ─────────────────────────────────────────────────

function TextCard({ article }: { article: any }) {
    return (
        <Link href={`/blog/${article.slug}`}
            className="group bg-white overflow-hidden flex flex-col transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#12110f] rounded-xl border border-[#e2ddd8]">
            <div className="px-4 py-4 flex-1">
                <div className="text-[9px] tracking-[0.18em] uppercase mb-1.5" style={{ color: article.accentColor, fontFamily: MONO }}>
                    {TEMPLATE_LABELS[article.template] ?? article.template}
                    {article.publishedAt ? ` · ${fmt(article.publishedAt, { month: "short", year: "numeric" })}` : ""}
                </div>
                <h3 className="text-[14px] font-bold leading-snug text-[#12110f] group-hover:opacity-70 transition-opacity"
                    style={{ fontFamily: SERIF }}>
                    {article.title}
                </h3>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#e2ddd8]">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                        style={{ background: article.accentColor }}>
                        {initials(article.authorName)}
                    </div>
                    <span className="text-[10px] text-[#8a8682]">{article.authorName}</span>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-[#8a8682]" style={{ fontFamily: MONO }}>
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                    {article._count.views.toLocaleString("es-CO")}
                </div>
            </div>
        </Link>
    );
}

// ── Year block ────────────────────────────────────────────────

function YearBlock({ year, articles }: { year: string; articles: any[] }) {
    const [featured, ...rest] = articles;
    const smallCards = rest.slice(0, 4);

    return (
        <div className="mb-16">
            {/* Year header */}
            <div className="flex items-center gap-4 mb-6">
                <span className="text-[11px] tracking-[0.35em] uppercase text-[#8a8682]" style={{ fontFamily: MONO }}>
                    {year}
                </span>
                <div className="flex-1 h-px bg-[#e2ddd8]" />
                <span className="text-[10px] text-[#8a8682] bg-[#f0ede8] px-2.5 py-0.5 rounded-full" style={{ fontFamily: MONO }}>
                    {articles.length} artículo{articles.length !== 1 ? "s" : ""}
                </span>
            </div>

            {/* Bento grid */}
            <div className="grid grid-cols-3 gap-4">
                {featured && <FeaturedCard article={featured} />}
                {smallCards.map((a: any) =>
                    a.coverImage
                        ? <SmallCard key={a.id} article={a} />
                        : <TextCard  key={a.id} article={a} />
                )}
            </div>
        </div>
    );
}

// ── Editorial hero header ─────────────────────────────────────

function EditorialHero({ totalArticles }: { totalArticles: number }) {
    return (
        <div className="relative overflow-hidden mb-0" style={{ background: "#12110f" }}>
            {/* Noise texture */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

            {/* Accent line at bottom */}
        </div>
    );
}

// ── Main export ───────────────────────────────────────────────

export function BlogFeedClient({ years, byYear }: { years: string[]; byYear: Record<string, any[]> }) {
    const [activeYear, setActiveYear] = useState<string>("all");
    const visible = activeYear === "all" ? years : years.filter(y => y === activeYear);
    const totalArticles = Object.values(byYear).flat().length;

    return (
        <>
            {/* Editorial hero */}
            <EditorialHero totalArticles={totalArticles} />

            {/* Content area */}
            <div className="max-w-[1080px] mx-auto px-9 pt-8 pb-20">

                {/* Year filter pills */}
                <div className="flex items-center gap-2 mb-10 flex-wrap">
                    {["all", ...years].map(y => (
                        <button key={y}
                            onClick={() => setActiveYear(y)}
                            className={[
                                "px-4 py-1.5 text-[11px] tracking-[0.1em] border rounded-full transition-all duration-150",
                                y === "all" ? "border-dashed" : "",
                                activeYear === y
                                    ? "bg-[#12110f] text-white border-[#12110f]"
                                    : "bg-white text-[#8a8682] border-[#e2ddd8] hover:border-[#12110f] hover:text-[#12110f]"
                            ].join(" ")}
                            style={{ fontFamily: MONO }}>
                            {y === "all" ? "Todos" : y}
                        </button>
                    ))}
                </div>

                {/* Year blocks */}
                {visible.map(y => (
                    <YearBlock key={y} year={y} articles={byYear[y]} />
                ))}
            </div>
        </>
    );
}