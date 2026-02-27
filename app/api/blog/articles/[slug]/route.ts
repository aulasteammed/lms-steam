import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isTeacher } from "@/lib/teacher";

// ── Helpers ───────────────────────────────────────────────────

function toSlug(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 60);
}

async function uniqueSlug(base: string, excludeId: string): Promise<string> {
    let slug   = base || "sin-titulo";
    let suffix = 1;
    while (true) {
        const existing = await db.article.findUnique({ where: { slug } });
        if (!existing || existing.id === excludeId) break;
        slug = `${base}-${suffix}`;
        suffix++;
    }
    return slug;
}

// ── GET ───────────────────────────────────────────────────────

export async function GET(
    req: Request,
    context: { params: Promise<{ slug: string }> }
) {
    const { slug } = await context.params;
    const { userId } = await auth();
    const teacher = userId ? isTeacher(userId) : false;

    const article = await db.article.findUnique({
        where:   { slug },
        include: { _count: { select: { views: true } } },
    });

    if (!article) return new NextResponse("Not Found", { status: 404 });

    if (article.status !== "published" && !teacher)
        return new NextResponse("Not Found", { status: 404 });

    return NextResponse.json(article);
}

// ── PUT ───────────────────────────────────────────────────────

export async function PUT(
    req: Request,
    context: { params: Promise<{ slug: string }> }
) {
    const { slug } = await context.params;
    const { userId } = await auth();

    if (!userId || !isTeacher(userId))
        return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();

    // Buscar artículo actual para verificar estado y obtener id
    const current = await db.article.findUnique({ where: { slug } });
    if (!current) return new NextResponse("Not Found", { status: 404 });

    // Regenerar slug solo si está en borrador y el título cambió
    let newSlug: string | undefined;

    if (current.status === "draft" && typeof body.title === "string") {
        const base      = toSlug(body.title) || "sin-titulo";
        const candidate = await uniqueSlug(base, current.id);

        if (candidate !== slug) {
            newSlug = candidate;
        }
    }

    const article = await db.article.update({
        where: { slug },
        data: {
            ...body,
            // Aplicar nuevo slug si se generó uno diferente
            ...(newSlug ? { slug: newSlug } : {}),
        },
    });

    // Devolver newSlug para que el editor actualice su URL
    return NextResponse.json({
        ...article,
        ...(newSlug ? { newSlug } : {}),
    });
}

// ── DELETE ────────────────────────────────────────────────────

export async function DELETE(
    req: Request,
    context: { params: Promise<{ slug: string }> }
) {
    const { slug } = await context.params;
    const { userId } = await auth();

    if (!userId || !isTeacher(userId))
        return new NextResponse("Unauthorized", { status: 401 });

    const article = await db.article.findUnique({ where: { slug } });
    if (!article) return new NextResponse("Not Found", { status: 404 });

    await db.articleView.deleteMany({ where: { articleId: article.id } });
    await db.article.delete({ where: { slug } });

    return new NextResponse(null, { status: 204 });
}