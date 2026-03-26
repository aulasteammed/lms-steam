import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { isTeacher } from "@/lib/teacher";
import { DataTable } from "./_components/data_table";
import { columns } from "./_components/columns";

export default async function TeacherBlogPage() {
    const { userId } = await auth();
    if (!userId || !isTeacher(userId)) return redirect("/");

    const articles = await db.article.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id:          true,
            slug:        true,   
            title:       true,
            authorName:  true,
            template:    true,
            status:      true,
            publishedAt: true,
            _count: { select: { views: true } },
        },
    });

    return (
        <div className="p-6">
            <DataTable columns={columns} data={articles} />
        </div>
    );
}