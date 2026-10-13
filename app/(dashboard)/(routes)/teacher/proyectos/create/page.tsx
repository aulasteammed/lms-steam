import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { isTeacher } from "@/lib/teacher";
import { getInstitutionNames } from "@/lib/timeline-admin";

import { CreateForm } from "./_components/create-form";

/** Crear un registro del mapa y la línea de tiempo: primero el tipo, luego el nombre. */
export default async function CreateEntryPage() {
    const { userId } = await auth();
    if (!isTeacher(userId)) return redirect("/");

    return <CreateForm knownInstitutions={await getInstitutionNames()} />;
}
