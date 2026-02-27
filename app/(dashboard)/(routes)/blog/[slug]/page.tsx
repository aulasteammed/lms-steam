import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ArticleReader } from "./_components/article-reader";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const article = await db.article.findUnique({ where: { slug } });
    if (!article) return {};
    return {
        title:       article.title,
        description: article.subtitle ?? undefined,
    };
}

export default async function BlogArticlePage({ params }: Props) {
    const { slug } = await params;

    const article = await db.article.findUnique({
        where:   { slug, status: "published" },
        include: { _count: { select: { views: true } } },
    });

    if (!article) return notFound();

    const [prev, next] = await Promise.all([
        db.article.findFirst({
            where:   { status: "published", publishedAt: { lt: article.publishedAt ?? new Date() } },
            orderBy: { publishedAt: "desc" },
            select:  { slug: true, title: true },
        }),
        db.article.findFirst({
            where:   { status: "published", publishedAt: { gt: article.publishedAt ?? new Date() } },
            orderBy: { publishedAt: "asc" },
            select:  { slug: true, title: true },
        }),
    ]);

    return (
        <ArticleReader
            article={article as any}
            viewCount={article._count.views}
            articleId={article.id}
            prev={prev}
            next={next}
        />
    );
}