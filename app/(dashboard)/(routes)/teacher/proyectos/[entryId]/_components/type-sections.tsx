"use client";

import { PlusCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MODALITY_LABELS, formatDate, type Modality } from "@/lib/timeline";

import { EditCard } from "../../_components/edit-card";
import type { DraftPerson } from "../../_components/draft";
import type { SectionProps } from "./common-sections";

// ── Solo proyectos ──

export const PeopleSection = ({ draft, onChange }: SectionProps) => (
  <EditCard<DraftPerson[]>
    label="Personas clave"
    editLabel={draft.people.length ? "Editar personas" : "Añadir una persona"}
    value={draft.people}
    isEmpty={draft.people.length === 0}
    emptyText="Sin personas"
    optional
    view={(people) => (
      <ul className="space-y-1">
        {people.map((person, index) => (
          <li key={index}>
            {person.name}
            <span className="text-slate-500"> · {person.role}</span>
          </li>
        ))}
      </ul>
    )}
    edit={(people, setPeople) => {
      const update = (index: number, patch: Partial<DraftPerson>) =>
        setPeople(people.map((person, i) => (i === index ? { ...person, ...patch } : person)));

      return (
        <div className="space-y-3">
          {people.map((person, index) => (
            <div key={index} className="flex gap-2">
              <Input
                aria-label="Nombre"
                placeholder="Nombre"
                value={person.name}
                onChange={(event) => update(index, { name: event.target.value })}
              />
              <Input
                aria-label="Rol"
                placeholder="Rol en el proyecto"
                value={person.role}
                onChange={(event) => update(index, { role: event.target.value })}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Quitar persona"
                onClick={() => setPeople(people.filter((_, i) => i !== index))}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPeople([...people, { name: "", role: "" }])}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Añadir persona
          </Button>
          <div className="text-xs text-muted-foreground">
            Solo nombre y rol, y solo de quienes autorizaron aparecer.
          </div>
        </div>
      );
    }}
    validate={(people) =>
      people.some((person) => !person.name.trim() || !person.role.trim())
        ? "Cada persona necesita nombre y rol"
        : null
    }
    onSave={(people) =>
      onChange({
        people: people.map((person) => ({ name: person.name.trim(), role: person.role.trim() })),
      })
    }
  />
);

type StoryValue = { title: string; text: string };

export const StorySection = ({ draft, onChange }: SectionProps) => (
  <EditCard<StoryValue>
    label="Texto largo"
    editLabel={draft.story ? "Editar texto" : "Añadir texto"}
    value={{
      title: draft.story?.title ?? "",
      text: draft.story?.paragraphs.join("\n\n") ?? "",
    }}
    isEmpty={!draft.story}
    emptyText="Sin texto: la página muestra solo la descripción corta"
    optional
    view={(story) => (
      <div className="space-y-2">
        <p className="font-medium">{story.title}</p>
        <p className="line-clamp-4 whitespace-pre-line text-slate-700">{story.text}</p>
      </div>
    )}
    edit={(story, setStory) => (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="story-title">Subtítulo</Label>
          <Input
            id="story-title"
            placeholder="p.ej. 'Un periódico hecho por el barrio'"
            value={story.title}
            onChange={(event) => setStory({ ...story, title: event.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="story-text">Texto</Label>
          <Textarea
            id="story-text"
            rows={8}
            placeholder="Deja una línea en blanco entre párrafos."
            value={story.text}
            onChange={(event) => setStory({ ...story, text: event.target.value })}
          />
        </div>
      </div>
    )}
    validate={(story) =>
      Boolean(story.title.trim()) !== Boolean(story.text.trim())
        ? "El texto necesita subtítulo y al menos un párrafo"
        : null
    }
    onSave={(story) => {
      const paragraphs = story.text
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);
      // Guardar los dos campos vacíos quita el bloque de la página.
      return onChange({ story: paragraphs.length ? { title: story.title.trim(), paragraphs } : null });
    }}
  />
);

type QuoteValue = { text: string; author: string; role: string };

export const QuoteSection = ({ draft, onChange }: SectionProps) => (
  <EditCard<QuoteValue>
    label="Cita destacada"
    editLabel={draft.quote ? "Editar cita" : "Añadir cita"}
    value={{
      text: draft.quote?.text ?? "",
      author: draft.quote?.author ?? "",
      role: draft.quote?.role ?? "",
    }}
    isEmpty={!draft.quote}
    emptyText="Sin cita"
    optional
    view={(quote) => (
      <figure>
        <blockquote className="border-l-2 border-slate-300 pl-3 italic">“{quote.text}”</blockquote>
        <figcaption className="mt-1 text-slate-600">
          {quote.author}
          {quote.role && <span className="text-slate-500"> · {quote.role}</span>}
        </figcaption>
      </figure>
    )}
    edit={(quote, setQuote) => (
      <div className="space-y-3">
        <Textarea
          aria-label="Cita"
          rows={3}
          placeholder="Lo que dijo la persona, sin comillas"
          value={quote.text}
          onChange={(event) => setQuote({ ...quote, text: event.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            aria-label="Quién lo dijo"
            placeholder="Quién lo dijo"
            value={quote.author}
            onChange={(event) => setQuote({ ...quote, author: event.target.value })}
          />
          <Input
            aria-label="Rol"
            placeholder="Rol (opcional)"
            value={quote.role}
            onChange={(event) => setQuote({ ...quote, role: event.target.value })}
          />
        </div>
      </div>
    )}
    validate={(quote) =>
      Boolean(quote.text.trim()) !== Boolean(quote.author.trim())
        ? "La cita necesita el texto y quién lo dijo"
        : null
    }
    onSave={(quote) =>
      onChange({
        quote: quote.text.trim()
          ? {
              text: quote.text.trim(),
              author: quote.author.trim(),
              role: quote.role.trim() || undefined,
            }
          : null,
      })
    }
  />
);

export const AcknowledgementsSection = ({ draft, onChange }: SectionProps) => (
  <EditCard
    label="Agradecimientos"
    editLabel={draft.acknowledgements ? "Editar" : "Añadir"}
    value={draft.acknowledgements}
    isEmpty={!draft.acknowledgements}
    emptyText="Sin agradecimientos"
    optional
    view={(text) => text}
    edit={(text, setText) => (
      <Textarea
        rows={3}
        placeholder="A quién se agradece y por qué."
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
    )}
    onSave={(text) => onChange({ acknowledgements: text.trim() })}
  />
);

// ── Solo participaciones ──

const MODALITIES: Modality[] = ["in_person", "virtual", "hybrid"];

type WhenValue = { date: string; modality: Modality | null };

export const DateModalitySection = ({ draft, onChange }: SectionProps) => (
  <EditCard<WhenValue>
    label="Fecha y modalidad"
    editLabel="Editar"
    value={{ date: draft.participationDate, modality: draft.modality }}
    isEmpty={!draft.participationDate && !draft.modality}
    emptyText="Sin fecha"
    view={(when) => (
      <>
        {when.date ? formatDate(when.date) : "Sin fecha"}
        <span className="text-slate-500">
          {" · "}
          {when.modality ? MODALITY_LABELS[when.modality] : "Sin modalidad"}
        </span>
      </>
    )}
    edit={(when, setWhen) => (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="participation-date">Fecha en que participó el aula</Label>
          <Input
            id="participation-date"
            type="date"
            value={when.date}
            onChange={(event) => setWhen({ ...when, date: event.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Modalidad</Label>
          <div role="radiogroup" aria-label="Modalidad" className="grid grid-cols-3 gap-2">
            {MODALITIES.map((modality) => {
              const isSelected = when.modality === modality;
              return (
                <button
                  key={modality}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setWhen({ ...when, modality })}
                  className={cn(
                    "rounded-md border bg-white px-3 py-2 text-sm transition",
                    isSelected
                      ? "border-sky-700 font-medium text-sky-700 ring-1 ring-sky-700"
                      : "border-input text-slate-700 hover:border-slate-400"
                  )}
                >
                  {MODALITY_LABELS[modality]}
                </button>
              );
            })}
          </div>
        </div>
        {when.modality === "virtual" && (
          <p className="text-xs text-muted-foreground">
            Una participación virtual no lleva punto en el mapa: aparece solo en
            la línea de tiempo.
          </p>
        )}
      </div>
    )}
    validate={(when) =>
      !when.date ? "Se requiere la fecha" : !when.modality ? "Elige la modalidad" : null
    }
    onSave={(when) => {
      const year = Number(when.date.slice(0, 4));
      return onChange({
        participationDate: when.date,
        modality: when.modality,
        startYear: year,
        endYear: year,
        // Al pasar a virtual se suelta el punto que tuviera.
        ...(when.modality === "virtual" ? { latitude: null, longitude: null } : {}),
      });
    }}
  />
);

export const ReasonSection = ({ draft, onChange }: SectionProps) => (
  <EditCard
    label="Por qué se participó"
    editLabel={draft.reason ? "Editar" : "Añadir"}
    value={draft.reason}
    isEmpty={!draft.reason}
    optional
    view={(reason) => reason}
    edit={(reason, setReason) => (
      <Textarea
        rows={3}
        placeholder="Qué buscaba el aula en este espacio."
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
    )}
    onSave={(reason) => onChange({ reason: reason.trim() })}
  />
);

type SpeakerValue = { name: string; role: string };

export const SpeakerSection = ({ draft, onChange }: SectionProps) => (
  <EditCard<SpeakerValue>
    label="Ponente"
    editLabel={draft.speakerName ? "Editar ponente" : "Añadir ponente"}
    value={{ name: draft.speakerName, role: draft.speakerRole }}
    isEmpty={!draft.speakerName}
    emptyText="Sin ponente"
    optional
    view={(speaker) => (
      <>
        {speaker.name}
        {speaker.role && <span className="text-slate-500"> · {speaker.role}</span>}
      </>
    )}
    edit={(speaker, setSpeaker) => (
      <div className="grid grid-cols-2 gap-3">
        <Input
          aria-label="Nombre"
          placeholder="Nombre"
          value={speaker.name}
          onChange={(event) => setSpeaker({ ...speaker, name: event.target.value })}
        />
        <Input
          aria-label="Rol"
          placeholder="Rol en el aula"
          value={speaker.role}
          onChange={(event) => setSpeaker({ ...speaker, role: event.target.value })}
        />
      </div>
    )}
    validate={(speaker) =>
      speaker.role.trim() && !speaker.name.trim() ? "Falta el nombre del ponente" : null
    }
    onSave={(speaker) =>
      onChange({ speakerName: speaker.name.trim(), speakerRole: speaker.role.trim() })
    }
  />
);
