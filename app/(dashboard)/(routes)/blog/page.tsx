import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { BlogFeedClient } from "./_components/blog-feed-client";

const TEMPLATE_LABELS: Record<string, string> = {
    cover_person:   "Personaje",
    full_article:   "Artículo",
    profile_simple: "Perfil",
    news_short:     "Noticia",
};

function fmtDate(d: Date) {
    return d.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

function fmtYear(d: Date) {
    return d.getFullYear().toString();
}

// ── Types ─────────────────────────────────────────────────────
type ArticleCard = {
    id:           string;
    slug:         string;
    title:        string;
    subtitle:     string | null;
    hookPhrase:   string | null;
    coverImage:   string | null;
    authorName:   string;
    template:     string;
    accentColor:  string;
    darkColColor: string;
    publishedAt:  Date | null;
    _count:       { views: number };
};

// ── Card components ───────────────────────────────────────────

function ViewBadge({ count }: { count: number }) {
    return (
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/55 backdrop-blur-sm text-white font-mono text-[9px] tracking-wide px-2 py-0.5 rounded-full z-10">
            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            {count.toLocaleString("es-CO")}
        </div>
    );
}

function CardThumb({ article, featured = false, priority = false }: {
    article:  ArticleCard;
    featured?: boolean;
    priority?: boolean;
}) {
    return (
        <div className={["relative overflow-hidden bg-slate-900", featured ? "aspect-[4/3]" : "aspect-video"].join(" ")}>
            {article.coverImage
                ? <Image
                    src={article.coverImage}
                    alt={article.title}
                    fill
                    className="object-cover opacity-80"
                    sizes={featured
                        ? "(max-width: 768px) 100vw, 66vw"
                        : "(max-width: 768px) 100vw, 33vw"}
                    priority={priority}
                    loading={priority ? undefined : "lazy"}
                    quality={75}
                  />
                : <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-serif text-5xl font-black text-white/[0.06] tracking-tight leading-none text-center px-4">
                        {article.title.split(" ").slice(0, 2).join("\n")}
                    </span>
                  </div>
            }
            <ViewBadge count={article._count.views} />
        </div>
    );
}

function FeaturedCard({ article, priority }: { article: ArticleCard; priority?: boolean }) {
    return (
        <Link href={`/blog/${article.slug}`}
            className="group col-span-2 row-span-2 border border-[#e2ddd8] bg-white overflow-hidden block transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#12110f]">
            <CardThumb article={article} featured priority={priority} />
            <div className="p-4">
                <div className="font-mono text-[9px] tracking-[0.2em] uppercase mb-1.5" style={{ color: article.accentColor }}>
                    {TEMPLATE_LABELS[article.template]} · {article.publishedAt ? fmtDate(article.publishedAt) : ""}
                </div>
                <h3 className="font-serif text-2xl font-black leading-tight text-[#12110f] mb-2 group-hover:text-[#e8622a] transition-colors">
                    {article.title}
                </h3>
                {(article.subtitle || article.hookPhrase) && (
                <div className="space-y-1.5 mt-1.5">

                    {article.subtitle && (
                    <p className="text-[11px] text-[#8a8682] leading-relaxed line-clamp-2">
                        {article.subtitle}
                    </p>
                    )}

                    {article.hookPhrase && (
                    <p
                        className="text-[11px] italic leading-snug line-clamp-2"
                        style={{ color: article.accentColor }}
                    >
                        &ldquo;{article.hookPhrase}&rdquo;
                    </p>
                    )}

                </div>
                )}                
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#e2ddd8]">
                <span className="text-[11px] text-[#8a8682]">{article.authorName}</span>
                <span className="font-mono text-[10px] text-[#8a8682]">
                    {article.publishedAt ? article.publishedAt.toLocaleDateString("es-CO", { day: "numeric", month: "short" }) : ""}
                </span>
            </div>
        </Link>
    );
}

function SmallCard({ article }: { article: ArticleCard }) {
    return (
        <Link href={`/blog/${article.slug}`}
            className="group border border-[#e2ddd8] bg-white overflow-hidden block transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#12110f]">
            <CardThumb article={article} />
            <div className="px-4 pt-3 pb-1">
                <div className="font-mono text-[9px] tracking-[0.18em] uppercase mb-1" style={{ color: article.accentColor }}>
                    {TEMPLATE_LABELS[article.template]}
                </div>
                <h3 className="font-serif text-[15px] font-bold leading-snug text-[#12110f] mb-1.5 group-hover:text-[#e8622a] transition-colors line-clamp-2">
                    {article.title}
                </h3>
                {article.subtitle && (
                    <p className="text-[11px] text-[#8a8682] leading-relaxed line-clamp-2">{article.subtitle}</p>
                )}
                {article.hookPhrase && (
                    <p className="text-[11px] italic leading-snug mt-1.5 line-clamp-2" style={{ color: article.accentColor }}>
                        &ldquo;{article.hookPhrase}&rdquo;
                    </p>
                )}
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#e2ddd8] mt-2">
                <span className="text-[10px] text-[#8a8682]">{article.authorName}</span>
                <span className="font-mono text-[10px] text-[#8a8682]">
                    {article.publishedAt ? article.publishedAt.toLocaleDateString("es-CO", { day: "numeric", month: "short" }) : ""}
                </span>
            </div>
        </Link>
    );
}

function TextCard({ article }: { article: ArticleCard }) {
    return (
        <Link href={`/blog/${article.slug}`}
            className="group border border-[#e2ddd8] bg-white overflow-hidden block transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_#12110f]">
            <div className="px-4 py-3.5">
                <div className="font-mono text-[9px] tracking-[0.18em] uppercase mb-1.5" style={{ color: article.accentColor }}>
                    {TEMPLATE_LABELS[article.template]} · {article.publishedAt ? article.publishedAt.toLocaleDateString("es-CO", { month: "short" }) : ""}
                </div>
                <h3 className="font-serif text-[15px] font-bold leading-snug text-[#12110f] group-hover:text-[#e8622a] transition-colors">
                    {article.title}
                </h3>
                {article.hookPhrase && (
                    <p className="text-[11px] italic leading-snug mt-1.5 line-clamp-2" style={{ color: article.accentColor }}>
                        &ldquo;{article.hookPhrase}&rdquo;
                    </p>
                )}
            </div>
            <div className="flex items-center justify-between px-4 py-2 border-t border-[#e2ddd8]">
                <span className="text-[10px] text-[#8a8682]">{article.authorName}</span>
                <div className="flex items-center gap-1 text-[9px] text-[#8a8682] font-mono">
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                    {article._count.views}
                </div>
            </div>
        </Link>
    );
}

// ── Year block ────────────────────────────────────────────────

function YearBlock({ year, articles, isFirst = false }: {
    year:     string;
    articles: ArticleCard[];
    isFirst?: boolean;
}) {
    const [featured, ...rest] = articles;
    const smallCards = rest.slice(0, 4);

    return (
        <div className="mb-12">
            <div className="flex items-center gap-4 mb-5">
                <span className="font-mono text-[11px] tracking-[0.3em] uppercase text-[#8a8682]">{year}</span>
                <div className="flex-1 h-px bg-[#e2ddd8]" />
                <span className="font-mono text-[10px] text-[#8a8682] bg-[#f0ede8] px-2 py-0.5 rounded-full">
                    {articles.length} artículo{articles.length !== 1 ? "s" : ""}
                </span>
            </div>

            <div className="grid grid-cols-3 border border-[#e2ddd8]">
                {/* La featured del primer año carga con priority para LCP */}
                {featured && <FeaturedCard article={featured} priority={isFirst} />}
                {smallCards.map(a =>
                    a.coverImage
                        ? <SmallCard key={a.id} article={a} />
                        : <TextCard  key={a.id} article={a} />
                )}
            </div>
        </div>
    );
}

// ── Page ─────────────────────────────────────────────────────

export default async function BlogPage() {
    const articles = await db.article.findMany({
        where:   { status: "published" },
        orderBy: { publishedAt: "desc" },
        select: {
            id:           true,
            slug:         true,
            title:        true,
            subtitle:     true,
            hookPhrase:   true,
            coverImage:   true,
            authorName:   true,
            template:     true,
            accentColor:  true,
            darkColColor: true,
            publishedAt:  true,
            _count: { select: { views: true } },
        },
    }) as ArticleCard[];

    

    const byYear: Record<string, ArticleCard[]> = {};
    for (const a of articles) {
        if (!a.publishedAt) continue;
        const y = fmtYear(a.publishedAt);
        if (!byYear[y]) byYear[y] = [];
        byYear[y].push(a);
    }
    const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

    return (
        <div className="min-h-screen" style={{ background: "#fafaf8", fontFamily: "'IBM Plex Sans', sans-serif" }}>
            <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-9 py-8 sm:py-10 pb-16">

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6 sm:mb-8 pb-5 sm:pb-6 border-b-2 border-[#12110f]">
                    <div>
                        <h1 className="font-serif text-4xl sm:text-5xl font-black tracking-tight leading-none text-[#12110f]">
                            Publicaciones<span style={{ color: "#e8622a" }}>.</span>
                        </h1>
                        <p className="font-mono text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-[#8a8682] mt-1.5">
                            {articles.length} artículos · ordenados por fecha
                        </p>
                    </div>
                </div>

                <BlogFeedClient years={years} byYear={byYear} />
            </div>
        </div>
    );
}