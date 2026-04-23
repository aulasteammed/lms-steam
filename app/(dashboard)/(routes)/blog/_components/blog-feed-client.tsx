"use client";
import { useState, useMemo, memo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

const TEMPLATE_LABELS: Record<string, string> = {
    cover_person:   "Personaje",
    full_article:   "Artículo",
    profile_simple: "Perfil",
    news_short:     "Noticia",
};

const MONO  = "var(--font-mono, 'IBM Plex Mono', monospace)";
const SERIF = "var(--font-serif, 'Playfair Display', Georgia, serif)";

const PAGE_SIZE = 8; // 1 featured + 11 small


type BlogArticle = {
    id: string;
    slug: string;
    title: string;
    subtitle?: string | null;
    hookPhrase?: string | null;
    coverImage?: string | null;
    authorName: string;
    template: string;
    accentColor: string;
    publishedAt?: Date | null;
    _count: {
        views: number;
    };
};

function fmt(d: Date | string, opts: Intl.DateTimeFormatOptions) {
    return new Date(d).toLocaleDateString("es-CO", opts);
}


const ViewBadge = memo(function ViewBadge({
  count,
}: {
  count: number;
}) {
  return (
    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[9px] tracking-wide px-2 py-0.5 rounded-full z-10">
      <svg
        className="w-2.5 h-2.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>

      {count.toLocaleString("es-CO")}
    </div>
  );
});


const CardThumb = memo(function CardThumb({
  article,
  featured = false,
  priority = false,
}: {
  article: BlogArticle;
  featured?: boolean;
  priority?: boolean;
}) {
  return (
    <div
      className={[
        "relative overflow-hidden bg-[#12110f]",
        featured
          ? "h-[220px] sm:h-[300px] lg:h-[340px]"
          : "aspect-video",
      ].join(" ")}
    >
      {article.coverImage ? (
        <Image
          src={article.coverImage}
          alt={article.title}
          fill
          className="object-cover opacity-85"
          priority={priority}
          loading={priority ? undefined : "lazy"}
          quality={75}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center px-5">
          <span
            className="text-4xl font-black text-white/[0.07]"
            style={{ fontFamily: SERIF }}
          >
            {article.title.split(" ").slice(0,3).join(" ")}
          </span>
        </div>
      )}

      <ViewBadge count={article._count.views} />
    </div>
  );
});



const FeaturedCard = memo(function FeaturedCard({
  article,
  priority,
}: {
  article: BlogArticle;
  priority?: boolean;
}) {
    return (
        <Link href={`/blog/${article.slug}`}
            className="group col-span-1 sm:col-span-2 row-span-1 sm:row-span-2 bg-white overflow-hidden flex flex-col transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#d4d4d4] rounded-2xl border border-[#e2ddd8]">
            <CardThumb article={article} featured priority={priority} />
            <div className="p-4 sm:p-5 pb-3 flex-1">
                <div className="text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: article.accentColor, fontFamily: MONO }}>
                    {TEMPLATE_LABELS[article.template] ?? article.template}
                    {article.publishedAt ? ` · ${fmt(article.publishedAt, { day: "numeric", month: "short", year: "numeric" })}` : ""}
                </div>
                <h3 className="text-[20px] sm:text-[22px] font-black leading-tight text-[#12110f] mb-2 group-hover:opacity-70 transition-opacity"
                    style={{ fontFamily: SERIF }}>
                    {article.title}
                </h3>
                {article.subtitle && (
                    <p className="text-[12px] text-[#8a8682] leading-relaxed line-clamp-2">{article.subtitle}</p>
                )}
                {article.hookPhrase && (
                    <p className="text-[12px] italic leading-snug mt-2 line-clamp-2" style={{ color: article.accentColor }}>
                        &ldquo;{article.hookPhrase}&rdquo;
                    </p>
                )}
            </div>
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-t border-[#e2ddd8]">
                <span className="text-[11px] text-[#8a8682]">{article.authorName}</span>
                <span className="text-[10px] text-[#8a8682]" style={{ fontFamily: MONO }}>
                    {article.publishedAt ? fmt(article.publishedAt, { day: "numeric", month: "short" }) : ""}
                </span>
            </div>
        </Link>
    );
});


const SmallCard = memo(function SmallCard({
  article,
}: {
  article: BlogArticle;
}) {
  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group bg-white overflow-hidden flex flex-col transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#d4d4d4] rounded-xl border border-[#e2ddd8]"
    >
      <CardThumb article={article} />

      <div className="px-4 pt-3 pb-1 flex-1">
        <div
          className="text-[9px] tracking-[0.18em] uppercase mb-1"
          style={{
            color: article.accentColor,
            fontFamily: MONO
          }}
        >
          {TEMPLATE_LABELS[article.template] ?? article.template}
        </div>

        <h3
          className="text-[14px] sm:text-[15px] font-bold leading-snug text-[#12110f] mb-1.5 group-hover:opacity-70 transition-opacity line-clamp-2"
          style={{ fontFamily: SERIF }}
        >
          {article.title}
        </h3>

        {article.subtitle && (
          <p className="text-[11px] text-[#8a8682] leading-relaxed line-clamp-2">
            {article.subtitle}
          </p>
        )}

        {article.hookPhrase && (
          <p
            className="text-[11px] italic leading-snug mt-1.5 line-clamp-2"
            style={{ color: article.accentColor }}
          >
            &ldquo;{article.hookPhrase}&rdquo;
          </p>
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#e2ddd8] mt-auto">
        <span className="text-[10px] text-[#8a8682]">
          {article.authorName}
        </span>

        <span
          className="text-[10px] text-[#8a8682]"
          style={{ fontFamily: MONO }}
        >
          {article.publishedAt
            ? fmt(article.publishedAt, {
                day: "numeric",
                month: "short",
              })
            : ""}
        </span>
      </div>
    </Link>
  );
});



const TextCard = memo(function TextCard({
  article,
}: {
  article: BlogArticle;
}) {
    return (
        <Link href={`/blog/${article.slug}`}
            className="group bg-white overflow-hidden flex flex-col transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_#d4d4d4] rounded-xl border border-[#e2ddd8]">
            <div className="px-4 py-4 flex-1">
                <div className="text-[9px] tracking-[0.18em] uppercase mb-1.5" style={{ color: article.accentColor, fontFamily: MONO }}>
                    {TEMPLATE_LABELS[article.template] ?? article.template}
                    {article.publishedAt ? ` · ${fmt(article.publishedAt, { month: "short", year: "numeric" })}` : ""}
                </div>
                <h3 className="text-[14px] sm:text-[15px] font-bold leading-snug text-[#12110f] group-hover:opacity-70 transition-opacity"
                    style={{ fontFamily: SERIF }}>
                    {article.title}
                </h3>
                {article.hookPhrase && (
                    <p className="text-[11px] italic leading-snug mt-1.5 line-clamp-2" style={{ color: article.accentColor }}>
                        &ldquo;{article.hookPhrase}&rdquo;
                    </p>
                )}
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#e2ddd8]">
                <span className="text-[10px] text-[#8a8682]">{article.authorName}</span>
                <div className="flex items-center gap-1 text-[9px] text-[#8a8682]" style={{ fontFamily: MONO }}>
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                    {article._count.views.toLocaleString("es-CO")}
                </div>
            </div>
        </Link>
    );
});

//Pagination controls 

const Pagination = memo(function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

   const visiblePages = useMemo(() => {
    const pages: (number | string)[] = [];

    // Si hay pocas páginas, mostramos todas
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }

      return pages;
    }

    // Inicio
    if (page <= 2) {
      pages.push(1, 2, 3, "...", totalPages);
      return pages;
    }

    // Final
    if (page >= totalPages - 1) {
      pages.push(
        1,
        "...",
        totalPages - 2,
        totalPages - 1,
        totalPages
      );

      return pages;
    }

    // Medio
    pages.push(
      1,
      "...",
      page - 1,
      page,
      page + 1,
      "...",
      totalPages
    );

    return pages;

  }, [page, totalPages]);

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 mt-8">

      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-1.5 text-[10px] sm:text-[11px]
        border border-[#e2ddd8] rounded-full
        disabled:opacity-30"
        style={{ fontFamily: MONO }}
      >
        Anterior
      </button>

      {visiblePages.map((p, i) =>

        p === "..." ? (

          <span
            key={`dots-${i}`}
            className="px-2 text-[#8a8682]"
          >
            ...
          </span>

        ) : (

          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={[
              "w-7 h-7 text-[10px] rounded-full border",
              p === page
                ? "bg-[#e8622a] text-white border-[#e8622a]"
                : "border-[#e2ddd8]"
            ].join(" ")}
            style={{ fontFamily: MONO }}
          >
            {p}
          </button>

        )
      )}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="px-3 py-1.5 text-[10px] sm:text-[11px]
        border border-[#e2ddd8] rounded-full
        disabled:opacity-30"
        style={{ fontFamily: MONO }}
      >
        Siguiente
      </button>

    </div>
  );
});


function YearBlock({ year, articles, isFirst = false }: {
    year:     string;
    articles: BlogArticle[];
    isFirst?: boolean;
}) {
    const [page, setPage] = useState(1);

    const paginated = useMemo(() => articles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),[articles, page]);
    const [featured, ...rest] = paginated;

    const handlePage = (p: number) => {
        setPage(p);
        document.getElementById(`year-${year}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <div className="mb-16" id={`year-${year}`}>
            <div className="flex items-center gap-4 mb-6">
                <span className="text-[11px] tracking-[0.35em] uppercase text-[#8a8682]" style={{ fontFamily: MONO }}>
                    {year}
                </span>
                <div className="flex-1 h-px bg-[#e2ddd8]" />
                <span className="text-[10px] text-[#8a8682] bg-[#f0ede8] px-2.5 py-0.5 rounded-full" style={{ fontFamily: MONO }}>
                    {articles.length} artículo{articles.length !== 1 ? "s" : ""}
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featured && <FeaturedCard article={featured} priority={isFirst && page === 1} />}
                {rest.map((a: BlogArticle) =>
                    a.coverImage
                        ? <SmallCard key={a.id} article={a} />
                        : <TextCard  key={a.id} article={a} />
                )}
            </div>

            <Pagination
                page={page}
                total={articles.length}
                pageSize={PAGE_SIZE}
                onChange={handlePage}
            />
        </div>
    );
}



const AllArticles = memo(function AllArticles({ byYear, years }: { byYear: Record<string, BlogArticle[]>; years: string[] }) {
    const [page, setPage] = useState(1);

    const all                = useMemo(() => years.flatMap(y => byYear[y]),[years,byYear]);
    const paginated = useMemo(()=> all.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE), [all,page]);

    const [featured, ...rest] = paginated;

    const handlePage = useCallback((p: number) => {
        setPage(p);
        document
        .getElementById("feed-top")
        ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }, []);

    return (
        <div id="feed-top">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featured && <FeaturedCard article={featured} priority={page === 1} />}
                {rest.map((a: BlogArticle) =>
                    a.coverImage
                        ? <SmallCard key={a.id} article={a} />
                        : <TextCard  key={a.id} article={a} />
                )}
            </div>

            <Pagination
                page={page}
                total={all.length}
                pageSize={PAGE_SIZE}
                onChange={handlePage}
            />
        </div>
    );
});

function EditorialHero({ totalArticles }: { totalArticles: number }) {
    return (
        <div className="relative overflow-hidden mb-0" style={{ background: "#12110f" }}>
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
        </div>
    );
}


export function BlogFeedClient({ years, byYear, totalArticles }: { years: string[]; byYear: Record<string, BlogArticle[]>; totalArticles: number; }) {
    const [activeYear,setActiveYear]=useState("all");

    const yearsWithAll = useMemo(
    ()=>["all",...years],
    [years]
    );

    const handleYearChange = useCallback((y:string)=>{

    setActiveYear(y);

    document
    .getElementById("feed-top")
    ?.scrollIntoView({
        behavior:"smooth",
        block:"start"
    });

    },[]);

    return (
        <>
            <EditorialHero totalArticles={totalArticles} />

            <div className="pt-6 pb-16">

                {/* Year filter pills */}
                <div className="flex items-center gap-2 mb-8 flex-wrap" id="feed-top">
                    {yearsWithAll.map(y =>(
                        <button key={y}
                            onClick={() => handleYearChange(y)}
                            className={[
                                "px-3 sm:px-4 py-1.5 text-[10px] sm:text-[11px] tracking-[0.1em] border rounded-full transition-all duration-150",
                                y === "all" ? "border-dashed" : "",
                                activeYear === y
                                    ? "bg-[#e8622a] text-white border-[#e8622a]"
                                    : "bg-white text-[#8a8682] border-[#e2ddd8] hover:border-[#e8622a] hover:text-[#e8622a]"
                            ].join(" ")}
                            style={{ fontFamily: MONO }}>
                            {y === "all" ? "Todos" : y}
                        </button>
                    ))}
                </div>

                {/* Feed */}
                {activeYear === "all"
                    ? <AllArticles byYear={byYear} years={years} />
                    : <YearBlock year={activeYear} articles={byYear[activeYear] ?? []} isFirst />
                }
            </div>
        </>
    );
}
