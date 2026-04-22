"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { MobileReader } from "../mobile-reader";

import {
    TEMPLATE_LABELS,
    ProgressBar, ImageOverlay, BlockRenderer,
    Byline, PrevNext, KeyboardBar, TopBar,
    useReaderState, type ReaderProps,
} from "./shared";

export function ReaderNewsShort({ article, viewCount, articleId, articleSlug, prev, next }: ReaderProps) {
    const router = useRouter();
    const blocks = (Array.isArray(article.blocks) ? article.blocks : [])
        .sort((a, b) => a.position - b.position);

    const accent = article.accentColor || "#e8622a";

    const {
        focusMode, setFocusMode,
        imgOverlay, setImgOverlay,
        imgIdx, imageBlocks,
        openImg, navImg,
        getParagraphFocused,
        endRef,
    } = useReaderState({ articleId, articleSlug, blocks, prev, next, router });

    return (
        <>
            <div className="md:hidden h-screen">
                <MobileReader
                    article={article as any}
                    viewCount={viewCount}
                    articleId={articleId}
                    prev={prev}
                    next={next}
                />
            </div>

            <div className="hidden md:block" style={{ background: "#fafaf8" }}>
                <ProgressBar accent={accent} />
                <TopBar article={article} focusMode={focusMode} onToggleFocus={() => setFocusMode(v => !v)} />

            {imgOverlay && imageBlocks.length > 0 && (
                <ImageOverlay images={imageBlocks} currentIdx={imgIdx}
                    onClose={() => setImgOverlay(false)} onNav={navImg} />
            )}

            <div className="max-w-[720px] mx-auto px-10 pt-10 pb-24">

                {/* ── Newspaper-style header ── */}

                {/* Dateline */}
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-[9px] tracking-[0.35em] uppercase font-semibold"
                        style={{ color: accent }}>
                        {TEMPLATE_LABELS[article.template]}
                    </span>
                    <span className="text-[#e2ddd8]">·</span>
                    <span className="text-[10px] text-[#8a8682]">
                        {article.publishedAt
                            ? new Date(article.publishedAt).toLocaleDateString("es-CO", {
                                weekday: "long", day: "numeric", month: "long", year: "numeric"
                            })
                            : ""}
                    </span>
                </div>

                {/* Title — large, tight */}
                <h1 style={{ fontFamily: "var(--font-blog-serif, Georgia, serif)" }} className="text-[50px] font-black leading-[0.88] tracking-[-2px] text-[#12110f] mb-3"
                   >
                    {article.title}
                </h1>

                {/* Accent rule */}
                <div className="h-[3px] w-12 mb-4 rounded-full" style={{ background: accent }} />

                {/* Subtitle / entradilla */}
                {article.subtitle && (
                    <p className="text-[17px] text-[#5a5a5a] leading-relaxed mb-6 border-l-2 pl-4"
                        style={{ borderLeftColor: accent }}>
                        {article.subtitle}
                    </p>
                )}

                {/* Cover — full width, cinematic */}
                {article.coverImage && (
                    <div className="relative w-full aspect-[16/6] mb-7 overflow-hidden rounded-lg">
                        <Image src={article.coverImage} alt={article.title} fill className="object-cover" sizes="720px" />
                        {/* Thin accent band at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: accent }} />
                    </div>
                )}

                {/* ── Content — compact 2-column newspaper grid ── */}
                <div>
                    {blocks.map(block => (
                        <BlockRenderer key={block.id} block={block} accent={accent}
                            paragraphFocused={getParagraphFocused(block)} onImageClick={openImg} />
                    ))}
                    <div style={{ clear: "both" }} />
                </div>

                {/* End sentinel */}
                <div ref={endRef} className="h-1 w-full mt-2" aria-hidden />

                {/* ── Byline at end — newspaper convention ── */}
                <div className="mt-8 mb-14">
                    <Byline article={article} viewCount={viewCount} />
                </div>

                <PrevNext prev={prev} next={next} />
            </div>

                <KeyboardBar />
            </div>
        </>
    );
}