import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { isTeacher } from "@/lib/teacher";

import { ArticleEditor } from "./_components/article-editor";


export default async function ArticleIdPage(
    props: { params: Promise<{ articleId: string }> }
) {
    const { articleId: slug } = await props.params;

    const { userId, redirectToSignIn } = await auth();
    if (!userId) return redirectToSignIn();
    if (!isTeacher(userId)) return redirect("/");

    const article = await db.article.findUnique({
        where: { slug },
        include: { _count: { select: { views: true } } },
    });

    if (!article) return redirect("/teacher/blog");

    return <ArticleEditor article={article} />;
}