import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isTeacher } from "@/lib/teacher";

/**
 * GET /api/blog/articles
 * Feed paginado de artículos publicados. Público.
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const cursor = searchParams.get("cursor");
        const limit  = Math.min(parseInt(searchParams.get("limit") ?? "10"), 50);
        const year   = searchParams.get("year");

        const where: Record<string, unknown> = { status: "published" };

        if (year) {
            const y = parseInt(year);
            where.publishedAt = {
                gte: new Date(`${y}-01-01T00:00:00.000Z`),
                lt:  new Date(`${y + 1}-01-01T00:00:00.000Z`),
            };
        }

        const articles = await db.article.findMany({
            where,
            orderBy: { publishedAt: "desc" },
            take: limit + 1,
            ...(cursor && { cursor: { id: cursor }, skip: 1 }),
            select: {
                id: true, slug: true, title: true, subtitle: true, hookPhrase: true,
                coverImage: true, authorName: true, authorPhoto: true,
                template: true, accentColor: true, publishedAt: true,
                _count: { select: { views: true } },
            },
        });

        const hasMore    = articles.length > limit;
        const data       = hasMore ? articles.slice(0, limit) : articles;
        const nextCursor = hasMore ? data[data.length - 1].id : null;

        return NextResponse.json({ articles: data, nextCursor });
    } catch (error) {
        console.log("[BLOG_ARTICLES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

/**
 * POST /api/blog/articles
 * Crea un nuevo artículo en estado borrador. Solo profesores.
 */
export async function POST(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId || !isTeacher(userId)) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { title } = await req.json();

        if (!title || typeof title !== "string" || title.trim().length === 0) {
            return new NextResponse("Title is required", { status: 400 });
        }

        if (title.length > 100) {
            return new NextResponse("Title exceeds 100 characters", { status: 400 });
        }

        // Generar slug desde el título
        const baseSlug = title
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-")
            .slice(0, 60);

        // Evitar slugs duplicados
        let slug   = baseSlug;
        let suffix = 1;
        while (await db.article.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${suffix}`;
            suffix++;
        }

        const article = await db.article.create({
            data: {
                title:      title.trim(),
                slug,
                authorName: "",
                blocks:     [],
                status:     "draft",
            },
        });

        return NextResponse.json(article);
    } catch (error) {
        console.log("[BLOG_ARTICLES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}