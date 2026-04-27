import { auth } from '@clerk/nextjs/server';

import { db } from '@/lib/db';
import { getOrCreateActiveRetryCode } from '@/lib/evaluation-retry';
import { Badge } from '@/components/ui/badge';

import { DataTable } from './_components/data-table';
import { columns } from './_components/columns';

/**
 * Courses Page.
 * Displays a list of courses created by the authenticated user.
 */
const CoursesPage = async () => {
    const { userId, redirectToSignIn } = await auth();

    if (!userId) return redirectToSignIn()

    const courses = await db.course.findMany({
        where: {
            userId,
        },
        orderBy: {
           createdAt: "desc"
        },
    });

    const activeRetryCode = await getOrCreateActiveRetryCode();

  return (
    <div className="p-6">
        <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">Código universal de reintento</h2>
                <Badge variant="secondary">Un solo uso</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-600">
                Entrega este código al estudiante cuando haya agotado sus intentos. Al ser usado, se desactiva y se genera automáticamente uno nuevo.
            </p>
            <div className="mt-3 inline-flex rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-lg font-bold tracking-widest text-slate-900">
                {activeRetryCode.code}
            </div>
        </div>
        <DataTable columns={columns} data={courses} />
    </div>
  );
};

export default CoursesPage;
