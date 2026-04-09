import { db } from "@/lib/db";

export const getHomeData = async () => {
    const now = new Date();

    const [closestEvent, latestCourse, latestArticle] = await Promise.all([
        db.event.findFirst({
            where: {
                startDateTime: { gte: now },
            },
            orderBy: { startDateTime: 'asc' },
        }),

        db.course.findFirst({
            where: {
                isPublished: true,
            },
            orderBy: { createdAt: 'desc' },
        }),

        db.article.findFirst({
            where: {
                status: 'published',
            },
            orderBy: { publishedAt: 'desc' },
        }),
    ]);

    return {
        closestEvent,
        latestCourse,
        latestArticle,
    };
};