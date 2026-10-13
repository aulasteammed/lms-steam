"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  File,
  LayoutDashboard,
  Link2,
  MapPin,
  MessageSquareText,
  Trash,
  Users,
} from "lucide-react";

import { IconBadge } from "@/components/icon-badge";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TYPE_LABELS, type EntryType } from "@/lib/timeline";
import { TYPE_STYLES } from "@/app/(dashboard)/(routes)/proyectos/_components/entry-type";
import { deleteEntry, setEntryPublished, updateEntry } from "@/actions/timeline";

import {
  isReport,
  requiredFields,
  type DraftDocument,
  type EntryDraft,
  type EntryPatch,
} from "../../_components/draft";
import { DocumentsSection } from "./documents-section";
import {
  ImagesSection,
  InstitutionsSection,
  LocationSection,
  PeriodSection,
  RelatedSection,
  ShortDescriptionSection,
  TitleSection,
  type RelatedOption,
} from "./common-sections";
import {
  AcknowledgementsSection,
  DateModalitySection,
  PeopleSection,
  QuoteSection,
  ReasonSection,
  SpeakerSection,
  StorySection,
} from "./type-sections";

const HEADINGS: Record<EntryType, string> = {
  project: "Configuración del proyecto",
  participation: "Configuración de la participación",
  alliance: "Configuración de la alianza",
};

interface EntryEditorProps {
  initialDraft: EntryDraft;
  relatedOptions: RelatedOption[];
  knownInstitutions: string[];
}

/**
 * Pantalla de edición de un registro, con la misma distribución de la
 * configuración de un curso. Cada tarjeta guarda sola: el cambio se ve de
 * inmediato y, si el servidor lo rechaza, se deshace.
 */
export const EntryEditor = ({
  initialDraft,
  relatedOptions,
  knownInstitutions,
}: EntryEditorProps) => {
  const router = useRouter();
  const [draft, setDraft] = useState(initialDraft);
  const [isBusy, setIsBusy] = useState(false);
  // Lo último que se ve en pantalla, para poder deshacer un guardado fallido.
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const onChange = useCallback(async (patch: EntryPatch) => {
    const before = draftRef.current;
    setDraft((current) => ({ ...current, ...patch }));

    const result = await updateEntry(before.id, patch).catch(() => null);
    if (result?.ok) {
      toast.success("Registro actualizado");
      return true;
    }

    // Solo se devuelven los campos de esta tarjeta: otra pudo guardar entre tanto.
    const undo = Object.fromEntries(
      Object.keys(patch).map((key) => [key, before[key as keyof EntryDraft]])
    );
    setDraft((current) => ({ ...current, ...undo }));
    toast.error(result?.error ?? "No se pudo guardar. Revisa la conexión.");
    return false;
  }, []);

  const onDocumentAdded = useCallback(
    (document: DraftDocument) =>
      setDraft((current) => ({ ...current, documents: [...current.documents, document] })),
    []
  );
  const onDocumentRemoved = useCallback(
    (documentId: string) =>
      setDraft((current) => ({
        ...current,
        documents: current.documents.filter((document) => document.id !== documentId),
      })),
    []
  );

  const fields = requiredFields(draft);
  const missing = fields.filter((field) => !field.done);
  const completionText = `(${fields.length - missing.length}/${fields.length})`;
  const isPublished = draft.status === "published";

  const onPublish = async () => {
    setIsBusy(true);
    const result = await setEntryPublished(draft.id, !isPublished).catch(() => null);
    setIsBusy(false);
    if (!result?.ok) return toast.error(result?.error ?? "Algo salió mal");

    setDraft((current) => ({ ...current, status: isPublished ? "draft" : "published" }));
    toast.success(isPublished ? "Registro despublicado" : "Registro publicado");
  };

  const onDelete = async () => {
    setIsBusy(true);
    const result = await deleteEntry(draft.id).catch(() => null);
    if (!result?.ok) {
      setIsBusy(false);
      return toast.error(result?.error ?? "Algo salió mal");
    }
    toast.success("Registro eliminado");
    router.push("/teacher/proyectos");
  };

  const section = { draft, onChange };
  const TypeIcon = TYPE_STYLES[draft.type].icon;

  return (
    <>
      <div className="p-6">
        <div className="flex items-center justify-between gap-x-4">
          <div className="flex flex-col gap-y-2">
            <span
              className={cn(
                "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                TYPE_STYLES[draft.type].soft
              )}
            >
              <TypeIcon className="h-3.5 w-3.5" />
              {TYPE_LABELS[draft.type].singular}
            </span>
            <h1 className="text-2xl font-medium">{HEADINGS[draft.type]}</h1>
            <span className="text-sm text-slate-700">
              {missing.length
                ? `Para publicar falta: ${missing.map((field) => field.label.toLowerCase()).join(", ")} ${completionText}`
                : `Campos obligatorios completos ${completionText}`}
            </span>
          </div>
          <div className="flex items-center gap-x-2">
            <Button
              onClick={onPublish}
              disabled={isBusy || (!isPublished && missing.length > 0)}
              variant="outline"
              size="sm"
            >
              {isPublished ? "Despublicar" : "Publicar"}
            </Button>
            <ConfirmModal onConfirm={onDelete}>
              <Button size="sm" aria-label="Eliminar registro" disabled={isBusy}>
                <Trash className="h-4 w-4" />
              </Button>
            </ConfirmModal>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-x-2">
                <IconBadge icon={LayoutDashboard} />
                <h2 className="text-xl">Información general</h2>
              </div>
              <TitleSection {...section} />
              <ShortDescriptionSection {...section} />
              {draft.type === "participation" ? (
                <DateModalitySection {...section} />
              ) : (
                <PeriodSection {...section} />
              )}
              <ImagesSection {...section} />
            </div>

            {draft.type === "project" && (
              <div>
                <div className="flex items-center gap-x-2">
                  <IconBadge icon={MessageSquareText} />
                  <h2 className="text-xl">Contenido de la página</h2>
                </div>
                <StorySection {...section} />
                <QuoteSection {...section} />
                <AcknowledgementsSection {...section} />
              </div>
            )}

            {draft.type === "participation" && (
              <div>
                <div className="flex items-center gap-x-2">
                  <IconBadge icon={MessageSquareText} />
                  <h2 className="text-xl">Detalles de la participación</h2>
                </div>
                <ReasonSection {...section} />
                <SpeakerSection {...section} />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-x-2">
                <IconBadge icon={MapPin} />
                <h2 className="text-xl">Lugar e instituciones</h2>
              </div>
              <LocationSection {...section} />
              <InstitutionsSection {...section} knownInstitutions={knownInstitutions} />
            </div>

            {draft.type === "project" ? (
              <>
                <div>
                  <div className="flex items-center gap-x-2">
                    <IconBadge icon={File} />
                    <h2 className="text-xl">Documentos</h2>
                  </div>
                  <DocumentsSection
                    entryId={draft.id}
                    variant="featured"
                    documents={draft.documents.filter((document) => !isReport(document.kind))}
                    onAdded={onDocumentAdded}
                    onRemoved={onDocumentRemoved}
                  />
                  <DocumentsSection
                    entryId={draft.id}
                    variant="report"
                    documents={draft.documents.filter((document) => isReport(document.kind))}
                    onAdded={onDocumentAdded}
                    onRemoved={onDocumentRemoved}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-x-2">
                    <IconBadge icon={Users} />
                    <h2 className="text-xl">Equipo</h2>
                  </div>
                  <PeopleSection {...section} />
                </div>
              </>
            ) : (
              <div>
                <div className="flex items-center gap-x-2">
                  <IconBadge icon={Link2} />
                  <h2 className="text-xl">Relaciones</h2>
                </div>
                <RelatedSection {...section} options={relatedOptions} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
