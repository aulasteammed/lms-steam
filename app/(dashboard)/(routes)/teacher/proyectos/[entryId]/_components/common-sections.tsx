"use client";

import { useState } from "react";
import { ImageIcon, PlusCircle, X } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { TYPE_LABELS, type EntryType } from "@/lib/timeline";
import { uploadImages } from "@/lib/timeline-upload";
import { discardUploads } from "@/actions/timeline";
import { MiniMap } from "@/app/(dashboard)/(routes)/proyectos/[id]/_components/mini-map";
import { TYPE_STYLES } from "@/app/(dashboard)/(routes)/proyectos/_components/entry-type";

import { EditCard } from "../../_components/edit-card";
import {
  SHORT_DESCRIPTION_MAX,
  draftPeriodLabel,
  maxImages,
  type DraftImage,
  type EntryDraft,
  type EntryPatch,
} from "../../_components/draft";

export type SectionProps = {
  draft: EntryDraft;
  /** Guarda los campos de una tarjeta y responde si el servidor los aceptó. */
  onChange: (patch: EntryPatch) => Promise<boolean>;
};

const TITLE_LABELS: Record<EntryType, { label: string; placeholder: string }> = {
  project: { label: "Nombre del proyecto", placeholder: "p.ej. 'Entre Aguas'" },
  participation: {
    label: "Nombre del evento y edición",
    placeholder: "p.ej. 'Congreso Nacional de Educación STEAM · 2025'",
  },
  alliance: { label: "Nombre de la alianza", placeholder: "p.ej. 'Parque Explora'" },
};

export const TitleSection = ({ draft, onChange }: SectionProps) => (
  <EditCard
    label={TITLE_LABELS[draft.type].label}
    editLabel="Editar nombre"
    value={draft.title}
    view={(title) => title}
    edit={(title, setTitle) => (
      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder={TITLE_LABELS[draft.type].placeholder}
      />
    )}
    validate={(title) => (title.trim() ? null : "Se requiere nombre")}
    onSave={(title) => onChange({ title: title.trim() })}
  />
);

export const ShortDescriptionSection = ({ draft, onChange }: SectionProps) => (
  <EditCard
    label="Descripción corta"
    editLabel="Editar descripción"
    value={draft.shortDescription}
    isEmpty={!draft.shortDescription}
    emptyText="Sin descripción"
    view={(description) => description}
    edit={(description, setDescription) => (
      <div>
        <Textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Qué fue, con quién y para qué, en una o dos frases."
          rows={4}
        />
        <p
          className={cn(
            "mt-1 text-right text-xs tabular-nums text-muted-foreground",
            description.length > SHORT_DESCRIPTION_MAX && "font-medium text-destructive"
          )}
        >
          {description.length}/{SHORT_DESCRIPTION_MAX}
        </p>
      </div>
    )}
    validate={(description) =>
      !description.trim()
        ? "Se requiere descripción"
        : description.length > SHORT_DESCRIPTION_MAX
          ? `Máximo ${SHORT_DESCRIPTION_MAX} caracteres`
          : null
    }
    onSave={(description) => onChange({ shortDescription: description.trim() })}
  />
);

type PeriodValue = { startYear: string; endYear: string; ongoing: boolean };

const isYear = (value: string) => /^(19|20)\d{2}$/.test(value);

/** Proyectos y alianzas. En las participaciones el año sale de la fecha. */
export const PeriodSection = ({ draft, onChange }: SectionProps) => (
  <EditCard<PeriodValue>
    label="Periodo"
    editLabel="Editar periodo"
    value={{
      startYear: draft.startYear ? String(draft.startYear) : "",
      endYear: draft.endYear ? String(draft.endYear) : "",
      ongoing: draft.startYear !== null && draft.endYear === null,
    }}
    isEmpty={draft.startYear === null}
    emptyText="Sin periodo"
    view={() => draftPeriodLabel(draft)}
    edit={(period, setPeriod) => (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="period-start">Año de inicio</Label>
            <Input
              id="period-start"
              inputMode="numeric"
              maxLength={4}
              placeholder="2024"
              value={period.startYear}
              onChange={(event) => setPeriod({ ...period, startYear: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="period-end">Año de cierre</Label>
            <Input
              id="period-end"
              inputMode="numeric"
              maxLength={4}
              placeholder={period.ongoing ? "En curso" : "2026"}
              disabled={period.ongoing}
              value={period.ongoing ? "" : period.endYear}
              onChange={(event) => setPeriod({ ...period, endYear: event.target.value })}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="period-ongoing"
            checked={period.ongoing}
            onCheckedChange={(checked) => setPeriod({ ...period, ongoing: checked === true })}
          />
          <Label htmlFor="period-ongoing" className="font-normal">
            Sigue en curso
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Si duró un solo año, escribe el mismo año en los dos campos. En la línea
          de tiempo aparece en el año de cierre.
        </p>
      </div>
    )}
    validate={(period) => {
      if (!isYear(period.startYear)) return "Escribe el año de inicio con 4 cifras";
      if (period.ongoing) return null;
      if (!isYear(period.endYear)) return "Escribe el año de cierre o marca que sigue en curso";
      if (Number(period.endYear) < Number(period.startYear)) {
        return "El año de cierre no puede ser anterior al de inicio";
      }
      return null;
    }}
    onSave={(period) =>
      onChange({
        startYear: Number(period.startYear),
        endYear: period.ongoing ? null : Number(period.endYear),
      })
    }
  />
);

/** La foto se reduce antes de subirla, así que el original puede pesar bastante. */
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

/** Una imagen recién elegida lleva su archivo hasta que se guarda la tarjeta. */
type EditImage = DraftImage & { file?: File };

export const ImagesSection = ({ draft, onChange }: SectionProps) => {
  const max = maxImages(draft.type);
  const [fileError, setFileError] = useState<string | null>(null);

  return (
    <EditCard<EditImage[]>
      waitForSave
      label={max > 1 ? `Imágenes (máximo ${max})` : "Imagen"}
      editLabel={draft.images.length ? "Editar imágenes" : "Añadir una imagen"}
      value={draft.images}
      isEmpty={draft.images.length === 0}
      emptyText={
        <div className="flex items-center justify-center h-60 bg-slate-200 rounded-md">
          <ImageIcon className="h-10 w-10 text-slate-500" />
        </div>
      }
      view={(images) => (
        <div className={cn("grid gap-3", max > 1 && "sm:grid-cols-2")}>
          {images.map((image) => (
            <figure key={image.url}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.alt}
                className="aspect-video w-full rounded-md object-cover"
              />
              <figcaption className="mt-1 text-xs text-slate-600">
                {image.alt}
                {image.credit && <span className="text-slate-400"> · {image.credit}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
      edit={(images, setImages) => {
        const update = (index: number, patch: Partial<EditImage>) =>
          setImages(images.map((image, i) => (i === index ? { ...image, ...patch } : image)));

        return (
          <div className="space-y-4">
            {images.map((image, index) => (
              <div key={image.url} className="flex gap-3 rounded-md border bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt=""
                  className="h-20 w-28 shrink-0 rounded object-cover"
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <Input
                    aria-label="Descripción de la imagen"
                    placeholder="Qué se ve en la imagen (una frase)"
                    value={image.alt}
                    onChange={(event) => update(index, { alt: event.target.value })}
                  />
                  <Input
                    aria-label="Autor y año de la foto"
                    placeholder="Autor y año de la foto (opcional)"
                    value={image.credit ?? ""}
                    onChange={(event) => update(index, { credit: event.target.value || undefined })}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Quitar imagen"
                  onClick={() => setImages(images.filter((_, i) => i !== index))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {images.length < max && (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-white px-4 py-8 text-sm text-slate-600 hover:border-slate-400">
                <ImageIcon className="h-8 w-8 text-slate-400" />
                Elegir una imagen
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    if (file.size > MAX_IMAGE_BYTES) {
                      setFileError("La imagen pesa más de 15 MB");
                      return;
                    }
                    setFileError(null);
                    // Se sube al guardar la tarjeta; mientras, se ve desde el equipo.
                    setImages([...images, { url: URL.createObjectURL(file), alt: "", file }]);
                  }}
                />
              </label>
            )}
            {fileError && <p className="text-sm font-medium text-destructive">{fileError}</p>}
            <div className="text-xs text-muted-foreground">
              La imagen se reduce sola al guardar. La descripción la leen los lectores
              de pantalla y los buscadores.
            </div>
          </div>
        );
      }}
      validate={(images) =>
        images.some((image) => !image.alt.trim()) ? "Cada imagen necesita su descripción" : null
      }
      onSave={async (images) => {
        const pending = images.filter((image) => image.file);
        let uploaded: string[];
        try {
          uploaded = await uploadImages(pending.map((image) => image.file as File));
        } catch {
          toast.error("No se pudo subir la imagen");
          return false;
        }

        const saved = await onChange({
          images: images.map(({ file, ...image }) => ({
            ...image,
            url: file ? uploaded[pending.findIndex((p) => p.file === file)] : image.url,
            alt: image.alt.trim(),
          })),
        });
        if (saved) pending.forEach((image) => URL.revokeObjectURL(image.url));
        else void discardUploads(uploaded);
        return saved;
      }}
    />
  );
};

/**
 * Saca latitud y longitud de un enlace largo de Google Maps
 * ("…/@6.2616,-75.5773,17z", "…!3d6.2616!4d-75.5773", "?q=6.2616,-75.5773")
 * o del par "6.2616, -75.5773".
 */
const parseCoordinates = (text: string): { latitude: number; longitude: number } | null => {
  const number = "(-?\\d{1,3}(?:\\.\\d+)?)";
  const patterns = [
    new RegExp(`!3d${number}!4d${number}`),
    new RegExp(`@${number},${number}`),
    new RegExp(`[?&](?:q|ll|query)=${number},${number}`),
    new RegExp(`^\\s*${number}\\s*[,;]\\s*${number}\\s*$`),
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const latitude = Number(match[1]);
    const longitude = Number(match[2]);
    if (Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) return { latitude, longitude };
  }
  return null;
};

type LocationValue = { locationText: string; point: string };

export const LocationSection = ({ draft, onChange }: SectionProps) => {
  // Una participación virtual no tiene punto: va en la línea de tiempo, no en el mapa.
  const isVirtual = draft.type === "participation" && draft.modality === "virtual";
  const hasPoint = draft.latitude !== null && draft.longitude !== null;

  return (
    <EditCard<LocationValue>
      label="Ubicación"
      editLabel="Editar ubicación"
      value={{
        locationText: draft.locationText,
        point: hasPoint ? `${draft.latitude}, ${draft.longitude}` : "",
      }}
      isEmpty={!draft.locationText}
      emptyText="Sin ubicación"
      view={(location) => (
        <div className="space-y-3">
          {isVirtual ? (
            <p>{location.locationText} · no aparece en el mapa, solo en la línea de tiempo</p>
          ) : hasPoint ? (
            <div className="max-w-xs">
              <MiniMap
                coordinates={[draft.longitude as number, draft.latitude as number]}
                place={location.locationText}
                showLink={false}
              />
            </div>
          ) : (
            <>
              <p>{location.locationText}</p>
              <p className="italic text-slate-500">Falta el punto en el mapa</p>
            </>
          )}
        </div>
      )}
      edit={(location, setLocation) => {
        const parsed = parseCoordinates(location.point);
        return (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="location-text">Lugar</Label>
              <Input
                id="location-text"
                placeholder={
                  isVirtual ? "Virtual" : "p.ej. 'Santo Domingo Savio, Comuna 1, Medellín'"
                }
                value={location.locationText}
                onChange={(event) => setLocation({ ...location, locationText: event.target.value })}
              />
            </div>
            {!isVirtual && (
              <div className="space-y-1.5">
                <Label htmlFor="location-point">Punto exacto</Label>
                <Input
                  id="location-point"
                  placeholder="Enlace de Google Maps o coordenadas (6.2616, -75.5773)"
                  value={location.point}
                  onChange={(event) => setLocation({ ...location, point: event.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  {parsed
                    ? `Punto encontrado: latitud ${parsed.latitude}, longitud ${parsed.longitude}`
                    : "En Google Maps, haz clic derecho sobre el lugar y copia las coordenadas, o pega el enlace completo de la barra de direcciones."}
                </p>
              </div>
            )}
          </div>
        );
      }}
      validate={(location) => {
        if (!location.locationText.trim()) return "Se requiere el lugar";
        if (isVirtual) return null;
        if (!location.point.trim()) return "Se requiere el punto exacto";
        if (/goo\.gl/.test(location.point)) {
          return "Ese enlace es corto y no trae el punto: ábrelo y copia el enlace completo o las coordenadas";
        }
        return parseCoordinates(location.point) ? null : "No se encontraron coordenadas en ese texto";
      }}
      onSave={(location) => {
        const parsed = isVirtual ? null : parseCoordinates(location.point);
        return onChange({
          locationText: location.locationText.trim(),
          latitude: parsed?.latitude ?? null,
          longitude: parsed?.longitude ?? null,
        });
      }}
    />
  );
};

const INSTITUTION_LABELS: Record<EntryType, { label: string; empty: string }> = {
  project: { label: "Instituciones involucradas", empty: "Sin instituciones" },
  participation: { label: "Quién organizó", empty: "Sin organizador" },
  alliance: { label: "Institución aliada", empty: "Sin institución" },
};

type InstitutionsSectionProps = SectionProps & {
  /** Instituciones ya registradas: se sugieren al escribir para no duplicarlas. */
  knownInstitutions: string[];
};

export const InstitutionsSection = ({
  draft,
  onChange,
  knownInstitutions,
}: InstitutionsSectionProps) => {
  const [name, setName] = useState("");
  // Una alianza es con una sola institución.
  const max = draft.type === "alliance" ? 1 : Infinity;

  return (
    <EditCard<string[]>
      label={INSTITUTION_LABELS[draft.type].label}
      editLabel={draft.institutions.length ? "Editar" : "Añadir"}
      value={draft.institutions}
      isEmpty={draft.institutions.length === 0}
      emptyText={INSTITUTION_LABELS[draft.type].empty}
      optional={draft.type !== "alliance"}
      view={(institutions) => (
        <ul className="list-disc space-y-1 pl-5">
          {institutions.map((institution) => (
            <li key={institution}>{institution}</li>
          ))}
        </ul>
      )}
      edit={(institutions, setInstitutions) => {
        const add = () => {
          const clean = name.trim();
          if (!clean) return;
          const exists = institutions.some(
            (institution) => institution.toLowerCase() === clean.toLowerCase()
          );
          if (!exists) setInstitutions([...institutions, clean]);
          setName("");
        };

        return (
          <div className="space-y-3">
            {institutions.length > 0 && (
              <ul className="space-y-2">
                {institutions.map((institution) => (
                  <li
                    key={institution}
                    className="flex items-center justify-between gap-2 rounded-md border bg-white px-3 py-1.5 text-sm"
                  >
                    {institution}
                    <button
                      type="button"
                      aria-label={`Quitar ${institution}`}
                      className="text-slate-500 hover:text-slate-900"
                      onClick={() => setInstitutions(institutions.filter((i) => i !== institution))}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {institutions.length < max && (
              <div className="flex gap-2">
                <Input
                  list="known-institutions"
                  placeholder="Nombre completo, sin siglas sueltas"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      add();
                    }
                  }}
                />
                <datalist id="known-institutions">
                  {knownInstitutions.map((institution) => (
                    <option key={institution} value={institution} />
                  ))}
                </datalist>
                <Button type="button" variant="outline" onClick={add} disabled={!name.trim()}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Añadir
                </Button>
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Al escribir aparecen las instituciones ya registradas. Elige la que
              exista antes de crear una nueva.
            </div>
          </div>
        );
      }}
      onSave={(institutions) => onChange({ institutions })}
    />
  );
};

export type RelatedOption = { id: string; title: string; type: EntryType };

type RelatedSectionProps = SectionProps & {
  /** Proyectos y participaciones con los que se puede relacionar el registro. */
  options: RelatedOption[];
};

/** Participaciones y alianzas: proyectos o participaciones en conjunto. */
export const RelatedSection = ({ draft, onChange, options }: RelatedSectionProps) => {
  const available = options.filter((option) => option.id !== draft.id);

  return (
    <EditCard<string[]>
      label="Proyectos y participaciones relacionados"
      editLabel={draft.relatedEntryIds.length ? "Editar" : "Añadir"}
      value={draft.relatedEntryIds}
      isEmpty={draft.relatedEntryIds.length === 0}
      emptyText="Sin registros relacionados"
      optional
      view={(ids) => (
        <ul className="space-y-1.5">
          {available
            .filter((option) => ids.includes(option.id))
            .map((option) => (
              <li key={option.id} className="flex items-center gap-2">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", TYPE_STYLES[option.type].dot)} />
                {option.title}
              </li>
            ))}
        </ul>
      )}
      edit={(ids, setIds) => (
        <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border bg-white p-3">
          {available.length === 0 && (
            <p className="text-sm italic text-slate-500">Todavía no hay otros registros.</p>
          )}
          {available.map((option) => (
            <div key={option.id} className="flex items-start gap-2">
              <Checkbox
                id={`related-${option.id}`}
                className="mt-0.5"
                checked={ids.includes(option.id)}
                onCheckedChange={(checked) =>
                  setIds(
                    checked === true ? [...ids, option.id] : ids.filter((id) => id !== option.id)
                  )
                }
              />
              <Label htmlFor={`related-${option.id}`} className="font-normal leading-snug">
                {option.title}
                <span className="ml-1.5 text-xs text-slate-500">
                  {TYPE_LABELS[option.type].singular}
                </span>
              </Label>
            </div>
          ))}
        </div>
      )}
      onSave={(relatedEntryIds) => onChange({ relatedEntryIds })}
    />
  );
};
