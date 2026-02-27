import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function recordView(articleId: string) {
    try {
        const cookieStore = await cookies();
        const sessionKey  = `viewed_${articleId}`;
        const alreadySeen = cookieStore.get(sessionKey);

        if (alreadySeen) return;

        await db.articleView.create({
            data: {
                articleId,
                userId:    null,
                sessionId: crypto.randomUUID(),
            },
        });
    } catch {
        // Silently fail
    }
}