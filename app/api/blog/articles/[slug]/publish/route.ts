// app/api/blog/articles/[slug]/publish/route.ts

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isTeacher } from "@/lib/teacher";
import { ArticleStatus } from "@prisma/client";

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
            if (!article.blocks || (article.blocks as unknown[]).length === 0)
                return new NextResponse("Cannot publish: no content blocks", { status: 400 });
        }

        let status: ArticleStatus;
        let publishedAt: Date | null = article.publishedAt;

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
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.log("[BLOG_ARTICLE_PUBLISH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}