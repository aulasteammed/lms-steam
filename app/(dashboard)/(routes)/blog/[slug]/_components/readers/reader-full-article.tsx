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

export function ReaderFullArticle({ article, viewCount, articleId, articleSlug, prev, next }: ReaderProps) {
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

            <div className="hidden md:block" id="reader-scroll" style={{ background: "#fafaf8" }}>
                <ProgressBar accent={accent} />
                <TopBar article={article} focusMode={focusMode} onToggleFocus={() => setFocusMode(v => !v)} />

            {imgOverlay && imageBlocks.length > 0 && (
                <ImageOverlay images={imageBlocks} currentIdx={imgIdx}
                    onClose={() => setImgOverlay(false)} onNav={navImg} />
            )}

            <div className="max-w-[800px] mx-auto px-10 pt-10 pb-24">

                {/* Kicker */}
                <div className="text-[10px] tracking-[0.35em] uppercase mb-3" style={{ color: accent }}>
                    {TEMPLATE_LABELS[article.template]}
                </div>

                {/* Title */}
                <h1 style={{ fontFamily: "var(--font-blog-serif, Georgia, serif)" }} className="text-[52px] font-black leading-[0.92] tracking-[-2px] mb-4 text-[#12110f]"
                   >
                    {article.title}
                </h1>

                {/* Subtitle */}
                {article.subtitle && (
                    <p className="text-lg italic text-[#8a8682] leading-relaxed mb-7 max-w-[580px]"
                       >
                        {article.subtitle}
                    </p>
                )}

                {/* Byline */}
                <div className="mb-9">
                    <Byline article={article} viewCount={viewCount} />
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
