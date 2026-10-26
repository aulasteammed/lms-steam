"use client";

import { useState } from "react";
import { Download, File, PlusCircle, Trash } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loading } from "@/components/loading";
import { ConfirmModal } from "@/components/modals/confirm-modal";
import { addDocument, deleteDocument, discardUploads } from "@/actions/timeline";
import { uploadDocument } from "@/lib/timeline-upload";

import {
  DOCUMENT_KIND_LABELS,
  FEATURED_KINDS,
  type DocumentKind,
  type DraftDocument,
} from "../../_components/draft";

const MAX_PDF_BYTES = 32 * 1024 * 1024;

/**
 * Título sugerido a partir del nombre del archivo, que se ve en la página
 * pública: "Taller_Aprendizaje_Supervisado.pdf" → "Taller Aprendizaje
 * Supervisado". Los guiones solo se cambian si el nombre no tiene espacios
 * ("informe-final-2025"); las mayúsculas se dejan, por las siglas.
 */
const titleFromFileName = (name: string) => {
  const base = name.replace(/\.pdf$/i, "").replace(/_+/g, " ");
  return (base.includes(" ") ? base : base.replace(/-+/g, " ")).replace(/\s+/g, " ").trim();
};

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/** Las dos tarjetas de documentos de un proyecto. */
const VARIANTS = {
  featured: {
    label: "Publicaciones y entregables",
    addLabel: "Añadir una publicación",
    empty: "Sin publicaciones ni entregables",
    hint: "Lo que el proyecto produjo: periódico, revista, cartilla u otro entregable. Se muestran con su portada y el primero va en el encabezado de la página.",
    kinds: FEATURED_KINDS,
  },
  report: {
    label: "Informes",
    addLabel: "Añadir un informe",
    empty: "Sin informes",
    hint: "Cuentan cómo se hizo el proyecto. Van en una lista aparte, debajo de las publicaciones.",
    kinds: ["report"] as DocumentKind[],
  },
};

interface DocumentsSectionProps {
  entryId: string;
  variant: keyof typeof VARIANTS;
  /** Solo los documentos de esta tarjeta, en su orden. */
  documents: DraftDocument[];
  onAdded: (document: DraftDocument) => void;
  onRemoved: (documentId: string) => void;
}

/**
 * Documentos de un proyecto. A diferencia de las demás tarjetas, cada
 * documento se guarda apenas termina de subir: no hay botón "Guardar".
 */
export const DocumentsSection = ({
  entryId,
  variant,
  documents,
  onAdded,
  onRemoved,
}: DocumentsSectionProps) => {
  const copy = VARIANTS[variant];
  const [isAdding, setIsAdding] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<DocumentKind>(copy.kinds[0]);
  /** Texto del avance mientras se sube; `null` si no hay subida en marcha. */
  const [progress, setProgress] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const isUploading = progress !== null;

  const reset = () => {
    setIsAdding(false);
    setFile(null);
    setTitle("");
    setKind(copy.kinds[0]);
  };

  const onPick = (picked: File | undefined) => {
    if (!picked) return;
    if (picked.type !== "application/pdf") return toast.error("El documento debe ser un PDF");
    if (picked.size > MAX_PDF_BYTES) return toast.error("El PDF pesa más de 32 MB");
    setFile(picked);
    setTitle((current) => current || titleFromFileName(picked.name));
  };

  const onUpload = async () => {
    if (!file || !title.trim() || isUploading) return;
    setProgress("Abriendo el PDF…");

    let uploaded: string[] = [];
    try {
      const result = await uploadDocument(file, ({ done, total }) =>
        setProgress(`Subiendo páginas: ${done} de ${total}`)
      );
      uploaded = [result.pdfUrl, ...result.pages];

      setProgress("Guardando…");
      const saved = await addDocument(entryId, { title: title.trim(), kind, ...result });
      if (!saved.ok) throw new Error(saved.error);

      onAdded(saved.data);
      toast.success("Documento guardado");
      reset();
    } catch (error) {
      // Lo que alcanzó a subirse no quedó en ningún registro: se borra.
      const partial = (error as { uploaded?: string[] }).uploaded ?? uploaded;
      if (partial.length > 0) void discardUploads(partial);
      toast.error(error instanceof Error ? error.message : "No se pudo subir el documento");
    } finally {
      setProgress(null);
    }
  };

  const onDelete = async (documentId: string) => {
    setRemovingId(documentId);
    const result = await deleteDocument(documentId);
    setRemovingId(null);
    if (!result.ok) return toast.error(result.error);
    onRemoved(documentId);
    toast.success("Documento eliminado");
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        <span>
          {copy.label}
          <span className="ml-2 text-xs font-normal text-slate-500">Opcional</span>
        </span>
        <Button
          onClick={() => (isAdding ? reset() : setIsAdding(true))}
          variant="ghost"
          disabled={isUploading}
        >
          {isAdding ? (
            <>Cancelar</>
          ) : (
            <>
              <PlusCircle className="h-4 w-4 mr-2" />
              {copy.addLabel}
            </>
          )}
        </Button>
      </div>

      {documents.length === 0 && !isAdding && (
        <p className="text-sm mt-2 text-slate-500 italic">{copy.empty}</p>
      )}

      {documents.length > 0 && (
        <ul className="mt-2 space-y-2">
          {documents.map((document, index) => (
            <li
              key={document.id}
              className="flex items-center gap-3 rounded-md border bg-white p-2 text-sm"
            >
              {variant === "featured" && document.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={document.coverUrl}
                  alt=""
                  loading="lazy"
                  className="h-20 w-14 shrink-0 rounded border object-cover"
                />
              ) : (
                <File className="ml-1 h-4 w-4 shrink-0 text-sky-700" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{document.title}</p>
                <p className="text-xs text-slate-500">
                  {DOCUMENT_KIND_LABELS[document.kind]} · {document.pageCount}{" "}
                  {document.pageCount === 1 ? "página" : "páginas"}
                </p>
                {variant === "featured" && index === 0 && (
                  <p className="mt-1 text-xs font-medium text-sky-700">
                    Va en el encabezado de la página
                  </p>
                )}
              </div>
              <a
                href={document.pdfUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Abrir el PDF de ${document.title}`}
                className="shrink-0 rounded p-2 text-slate-500 hover:text-slate-900"
              >
                <Download className="h-4 w-4" />
              </a>
              <ConfirmModal onConfirm={() => onDelete(document.id)}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Eliminar ${document.title}`}
                  disabled={removingId === document.id}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </ConfirmModal>
            </li>
          ))}
        </ul>
      )}

      {isAdding && (
        <div className="mt-4 space-y-3">
          {!file ? (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-600 hover:border-slate-400">
              <File className="h-7 w-7 text-slate-400" />
              Elegir un PDF
              <input
                type="file"
                accept="application/pdf"
                className="sr-only"
                onChange={(event) => {
                  onPick(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </label>
          ) : (
            <>
              <p className="flex items-center gap-1.5 text-xs text-slate-600">
                <File className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{file.name}</span>
                <span className="shrink-0 text-slate-400">
                  · {(file.size / 1024 / 1024).toFixed(1)} MB
                </span>
              </p>
              <div className="flex gap-2">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Label htmlFor={`document-title-${variant}`}>Título</Label>
                  <Input
                    id={`document-title-${variant}`}
                    placeholder="Título del documento"
                    disabled={isUploading}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </div>
                {copy.kinds.length > 1 && (
                  <div className="w-36 shrink-0 space-y-1.5">
                    <Label htmlFor={`document-kind-${variant}`}>Tipo</Label>
                    <select
                      id={`document-kind-${variant}`}
                      className={selectClass}
                      disabled={isUploading}
                      value={kind}
                      onChange={(event) => setKind(event.target.value as DocumentKind)}
                    >
                      {copy.kinds.map((option) => (
                        <option key={option} value={option}>
                          {DOCUMENT_KIND_LABELS[option]}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-x-3">
                <Button type="button" onClick={onUpload} disabled={!title.trim() || isUploading}>
                  {isUploading && <Loading />}
                  Subir documento
                </Button>
                {progress && (
                  <span role="status" className="text-xs tabular-nums text-slate-600">
                    {progress}
                  </span>
                )}
              </div>
            </>
          )}
          <div className="text-xs text-muted-foreground">
            {copy.hint} Sube solo el PDF: el sistema arma las páginas para leerlo
            en el sitio.
          </div>
        </div>
      )}
    </div>
  );
};
