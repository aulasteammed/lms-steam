"use client";

import { useState, type ReactNode } from "react";
import { Pencil, PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Loading } from "@/components/loading";
import { cn } from "@/lib/utils";

interface EditCardProps<T> {
  /** "Título", "Descripción corta"… */
  label: string;
  /** Texto del botón: "Editar título", "Añadir una imagen"… */
  editLabel: string;
  value: T;
  /** Sin dato todavía: el botón invita a añadir y la vista va en gris. */
  isEmpty?: boolean;
  /** Qué se ve cuando no hay dato: un texto o, en las imágenes, un recuadro. */
  emptyText?: ReactNode;
  optional?: boolean;
  view: (value: T) => ReactNode;
  /** Campos del formulario, sobre una copia que solo se aplica al guardar. */
  edit: (draft: T, setDraft: (draft: T) => void) => ReactNode;
  /** Mensaje de error, o `null` si se puede guardar. */
  validate?: (draft: T) => string | null;
  /**
   * Guarda y responde si el servidor aceptó el cambio. La tarjeta se cierra de
   * inmediato y, si el guardado falla, se vuelve a abrir con lo que se escribió.
   */
  onSave: (value: T) => Promise<boolean>;
  /** Guardados que suben archivos: la tarjeta espera abierta, con el botón ocupado. */
  waitForSave?: boolean;
}

/**
 * Tarjeta de un campo: muestra el valor y, al editar, su formulario. Es la
 * misma tarjeta de la configuración de un curso (`title-form.tsx` y demás).
 */
export function EditCard<T>({
  label,
  editLabel,
  value,
  isEmpty = false,
  emptyText = "Sin información",
  optional = false,
  view,
  edit,
  validate,
  onSave,
  waitForSave = false,
}: EditCardProps<T>) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  // El mensaje de error espera al primer cambio; antes solo se apaga "Guardar".
  const [isTouched, setIsTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const toggleEdit = () => {
    setDraft(value);
    setIsTouched(false);
    setIsEditing((current) => !current);
  };

  const error = isEditing ? (validate?.(draft) ?? null) : null;

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        <span>
          {label}
          {optional && (
            <span className="ml-2 text-xs font-normal text-slate-500">Opcional</span>
          )}
        </span>
        <Button onClick={toggleEdit} variant="ghost" disabled={isSaving}>
          {isEditing ? (
            <>Cancelar</>
          ) : (
            <>
              {isEmpty ? (
                <PlusCircle className="h-4 w-4 mr-2" />
              ) : (
                <Pencil className="h-4 w-4 mr-2" />
              )}
              {editLabel}
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <div
          className={cn(
            "text-sm mt-2",
            isEmpty && typeof emptyText === "string" && "text-slate-500 italic"
          )}
        >
          {isEmpty ? emptyText : view(value)}
        </div>
      )}
      {isEditing && (
        <form
          className="space-y-4 mt-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (error || isSaving) return;
            if (!waitForSave) {
              setIsEditing(false);
              if (!(await onSave(draft))) setIsEditing(true);
              return;
            }
            setIsSaving(true);
            const saved = await onSave(draft);
            setIsSaving(false);
            if (saved) setIsEditing(false);
          }}
        >
          {edit(draft, (next) => {
            setDraft(next);
            setIsTouched(true);
          })}
          {error && isTouched && <p className="text-sm font-medium text-destructive">{error}</p>}
          <div className="flex items-center gap-x-2">
            <Button disabled={Boolean(error) || isSaving} type="submit">
              {isSaving && <Loading />}
              Guardar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
