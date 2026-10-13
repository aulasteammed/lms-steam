import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { isTeacher } from "@/lib/teacher";
import { NO_YEAR, getAdminEntries } from "@/lib/timeline-admin";

import { DataTable } from "./_components/data-table";
import { columns, type EntryRow } from "./_components/columns";
import { draftPeriodLabel } from "./_components/draft";

/**
 * Registros del mapa y la línea de tiempo: proyectos, participaciones y
 * alianzas.
 */
export default async function TeacherEntriesPage() {
    const { userId } = await auth();
    if (!isTeacher(userId)) return redirect("/");

    const entries: EntryRow[] = (await getAdminEntries()).map((entry) => ({
        id: entry.id,
        title: entry.title,
        type: entry.type,
        period: draftPeriodLabel({
            type: entry.type,
            startYear: entry.startYear === NO_YEAR ? null : entry.startYear,
            endYear: entry.endYear,
            participationDate: entry.participationDate?.toISOString().slice(0, 10) ?? "",
        }),
        status: entry.status,
    }));

    return (
        <div className="p-6">
            <DataTable columns={columns} data={entries} />
        </div>
    );
}
