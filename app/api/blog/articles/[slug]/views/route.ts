// app/api/blog/views/route.ts
// Registra una vista cuando el usuario llega al final del artículo

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const { articleId } = await req.json();
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
    } catch {
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}