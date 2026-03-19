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

export function ReaderCoverPerson({ article, viewCount, articleId, prev, next }: ReaderProps) {
    const router = useRouter();
    const blocks = (Array.isArray(article.blocks) ? article.blocks : [])
        .sort((a, b) => a.position - b.position);

    const accent = article.accentColor || "#e8622a";
    const dark   = article.darkColColor || "#12110f";

    const {
        focusMode, setFocusMode,
        imgOverlay, setImgOverlay,
        imgIdx, imageBlocks,
        openImg, navImg,
        getParagraphFocused,
        endRef,
    } = useReaderState({ articleId, blocks, prev, next, router });

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

                {/* Top bar */}
                <TopBar article={article} focusMode={focusMode} onToggleFocus={() => setFocusMode(v => !v)} />

            {/* Image overlay */}
            {imgOverlay && imageBlocks.length > 0 && (
                <ImageOverlay images={imageBlocks} currentIdx={imgIdx}
                    onClose={() => setImgOverlay(false)} onNav={navImg} />
            )}

            {/* ── Two-column magazine layout ── */}
            <div className="flex min-h-[calc(100vh-49px)]">

                {/* Left — sticky cover panel */}
                <div className="hidden lg:flex w-[38%] flex-shrink-0 sticky top-[49px] h-[calc(100vh-49px)] flex-col justify-between overflow-hidden"
                    style={{ background: dark }}>

                    {/* Cover photo with gradient overlay */}
                    {article.coverImage && (
                        <>
                            <div className="absolute inset-0">
                                <Image src={article.coverImage} alt={article.title} fill className="object-cover" sizes="500px" />
                            </div>
                            <div className="absolute inset-0"
                                style={{ background: `linear-gradient(to bottom, ${dark}bb 0%, ${dark}44 35%, ${dark}22 55%, ${dark}cc 75%, ${dark}f5 100%)` }} />
                        </>
                    )}

                    {/* Noise texture */}
                    {!article.coverImage && (
                        <div className="absolute inset-0 opacity-[0.05]"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
                    )}

                    {/* Top: kicker */}
                    <div className="relative z-10 p-7">
                        <span className="text-[9px] tracking-[0.35em] uppercase" style={{ color: accent }}>
                            {TEMPLATE_LABELS[article.template]}
                        </span>
                    </div>

                    {/* Bottom: title + author */}
                    <div className="relative z-10 p-7">
                        {/* Accent line */}
                        <div className="w-8 h-[3px] rounded-full mb-5" style={{ background: accent }} />

                        {/* Title */}
                        <h1 style={{ fontFamily: "var(--font-blog-serif, Georgia, serif)" }} className="text-[42px] font-black leading-[0.88] tracking-[-1.5px] text-white mb-4"
                           >
                            {article.title}
                        </h1>

                        {/* Subtitle */}
                        {article.subtitle && (
                            <p className="text-[12px] leading-relaxed text-white/50 mb-6">{article.subtitle}</p>
                        )}

                        {/* Author mini-byline */}
                        <Byline article={article} viewCount={viewCount} dark />
                    </div>
                </div>

                {/* Right — scrollable content */}
                <div className="flex-1 min-w-0">
                    {/* Mobile header (shown on small screens where left panel is hidden) */}
                    <div className="lg:hidden px-6 pt-8 pb-6" style={{ background: dark }}>
                        <span className="text-[9px] tracking-[0.35em] uppercase block mb-3" style={{ color: accent }}>
                            {TEMPLATE_LABELS[article.template]}
                        </span>
                        <div className="w-8 h-[3px] rounded-full mb-4" style={{ background: accent }} />
                        <h1 style={{ fontFamily: "var(--font-blog-serif, Georgia, serif)" }} className="text-[36px] font-black leading-[0.9] tracking-[-1px] text-white mb-3">
                            {article.title}
                        </h1>
                        {article.subtitle && (
                            <p className="text-[12px] text-white/50 leading-relaxed">{article.subtitle}</p>
                        )}
                        {article.coverImage && (
                            <div className="relative w-full aspect-[16/7] mt-5 overflow-hidden rounded-xl">
                                <Image src={article.coverImage} alt={article.title} fill className="object-cover" sizes="600px" />
                            </div>
                        )}
                        <div className="mt-5">
                            <Byline article={article} viewCount={viewCount} dark />
                        </div>
                    </div>

                    {/* Article body */}
                    <div className="px-10 pt-10 pb-24 max-w-[640px]">
                        {/* Blocks */}
                        <div style={{ columnCount: 1 }}>
                            {blocks.map(block => (
                                <BlockRenderer key={block.id} block={block} accent={accent}
                                    paragraphFocused={getParagraphFocused(block)} onImageClick={openImg} />
                            ))}
                            <div style={{ clear: "both" }} />
                        </div>

                        {/* End sentinel */}
                        <div ref={endRef} className="h-1 w-full" aria-hidden />

                        {/* Prev/Next */}
                        <div className="mt-14">
                            <PrevNext prev={prev} next={next} />
                        </div>
                    </div>
                </div>
            </div>

                <KeyboardBar />
            </div>
        </>
    );
}
