import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { articleId } = await req.json();
        console.log("[views API] body recibido:", { articleId });

        if (!articleId || typeof articleId !== "string") {
            return NextResponse.json({ error: "articleId requerido" }, { status: 400 });
        }

        await db.articleView.create({
            data: {
                articleId,
                userId:    null,
                sessionId: crypto.randomUUID(),
            },
        });

        return NextResponse.json({ ok: true });
    } catch (e) {
        console.log("[views API] error:", e);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}