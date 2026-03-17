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

// ── Block content minimums ────────────────────────────────────

const BLOCK_MIN: Record<string, number> = {
    paragraph: 10,
    pullquote:  4,
};

function normalizeOptionalText(value: unknown): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function sanitizeBlocks(blocks: unknown): unknown[] {
    if (!Array.isArray(blocks)) return [];
    return blocks.filter((b) => {
        if (!b || typeof b !== "object") return false;
        switch (b.type) {
            case "paragraph":
            case "pullquote": {
                const len = (b.content ?? "").trim().length;
                return len >= (BLOCK_MIN[b.type] ?? 1);
            }
            case "image":
                // Solo conservar si tiene imagen cargada
                return !!b.imageUrl?.trim();
            case "list": {
                // Conservar si tiene al menos 1 ítem con el mínimo de caracteres
                const validItems = (b.items ?? []).filter(
                    (item: string) => typeof item === "string" && item.trim().length >= 3
                );
                return validItems.length > 0;
            }
            case "divider":
                return true;
            default:
                return false;
        }
    });
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

    const current = await db.article.findUnique({ where: { slug } });
    if (!current) return new NextResponse("Not Found", { status: 404 });

    // Filtrar bloques vacíos o por debajo del mínimo antes de persistir
    if (Array.isArray(body.blocks)) {
        body.blocks = sanitizeBlocks(body.blocks);
    }

    body.subtitle = normalizeOptionalText(body.subtitle);
    body.hookPhrase = normalizeOptionalText(body.hookPhrase);
    body.authorBio = normalizeOptionalText(body.authorBio);
    body.authorPhoto = normalizeOptionalText(body.authorPhoto);
    body.authorSocialUrl = normalizeOptionalText(body.authorSocialUrl);

    // Regenerar slug solo si está en borrador y el título cambió
    let newSlug: string | undefined;

    if (current.status === "draft" && typeof body.title === "string") {
        const base      = toSlug(body.title) || "sin-titulo";
        const candidate = await uniqueSlug(base, current.id);
        if (candidate !== slug) newSlug = candidate;
    }

    const article = await db.article.update({
        where: { slug },
        data: {
            ...body,
            ...(newSlug ? { slug: newSlug } : {}),
        },
    });

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
