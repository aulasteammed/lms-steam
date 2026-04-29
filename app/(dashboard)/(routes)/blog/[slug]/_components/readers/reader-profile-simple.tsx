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

export function ReaderProfileSimple({ article, viewCount, articleId, articleSlug, prev, next }: ReaderProps) {
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
                    articleSlug={articleSlug}
                    prev={prev}
                    next={next}
                />
            </div>

            <div className="hidden md:block" id="reader-scroll" style={{ background: "#fafaf8" }}>
                <ProgressBar accent={accent} />
                <TopBar article={article} focusMode={focusMode} onToggleFocus={() => setFocusMode(v => !v)} />

            {imgOverlay && imageBlocks.length > 0 && (
                <ImageOverlay images={imageBlocks} currentIdx={imgIdx}
                    onClose={() => setImgOverlay(false)} onNav={navImg} />
            )}

            {/* ── Editorial header — horizontal strip ── */}
            <div className="border-b border-[#e2ddd8]" style={{ background: "#fafaf8" }}>
                <div className="max-w-[760px] mx-auto px-10 pt-10 pb-8">

                    {/* Category badge */}
                    <div className="flex items-center gap-3 mb-5">
                        <span className="text-[9px] tracking-[0.35em] uppercase px-2.5 py-1 rounded-full border"
                            style={{ color: accent, borderColor: accent }}>
                            {TEMPLATE_LABELS[article.template]}
                        </span>
                        <div className="h-px flex-1" style={{ background: accent, opacity: 0.2 }} />
                        <span className="text-[10px] text-[#8a8682]">
                            {article.publishedAt
                                ? new Date(article.publishedAt).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" })
                                : ""}
                        </span>
                    </div>

                    {/* Title */}
                    <h1 style={{ fontFamily: "var(--font-blog-serif, Georgia, serif)" }} className="text-[48px] font-black leading-[0.9] tracking-[-1.5px] text-[#12110f] mb-4"
                       >
                        {article.title}
                    </h1>

                    {/* Subtitle */}
                    {article.subtitle && (
                        <p className="text-[17px] italic text-[#8a8682] leading-relaxed max-w-[560px]"
                           >
                            {article.subtitle}
                        </p>
                    )}

                    {/* Cover image — wide, not too tall */}
                    {article.coverImage && (
                        <div className="relative w-full aspect-[3/1] mt-7 overflow-hidden rounded-xl">
                            <Image src={article.coverImage} alt={article.title} fill className="object-cover" sizes="760px" />
                            {/* Subtle accent band at bottom of image */}
                            <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: accent }} />
                        </div>
                    )}

                    {/* Author byline below header */}
                    <div className="mt-6">
                        <Byline article={article} viewCount={viewCount} />
                    </div>
                </div>
            </div>

            {/* ── Content — single wide column ── */}
            <div className="max-w-[760px] mx-auto px-10 pt-9 pb-24">
                <div>
                    {blocks.map(block => (
                        <BlockRenderer key={block.id} block={block} accent={accent}
                            paragraphFocused={getParagraphFocused(block)} onImageClick={openImg} />
                    ))}
                    <div style={{ clear: "both" }} />
                </div>

                <div ref={endRef} className="h-1 w-full" aria-hidden />

                <div className="mt-14">
                    <PrevNext prev={prev} next={next} />
                </div>
            </div>

                <KeyboardBar />
            </div>
        </>
    );
}
