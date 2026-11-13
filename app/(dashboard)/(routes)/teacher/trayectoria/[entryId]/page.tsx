import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { isTeacher } from "@/lib/teacher";
import { getAdminEntry, getInstitutionNames, getRelatedOptions } from "@/lib/timeline-admin";

import { EntryEditor } from "./_components/entry-editor";

/** Edición de un registro del mapa y la línea de tiempo. */
export default async function EntryIdPage(props: {
  params: Promise<{ entryId: string }>;
}) {
  const { entryId } = await props.params;

  const { userId } = await auth();
  if (!isTeacher(userId)) return redirect("/");

  // Las tres consultas salen a la vez.
  const [draft, relatedOptions, knownInstitutions] = await Promise.all([
    getAdminEntry(entryId),
    getRelatedOptions(),
    getInstitutionNames(),
  ]);

  if (!draft) {
    return redirect("/teacher/trayectoria");
  }

  return (
    <EntryEditor
      // Otro registro = otra pantalla: no se arrastra lo editado en el anterior.
      key={draft.id}
      initialDraft={draft}
      relatedOptions={relatedOptions}
      knownInstitutions={knownInstitutions}
    />
  );
}
