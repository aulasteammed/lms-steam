// app/api/blog/articles/[slug]/publish/route.ts

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isTeacher } from "@/lib/teacher";
import { ArticleStatus } from "@prisma/client";

function buildHookPhrase(source: string): string | null {
    const text = source.trim().replace(/\s+/g, " ");
    if (!text) return null;
    const max = 80;
    if (text.length <= max) return text;
    const cut = text.slice(0, max - 1);
    const lastSpace = cut.lastIndexOf(" ");
    return (lastSpace > 30 ? cut.slice(0, lastSpace) : cut).trim() + "...";
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { userId } = await auth();

        if (!userId || !isTeacher(userId)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { slug } = await params;
        const { action } = await req.json();

        if (!["publish", "unpublish", "archive"].includes(action)) {
            return new NextResponse("Invalid action", { status: 400 });
        }

        const article = await db.article.findUnique({ where: { slug } });

        if (!article) {
            return new NextResponse("Not Found", { status: 404 });
        }

        if (action === "publish") {
            if (!article.title?.trim())
                return new NextResponse("Cannot publish: missing title", { status: 400 });
            if (!article.authorName?.trim())
                return new NextResponse("Cannot publish: missing author name", { status: 400 });
            const blocks = Array.isArray(article.blocks) ? (article.blocks as any[]) : [];
            if (blocks.length === 0)
                return new NextResponse("Cannot publish: no content blocks", { status: 400 });

            const hasValidParagraph = blocks.some((b) =>
                b?.type === "paragraph" && typeof b.content === "string" && b.content.trim().length >= 10
            );
            const hasValidList = blocks.some((b) =>
                b?.type === "list" &&
                Array.isArray(b.items) &&
                b.items.some((i: unknown) => typeof i === "string" && i.trim().length >= 3)
            );
            const hasBodyImage = blocks.some((b) =>
                b?.type === "image" && typeof b.imageUrl === "string" && b.imageUrl.trim().length > 0
            );
            if (!hasValidParagraph && !hasValidList && !hasBodyImage)
                return new NextResponse("Cannot publish: missing valid content", { status: 400 });
        }

        let status: ArticleStatus;
        let publishedAt: Date | null = article.publishedAt;
        const generatedHookPhrase =
            !article.hookPhrase?.trim()
                ? buildHookPhrase(article.subtitle ?? article.title ?? "")
                : null;

        if (action === "publish") {
            status = ArticleStatus.published;
            if (!publishedAt) publishedAt = new Date();
        } else if (action === "unpublish") {
            status = ArticleStatus.draft;
        } else {
            status = ArticleStatus.archived;
        }

        const updated = await db.article.update({
            where: { slug },
            data: {
                status,
                ...(publishedAt !== article.publishedAt && { publishedAt }),
                ...(generatedHookPhrase && { hookPhrase: generatedHookPhrase }),
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.log("[BLOG_ARTICLE_PUBLISH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
